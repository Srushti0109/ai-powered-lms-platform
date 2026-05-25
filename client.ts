// =============================================================================
//  Prisma Client — Singleton
//  packages/database/src/client.ts
//
//  Rules:
//  • One PrismaClient instance per process (hot-reload safe in Next.js dev)
//  • Soft-delete middleware applied globally
//  • Query logging in development only
// =============================================================================

import { PrismaClient } from '@prisma/client';

import { softDeleteMiddleware } from './middleware/soft-delete';
import { auditTimestampsMiddleware } from './middleware/audit-timestamps';
import { queryLogMiddleware } from './middleware/query-log';

// ─── Global singleton (Next.js dev HMR safe) ─────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const isDev = process.env.NODE_ENV === 'development';

  const client = new PrismaClient({
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ]
      : [
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ],
    errorFormat: isDev ? 'pretty' : 'minimal',
  });

  // ── Middleware (applied in order) ──────────────────────────────────────────
  // 1. Soft delete: intercepts delete/deleteMany → sets deletedAt
  //    and filters deletedAt on findMany/findFirst/findUnique
  client.$use(softDeleteMiddleware);

  // 2. Audit timestamps: ensures updatedAt is always fresh
  client.$use(auditTimestampsMiddleware);

  // 3. Query logging in dev
  if (isDev) {
    client.$use(queryLogMiddleware);
  }

  return client;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// ─── Named export for explicit import style ───────────────────────────────────
export { PrismaClient };
export * from '@prisma/client';
