// =============================================================================
//  JWT Utilities
//  apps/server/src/utils/jwt.ts
//
//  All JWT operations go through here. Never call jsonwebtoken directly
//  from middleware or controllers — always use these typed wrappers.
//
//  Token design:
//  ┌─────────────────┬──────────────────────────────────────────────────────┐
//  │ Access token    │ Short-lived (15m). Signed with ACCESS_SECRET.        │
//  │                 │ Contains: sub, email, role, tokenVersion             │
//  │                 │ Sent as HttpOnly cookie (access_token)               │
//  ├─────────────────┼──────────────────────────────────────────────────────┤
//  │ Refresh token   │ Long-lived (7d). Signed with REFRESH_SECRET.        │
//  │                 │ Contains: sub, tokenVersion only (minimal payload)   │
//  │                 │ Sent as HttpOnly cookie (refresh_token)              │
//  │                 │ Hash stored in DB for rotation validation            │
//  └─────────────────┴──────────────────────────────────────────────────────┘
// =============================================================================

import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AuthErrors } from '@/lib/app-error';

// ─── Payload types ────────────────────────────────────────────────────────────

import type { Role } from '@lms/types';

export interface AccessTokenPayload {
  sub: string;          // user ID
  email: string;
  role: Role;
  tokenVersion: number; // must match DB value — incremented on logout/pw-change
}

export interface RefreshTokenPayload {
  sub: string;          // user ID
  tokenVersion: number; // detects token reuse after rotation
}

// Internal — what jwt.verify actually returns (adds iat, exp)
type WithJwtMeta<T> = T & { iat: number; exp: number };

// ─── Token generation ─────────────────────────────────────────────────────────

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'lms-platform',
    audience: 'lms-client',
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'lms-platform',
    audience: 'lms-client',
  });
}

// ─── Token verification ───────────────────────────────────────────────────────

/**
 * Verifies an access token. Throws typed AppErrors on failure.
 * Used by the authenticate() middleware on every protected route.
 */
export function verifyAccessToken(token: string): WithJwtMeta<AccessTokenPayload> {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'lms-platform',
      audience: 'lms-client',
    }) as WithJwtMeta<AccessTokenPayload>;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw AuthErrors.tokenExpired();
    throw AuthErrors.tokenInvalid();
  }
}

/**
 * Verifies a refresh token. Throws typed AppErrors on failure.
 * Used only by the POST /auth/refresh-token route.
 */
export function verifyRefreshToken(token: string): WithJwtMeta<RefreshTokenPayload> {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'lms-platform',
      audience: 'lms-client',
    }) as WithJwtMeta<RefreshTokenPayload>;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw AuthErrors.tokenExpired();
    throw AuthErrors.tokenInvalid();
  }
}

/**
 * Decodes a token WITHOUT verifying signature.
 * Use only for logging/debugging — never for auth decisions.
 */
export function decodeToken(token: string): jwt.JwtPayload | null {
  return jwt.decode(token) as jwt.JwtPayload | null;
}

// ─── Expiry helpers ───────────────────────────────────────────────────────────

/** Returns the exact Date when the access token expires (for cookie maxAge) */
export function getAccessTokenExpiry(): Date {
  // env.JWT_ACCESS_EXPIRES_IN is e.g. "15m" → 900 seconds
  const ms = parseDuration(env.JWT_ACCESS_EXPIRES_IN);
  return new Date(Date.now() + ms);
}

/** Returns the exact Date when the refresh token expires (for cookie maxAge) */
export function getRefreshTokenExpiry(): Date {
  const ms = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + ms);
}

/** Returns refresh token max-age in milliseconds (for cookie options) */
export function getRefreshTokenMaxAgeMs(): number {
  return parseDuration(env.JWT_REFRESH_EXPIRES_IN);
}

/** Returns access token max-age in milliseconds (for cookie options) */
export function getAccessTokenMaxAgeMs(): number {
  return parseDuration(env.JWT_ACCESS_EXPIRES_IN);
}

// ─── Duration parser ──────────────────────────────────────────────────────────

const DURATION_UNITS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseDuration(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid duration format: "${duration}". Expected e.g. "15m", "7d"`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multiplier = DURATION_UNITS[unit];
  if (!multiplier) throw new Error(`Unknown duration unit: "${unit}"`);
  return value * multiplier;
}
