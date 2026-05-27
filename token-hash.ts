// =============================================================================
//  Token Hash Utilities
//  apps/server/src/utils/token-hash.ts
//
//  Refresh tokens are hashed (SHA-256) before being written to the database.
//  This means a DB breach does NOT expose usable refresh tokens.
//
//  Why SHA-256 instead of bcrypt?
//  Refresh tokens are already high-entropy random strings (JWT). We don't need
//  bcrypt's slow iteration — we just need a one-way fingerprint. SHA-256 is
//  fast, deterministic, and sufficient for this use case.
// =============================================================================

import { createHash } from 'crypto';

/**
 * Produces a SHA-256 hex digest of a JWT refresh token.
 * Store this in the database, never the raw token.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison of two token hashes.
 * Prevents timing attacks when comparing the incoming hash to the stored hash.
 */
export function compareTokenHash(incoming: string, stored: string): boolean {
  const incomingHash = hashToken(incoming);
  const storedBuffer = Buffer.from(stored, 'hex');
  const incomingBuffer = Buffer.from(incomingHash, 'hex');

  if (storedBuffer.length !== incomingBuffer.length) return false;

  // timingSafeEqual throws if lengths differ — guard above ensures they don't
  return require('crypto').timingSafeEqual(storedBuffer, incomingBuffer);
}
