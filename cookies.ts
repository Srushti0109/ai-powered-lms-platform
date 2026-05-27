// =============================================================================
//  Cookie Utilities
//  apps/server/src/utils/cookies.ts
//
//  All cookie operations centralised here. Never call res.cookie() directly
//  in controllers — always use these helpers so security flags are consistent.
//
//  Cookie architecture:
//  ┌──────────────────┬───────────────────────────────────────────────────────┐
//  │ access_token     │ HttpOnly, Secure(prod), SameSite=Strict, 15 min      │
//  ├──────────────────┼───────────────────────────────────────────────────────┤
//  │ refresh_token    │ HttpOnly, Secure(prod), SameSite=Strict, 7 days      │
//  │                  │ Path=/api/auth — only sent to refresh endpoint        │
//  └──────────────────┴───────────────────────────────────────────────────────┘
//
//  SameSite=Strict: prevents CSRF — cookie not sent on cross-site navigations.
//  HttpOnly: blocks XSS access to tokens from JavaScript.
//  Secure: cookie only transmitted over HTTPS (set to true in production).
//  Path scoping on refresh_token: limits exposure surface area.
// =============================================================================

import type { Response } from 'express';
import { env, isProduction } from '@/config/env';
import { getAccessTokenMaxAgeMs, getRefreshTokenMaxAgeMs } from '@/utils/jwt';

// ─── Cookie names ─────────────────────────────────────────────────────────────

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// ─── Base cookie options ──────────────────────────────────────────────────────

function getBaseOptions() {
  return {
    httpOnly: true,                     // no JS access
    secure: isProduction,               // HTTPS only in prod
    sameSite: 'strict' as const,        // CSRF protection
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  };
}

// ─── Set cookies ──────────────────────────────────────────────────────────────

/**
 * Sets the access_token cookie.
 * Available to all API paths.
 */
export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
    ...getBaseOptions(),
    maxAge: getAccessTokenMaxAgeMs(),
    path: '/',
  });
}

/**
 * Sets the refresh_token cookie.
 * Path-scoped to /api/auth so it is ONLY sent to the auth endpoints.
 * This limits the attack surface if the server is ever compromised.
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    ...getBaseOptions(),
    maxAge: getRefreshTokenMaxAgeMs(),
    path: '/api/auth',                  // ← scope: only sent to auth routes
  });
}

/**
 * Sets both tokens in a single call.
 * Used by register, login, and refresh-token endpoints.
 */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void {
  setAccessTokenCookie(res, tokens.accessToken);
  setRefreshTokenCookie(res, tokens.refreshToken);
}

// ─── Clear cookies ────────────────────────────────────────────────────────────

/**
 * Clears both auth cookies.
 * Path must match the Set-Cookie path exactly, otherwise the browser
 * won't remove the cookie.
 */
export function clearAuthCookies(res: Response): void {
  const base = getBaseOptions();

  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    ...base,
    path: '/',
  });

  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...base,
    path: '/api/auth',
  });
}

// ─── Read cookies ─────────────────────────────────────────────────────────────

/**
 * Extracts a cookie value from the request.
 * Returns undefined if not present — never throws.
 */
import type { Request } from 'express';

export function getAccessTokenFromCookies(req: Request): string | undefined {
  return req.cookies[COOKIE_NAMES.ACCESS_TOKEN] as string | undefined;
}

export function getRefreshTokenFromCookies(req: Request): string | undefined {
  return req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
}
