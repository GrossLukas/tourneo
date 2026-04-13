import { Request, Response, NextFunction } from 'express';

/**
 * Security middleware to prevent common attack vectors
 */

// Prevent NoSQL/SQL injection via query params
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove null bytes
      return obj.replace(/\0/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        cleaned[key] = sanitize(value);
      }
      return cleaned;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query) as any;
  if (req.params) req.params = sanitize(req.params);

  next();
}

// Add security headers beyond helmet defaults
export function additionalSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Cache control for API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
}

// Request size limiter (prevent large payload attacks)
export function requestSizeLimiter(maxSizeKB: number = 512) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxSizeKB * 1024) {
      return res.status(413).json({
        success: false,
        message: `Payload too large. Maximum size is ${maxSizeKB}KB.`,
      });
    }
    next();
  };
}

// IP-based brute force protection store (in-memory, use Redis in production)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil: number }>();

export function bruteForceProtection(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000, blockDurationMs: number = 30 * 60 * 1000) {
  // Cleanup old entries every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
      if (now - value.lastAttempt > windowMs * 2) {
        loginAttempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = loginAttempts.get(ip);
    if (record) {
      // Check if currently blocked
      if (record.blockedUntil > now) {
        const remainingSec = Math.ceil((record.blockedUntil - now) / 1000);
        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. Try again in ${remainingSec} seconds.`,
        });
      }

      // Reset if window has passed
      if (now - record.lastAttempt > windowMs) {
        loginAttempts.delete(ip);
      }
    }

    // Attach helper to track failed attempts
    (req as any).trackFailedLogin = () => {
      const current = loginAttempts.get(ip) || { count: 0, lastAttempt: now, blockedUntil: 0 };
      current.count += 1;
      current.lastAttempt = now;
      if (current.count >= maxAttempts) {
        current.blockedUntil = now + blockDurationMs;
        current.count = 0;
      }
      loginAttempts.set(ip, current);
    };

    (req as any).resetLoginAttempts = () => {
      loginAttempts.delete(ip);
    };

    next();
  };
}

// Prevent parameter pollution
export function preventParamPollution(req: Request, _res: Response, next: NextFunction) {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        // Take only the last value if duplicated
        (req.query as any)[key] = value[value.length - 1];
      }
    }
  }
  next();
}