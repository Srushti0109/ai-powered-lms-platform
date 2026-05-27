// =============================================================================
//  Password Utilities
//  apps/server/src/utils/password.ts
// =============================================================================

import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

/**
 * Hashes a plaintext password using bcrypt.
 * Salt rounds come from env (default 12 — ~300ms on a modern CPU, 2^12 iterations).
 * Never store plaintext passwords — always hash before writing to DB.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plaintext candidate against a stored hash.
 * Always use this instead of manual comparison — bcrypt handles timing safety.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
