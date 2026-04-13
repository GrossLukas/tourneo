import { Request, Response, NextFunction } from 'express';
import {
  sanitizeInput,
  additionalSecurityHeaders,
  requestSizeLimiter,
  bruteForceProtection,
  preventParamPollution,
} from '../../middleware/security';

// Helper to create mock Express objects
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

function mockNext(): NextFunction {
  return jest.fn();
}

// ─────────────────────────────────────────────────────────────
// sanitizeInput
// ─────────────────────────────────────────────────────────────
describe('sanitizeInput', () => {
  it('should call next() for clean input', () => {
    const req = mockReq({ body: { name: 'Lukas', email: 'test@example.com' } });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.name).toBe('Lukas');
    expect(req.body.email).toBe('test@example.com');
  });

  it('should remove null bytes from strings', () => {
    const req = mockReq({ body: { name: 'Lukas\0Gross' } });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(req.body.name).toBe('LukasGross');
    expect(next).toHaveBeenCalled();
  });

  it('should strip prototype pollution keys from body', () => {
    const req = mockReq({
      body: {
        name: 'test',
        __proto__: { admin: true },
        constructor: { prototype: { admin: true } },
        prototype: { admin: true },
      },
    });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    // After sanitization, dangerous keys should not be own properties of the cleaned object
    expect(Object.prototype.hasOwnProperty.call(req.body, 'prototype')).toBe(false);
    // constructor is a built-in property on all objects, but the malicious one should be stripped
    expect(req.body.name).toBe('test');
    expect(next).toHaveBeenCalled();
  });

  it('should sanitize nested objects', () => {
    const req = mockReq({
      body: {
        user: {
          name: 'test\0',
          __proto__: { admin: true },
        },
      },
    });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(req.body.user.name).toBe('test');
    // The sanitized nested object should not have 'prototype' as own property
    expect(Object.prototype.hasOwnProperty.call(req.body.user, 'prototype')).toBe(false);
  });

  it('should sanitize arrays', () => {
    const req = mockReq({
      body: { tags: ['valid', 'also\0valid', 'test'] },
    });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(req.body.tags).toEqual(['valid', 'alsovalid', 'test']);
  });

  it('should sanitize query parameters', () => {
    const req = mockReq({
      query: { search: 'test\0query', __proto__: 'hack' } as any,
    });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(req.query.search).toBe('testquery');
  });

  it('should sanitize route params', () => {
    const req = mockReq({
      params: { id: '123\x00456' } as any,
    });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(req.params.id).toBe('123456');
  });

  it('should pass through numbers and booleans unchanged', () => {
    const req = mockReq({
      body: { count: 42, active: true, score: 3.14 },
    });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
    expect(req.body.score).toBe(3.14);
  });

  it('should handle null body gracefully', () => {
    const req = mockReq({ body: null as any });
    const res = mockRes();
    const next = mockNext();
    sanitizeInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// additionalSecurityHeaders
// ─────────────────────────────────────────────────────────────
describe('additionalSecurityHeaders', () => {
  it('should set all required security headers', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    additionalSecurityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    expect(res.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Expires', '0');
    expect(next).toHaveBeenCalled();
  });

  it('should set exactly 8 headers', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    additionalSecurityHeaders(req, res, next);
    expect(res.setHeader).toHaveBeenCalledTimes(8);
  });
});

// ─────────────────────────────────────────────────────────────
// requestSizeLimiter
// ─────────────────────────────────────────────────────────────
describe('requestSizeLimiter', () => {
  it('should allow requests within size limit', () => {
    const middleware = requestSizeLimiter(512);
    const req = mockReq({ headers: { 'content-length': '1024' } as any });
    const res = mockRes();
    const next = mockNext();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject requests exceeding size limit', () => {
    const middleware = requestSizeLimiter(1); // 1KB limit
    const req = mockReq({ headers: { 'content-length': '2048' } as any }); // 2KB
    const res = mockRes();
    const next = mockNext();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow requests with no content-length header', () => {
    const middleware = requestSizeLimiter(512);
    const req = mockReq({ headers: {} as any });
    const res = mockRes();
    const next = mockNext();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should use default 512KB limit when no argument provided', () => {
    const middleware = requestSizeLimiter();
    const req = mockReq({ headers: { 'content-length': '100000' } as any }); // ~100KB
    const res = mockRes();
    const next = mockNext();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject when exactly at boundary + 1', () => {
    const middleware = requestSizeLimiter(1); // 1KB = 1024 bytes
    const req = mockReq({ headers: { 'content-length': '1025' } as any });
    const res = mockRes();
    const next = mockNext();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it('should allow when exactly at boundary', () => {
    const middleware = requestSizeLimiter(1); // 1KB = 1024 bytes
    const req = mockReq({ headers: { 'content-length': '1024' } as any });
    const res = mockRes();
    const next = mockNext();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// bruteForceProtection
// ─────────────────────────────────────────────────────────────
describe('bruteForceProtection', () => {
  it('should allow initial request and attach helper functions', () => {
    const middleware = bruteForceProtection(3, 60000, 120000);
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).trackFailedLogin).toBeDefined();
    expect((req as any).resetLoginAttempts).toBeDefined();
  });

  it('should block after max failed attempts', () => {
    const middleware = bruteForceProtection(2, 60000, 120000);
    const ip = '192.168.1.' + Math.floor(Math.random() * 255);

    // First attempt
    const req1 = mockReq({ ip } as any);
    const res1 = mockRes();
    const next1 = mockNext();
    middleware(req1, res1, next1);
    expect(next1).toHaveBeenCalled();
    (req1 as any).trackFailedLogin();

    // Second attempt (should trigger block)
    const req2 = mockReq({ ip } as any);
    const res2 = mockRes();
    const next2 = mockNext();
    middleware(req2, res2, next2);
    expect(next2).toHaveBeenCalled();
    (req2 as any).trackFailedLogin();

    // Third attempt (should be blocked)
    const req3 = mockReq({ ip } as any);
    const res3 = mockRes();
    const next3 = mockNext();
    middleware(req3, res3, next3);
    expect(res3.status).toHaveBeenCalledWith(429);
    expect(res3.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('should reset attempts on successful login', () => {
    const middleware = bruteForceProtection(3, 60000, 120000);
    const ip = '10.0.0.' + Math.floor(Math.random() * 255);

    // Fail twice
    const req1 = mockReq({ ip } as any);
    const res1 = mockRes();
    const next1 = mockNext();
    middleware(req1, res1, next1);
    (req1 as any).trackFailedLogin();

    const req2 = mockReq({ ip } as any);
    const res2 = mockRes();
    const next2 = mockNext();
    middleware(req2, res2, next2);
    (req2 as any).trackFailedLogin();

    // Reset (successful login)
    (req2 as any).resetLoginAttempts();

    // Should not be blocked
    const req3 = mockReq({ ip } as any);
    const res3 = mockRes();
    const next3 = mockNext();
    middleware(req3, res3, next3);
    expect(next3).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// preventParamPollution
// ─────────────────────────────────────────────────────────────
describe('preventParamPollution', () => {
  it('should keep single values unchanged', () => {
    const req = mockReq({ query: { page: '1', sort: 'date' } as any });
    const res = mockRes();
    const next = mockNext();
    preventParamPollution(req, res, next);
    expect(req.query.page).toBe('1');
    expect(req.query.sort).toBe('date');
    expect(next).toHaveBeenCalled();
  });

  it('should take last value for duplicate params', () => {
    const req = mockReq({
      query: { sort: ['name', 'date', 'price'] } as any,
    });
    const res = mockRes();
    const next = mockNext();
    preventParamPollution(req, res, next);
    expect(req.query.sort).toBe('price');
  });

  it('should handle empty query gracefully', () => {
    const req = mockReq({ query: {} as any });
    const res = mockRes();
    const next = mockNext();
    preventParamPollution(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should handle mixed single and duplicate params', () => {
    const req = mockReq({
      query: {
        page: '1',
        sort: ['name', 'date'],
        filter: 'active',
      } as any,
    });
    const res = mockRes();
    const next = mockNext();
    preventParamPollution(req, res, next);
    expect(req.query.page).toBe('1');
    expect(req.query.sort).toBe('date');
    expect(req.query.filter).toBe('active');
  });
});