// =============================================================================
//  Transaction Helper
//  packages/database/src/helpers/transaction.ts
//
//  Wraps Prisma interactive transactions with a consistent timeout
//  and error logging. Use for any multi-step write that must be atomic.
// =============================================================================

import { db } from '../client';
import type { PrismaClient } from '@prisma/client';
import type { ITXClientDenyList } from '@prisma/client/runtime/library';

type TransactionClient = Omit<PrismaClient, ITXClientDenyList>;
type TransactionFn<T> = (tx: TransactionClient) => Promise<T>;

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_WAIT_MS = 5_000;

/**
 * Run operations inside a Prisma interactive transaction.
 *
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: { ... } });
 *   await tx.profile.create({ data: { userId: user.id, ... } });
 *   return user;
 * });
 */
export async function withTransaction<T>(
  fn: TransactionFn<T>,
  options?: { timeout?: number; maxWait?: number }
): Promise<T> {
  return db.$transaction(fn, {
    timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS,
    maxWait: options?.maxWait ?? DEFAULT_MAX_WAIT_MS,
  });
}
