// =============================================================================
//  Global Error Handler
//  apps/server/src/middleware/error-handler.ts
//
//  Registered LAST in app.ts — catches everything next(err) throws.
//
//  Error classification:
//  ┌──────────────────────────────┬─────────────────────────────────────────┐
//  │ AppError (isOperational)     │ Expose message + code to client         │
//  │ Zod / Prisma known errors    │ Map to structured response              │
//  │ Unknown / programmer errors  │ Generic 500 — never leak internals      │
//  └──────────────────────────────┴─────────────────────────────────────────┘
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@lms/database';
import { isAppError } from '@/lib/app-error';
import { isDevelopment } from '@/config/env';

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // ── AppError (operational — intentional, safe to expose) ──────────────────
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // ── Prisma known request errors ───────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    res.status(prismaError.status).json({
      success: false,
      message: prismaError.message,
      code: prismaError.code,
    });
    return;
  }

  // ── Prisma validation errors ──────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
      ...(isDevelopment && { detail: err.message }),
    });
    return;
  }

  // ── JWT errors (shouldn't reach here — jwt utils throw AppErrors — belt+suspenders)
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'TOKEN_INVALID',
    });
    return;
  }

  if (err instanceof Error && err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // ── SyntaxError (malformed JSON body) ─────────────────────────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
    return;
  }

  // ── Unknown / programmer error — never expose internals ───────────────────
  console.error('[UnhandledError]', {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : err,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && {
      detail: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
}

// ─── Prisma error mapping ─────────────────────────────────────────────────────

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  status: number;
  message: string;
  code: string;
} {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation
      const fields = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : 'field';
      return {
        status: 409,
        message: `A record with this ${fields} already exists`,
        code: 'UNIQUE_CONSTRAINT',
      };
    }
    case 'P2025':
      // Record not found (e.g. update where ID doesn't exist)
      return { status: 404, message: 'Record not found', code: 'NOT_FOUND' };

    case 'P2003':
      // Foreign key constraint violation
      return {
        status: 400,
        message: 'Related record does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      };

    case 'P2014':
      // Required relation violation
      return {
        status: 400,
        message: 'Invalid relation in request',
        code: 'RELATION_VIOLATION',
      };

    default:
      console.error('[PrismaError]', err.code, err.message);
      return { status: 500, message: 'Database error', code: 'DATABASE_ERROR' };
  }
}
