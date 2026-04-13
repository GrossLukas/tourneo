import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/environment';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: Array<{ field: string; message: string }>): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string = 'Insufficient permissions'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message);
  }

  static tooMany(message: string = 'Too many requests'): AppError {
    return new AppError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }

  static paymentFailed(message: string): AppError {
    return new AppError(402, 'PAYMENT_FAILED', message);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  if (env.isDevelopment) {
    console.error('Error:', err);
  } else {
    console.error('Error:', err.message);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details,
      },
    });
    return;
  }

  // Custom app errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // MySQL/MariaDB duplicate entry
  if ((err as any).code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists',
      },
    });
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isDevelopment ? err.message : 'An unexpected error occurred',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
}