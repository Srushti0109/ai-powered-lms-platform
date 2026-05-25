// =============================================================================
//  Audit Timestamps Middleware
//  packages/database/src/middleware/audit-timestamps.ts
//
//  Ensures updatedAt is always explicitly set on any write operation,
//  even if Prisma's @updatedAt decorator handles it. Belt-and-suspenders.
// =============================================================================

import type { Prisma } from '@prisma/client';

const WRITE_ACTIONS = new Set(['create', 'update', 'upsert', 'createMany', 'updateMany']);

export const auditTimestampsMiddleware: Prisma.Middleware = async (params, next) => {
  if (!WRITE_ACTIONS.has(params.action)) {
    return next(params);
  }

  const now = new Date();

  if (params.action === 'create' || params.action === 'update') {
    params.args.data = {
      ...params.args.data,
      updatedAt: now,
    };
  }

  if (params.action === 'updateMany') {
    params.args.data = {
      ...params.args.data,
      updatedAt: now,
    };
  }

  return next(params);
};
