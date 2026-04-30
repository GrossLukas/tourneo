import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { AuthTokenPayload, UserRole } from '../types';
import { db, t } from '../config/database';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is required',
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as AuthTokenPayload;
    const user = await db(t('users'))
      .where('id', payload.userId)
      .select('id', 'uuid', 'email', 'role', 'status')
      .first();

    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive',
        },
      });
      return;
    }

    req.user = {
      ...payload,
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      },
    });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, env.jwt.accessSecret) as AuthTokenPayload;
      const user = await db(t('users'))
        .where('id', payload.userId)
        .select('id', 'uuid', 'email', 'role', 'status')
        .first();
      if (user?.status === 'active') {
        req.user = {
          ...payload,
          uuid: user.uuid,
          email: user.email,
          role: user.role,
        };
      }
    } catch {
      // Token invalid, continue without user
    }
  }

  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  authorize('admin', 'superadmin')(req, res, next);
}

export function superadminOnly(req: Request, res: Response, next: NextFunction): void {
  authorize('superadmin')(req, res, next);
}
