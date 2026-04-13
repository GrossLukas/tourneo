import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssueCode } from 'zod';
import { AppError, errorHandler, notFoundHandler } from '../../middleware/errorHandler';

// Mock environment
jest.mock('../../config/environment', () => ({
  env: {
    isDevelopment: false,
    nodeEnv: 'test',
  },
}));

function mockReq(): Request {
  return {} as Request;
}

function mockRes(): Response {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

function mockNext(): NextFunction {
  return jest.fn();
}

// ─────────────────────────────────────────────────────────────
// AppError static constructors
// ─────────────────────────────────────────────────────────────
describe('AppError', () => {
  it('should create badRequest error (400)', () => {
    const err = AppError.badRequest('Invalid data');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('Invalid data');
  });

  it('should create badRequest with details', () => {
    const details = [{ field: 'email', message: 'Required' }];
    const err = AppError.badRequest('Invalid data', details);
    expect(err.details).toEqual(details);
  });

  it('should create unauthorized error (401)', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Authentication required');
  });

  it('should create unauthorized with custom message', () => {
    const err = AppError.unauthorized('Token expired');
    expect(err.message).toBe('Token expired');
  });

  it('should create forbidden error (403)', () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('should create notFound error (404)', () => {
    const err = AppError.notFound('Event');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Event not found');
  });

  it('should create notFound with default resource', () => {
    const err = AppError.notFound();
    expect(err.message).toBe('Resource not found');
  });

  it('should create conflict error (409)', () => {
    const err = AppError.conflict('Already registered');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('should create tooMany error (429)', () => {
    const err = AppError.tooMany();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('TOO_MANY_REQUESTS');
  });

  it('should create internal error (500)', () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('should create paymentFailed error (402)', () => {
    const err = AppError.paymentFailed('Card declined');
    expect(err.statusCode).toBe(402);
    expect(err.code).toBe('PAYMENT_FAILED');
    expect(err.message).toBe('Card declined');
  });

  it('should be an instance of Error', () => {
    const err = AppError.badRequest('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

// ─────────────────────────────────────────────────────────────
// errorHandler middleware
// ─────────────────────────────────────────────────────────────
describe('errorHandler', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle ZodError with validation details', () => {
    const zodError = new ZodError([
      {
        code: ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'number',
        path: ['email'],
        message: 'Expected string, received number',
      },
      {
        code: ZodIssueCode.too_small,
        minimum: 8,
        type: 'string',
        inclusive: true,
        exact: false,
        path: ['password'],
        message: 'String must contain at least 8 character(s)',
      },
    ]);

    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: [
          { field: 'email', message: 'Expected string, received number' },
          { field: 'password', message: 'String must contain at least 8 character(s)' },
        ],
      },
    });
  });

  it('should handle AppError with correct status and structure', () => {
    const appError = AppError.notFound('Tournament');
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(appError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Tournament not found',
      },
    });
  });

  it('should handle AppError with details', () => {
    const details = [{ field: 'email', message: 'Already exists' }];
    const appError = AppError.badRequest('Validation failed', details);
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(appError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details,
      },
    });
  });

  it('should handle MySQL duplicate entry error', () => {
    const dbError = new Error('Duplicate entry') as any;
    dbError.code = 'ER_DUP_ENTRY';
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(dbError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists',
      },
    });
  });

  it('should handle generic errors with 500 status', () => {
    const genericError = new Error('Something broke');
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(genericError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });
});

// ─────────────────────────────────────────────────────────────
// notFoundHandler
// ─────────────────────────────────────────────────────────────
describe('notFoundHandler', () => {
  it('should return 404 with route not found message', () => {
    const req = mockReq();
    const res = mockRes();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested endpoint does not exist',
      },
    });
  });
});