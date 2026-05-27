// =============================================================================
//  Validate Middleware
//  apps/server/src/middleware/validate.ts
//
//  Usage:
//    router.post('/register', validate(registerSchema), authController.register)
//
//  On success:  passes through to the next handler
//  On failure:  responds 422 with field-level error array matching ApiError shape
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import type { ValidationError } from '@lms/types';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = formatZodErrors(result.error);

      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Overwrite req.body/query/params with the parsed (coerced + transformed) values
    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.query !== undefined) req.query = result.data.query;
    if (result.data.params !== undefined) req.params = result.data.params;

    next();
  };
}

// ─── Format Zod errors into the ApiError ValidationError[] shape ──────────────

function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => {
    // Remove the leading "body." / "query." / "params." prefix from paths
    const pathParts = issue.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params');
    const field = pathParts.length > 0 ? pathParts.join('.') : '_root';

    return {
      field,
      message: issue.message,
    };
  });
}
