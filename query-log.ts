// =============================================================================
//  Query Log Middleware (development only)
//  packages/database/src/middleware/query-log.ts
//
//  Logs slow queries (>100ms) and query counts per request context.
//  In production, use @prisma/extension-pulse or Datadog instead.
// =============================================================================

import type { Prisma } from '@prisma/client';

const SLOW_QUERY_THRESHOLD_MS = 100;

export const queryLogMiddleware: Prisma.Middleware = async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const duration = Date.now() - before;

  const label = `[Prisma] ${params.model ?? 'raw'}.${params.action}`;

  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    console.warn(`${label} — SLOW: ${duration}ms`);
  } else {
    console.info(`${label} — ${duration}ms`);
  }

  return result;
};
