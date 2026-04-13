import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateBody, validateQuery, validateParams } from '../../middleware/validate';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

// ─────────────────────────────────────────────────────────────
// validate
// ─────────────────────────────────────────────────────────────
describe('validate', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it('should pass valid body data and replace req.body with parsed data', () => {
    const req = mockReq({ body: { name: 'Lukas', age: 28 } });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validate(schema, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Lukas', age: 28 });
  });

  it('should call next with error for invalid body data', () => {
    const req = mockReq({ body: { name: '', age: -5 } });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validate(schema, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });

  it('should validate query parameters', () => {
    const querySchema = z.object({
      page: z.coerce.number().int().positive(),
    });

    const req = mockReq({ query: { page: '3' } as any });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validate(querySchema, 'query');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query.page).toBe(3);
  });

  it('should validate route params', () => {
    const paramsSchema = z.object({
      id: z.coerce.number().int().positive(),
    });

    const req = mockReq({ params: { id: '42' } as any });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validate(paramsSchema, 'params');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.params.id).toBe(42);
  });

  it('should strip unknown properties by default', () => {
    const strictSchema = z.object({ name: z.string() });
    const req = mockReq({ body: { name: 'Lukas', hacker: true } });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validate(strictSchema, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Lukas' });
    expect(req.body.hacker).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// validateBody
// ─────────────────────────────────────────────────────────────
describe('validateBody', () => {
  it('should validate body with correct schema', () => {
    const schema = z.object({ email: z.string().email() });
    const req = mockReq({ body: { email: 'test@tourneo.de' } });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validateBody(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.email).toBe('test@tourneo.de');
  });

  it('should pass ZodError to next on invalid body', () => {
    const schema = z.object({ email: z.string().email() });
    const req = mockReq({ body: { email: 'not-email' } });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validateBody(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });
});

// ─────────────────────────────────────────────────────────────
// validateQuery
// ─────────────────────────────────────────────────────────────
describe('validateQuery', () => {
  it('should validate query parameters', () => {
    const schema = z.object({ search: z.string().min(1) });
    const req = mockReq({ query: { search: 'padel' } as any });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validateQuery(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should fail on invalid query params', () => {
    const schema = z.object({ search: z.string().min(3) });
    const req = mockReq({ query: { search: 'ab' } as any });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validateQuery(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });
});

// ─────────────────────────────────────────────────────────────
// validateParams
// ─────────────────────────────────────────────────────────────
describe('validateParams', () => {
  it('should validate route parameters', () => {
    const schema = z.object({ id: z.string().min(1) });
    const req = mockReq({ params: { id: '123' } as any });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validateParams(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should fail on missing route params', () => {
    const schema = z.object({ id: z.string().min(1) });
    const req = mockReq({ params: {} as any });
    const res = mockRes();
    const next = jest.fn();

    const middleware = validateParams(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });
});