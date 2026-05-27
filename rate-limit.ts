// =============================================================================
//  Rate Limiting Middleware
//  apps/server/src/middleware/rate-limit.ts
//
//  Three tiers:
//  ┌───────────────────┬──────────────────┬──────────────────────────────────┐
//  │ Limiter           │ Limit            │ Applied to                       │
//  ├───────────────────┼──────────────────┼──────────────────────────────────┤
//  │ generalLimiter    │ 100 req/min/IP   │ All routes (global)              │
//  │ authLimiter       │  10 req/min/IP   │ POST /auth/login, /auth/register │
//  │ refreshLimiter    │  20 req/min/IP   │ POST /auth/refresh-token         │
//  └───────────────────┴──────────────────┴──────────────────────────────────┘
//
//  In production, use a Redis store (e.g. rate-limit-redis) so limits
//  are shared across multiple server instances. The in-memory store used
//  here is fine for a single instance / development.
// =============================================================================

import rateLimit from 'express-rate-limit';
import { env, isProduction } from '@/config/env';

// ─── Response formatter ───────────────────────────────────────────────────────

const rateLimitHandler = rateLimit.rateLimit({
  // Placeholder — each limiter overrides this
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7', // RateLimit-* headers (RFC draft)
  legacyHeaders: false,        // disable deprecated X-RateLimit-* headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests — please wait before trying again.',
      code: 'RATE_LIMITED',
    });
  },
  skip: () => !isProduction && process.env.DISABLE_RATE_LIMIT === 'true',
});

// ─── General limiter (applied globally in app.ts) ────────────────────────────

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,       // default: 60_000 ms (1 min)
  max: env.RATE_LIMIT_MAX_REQUESTS,          // default: 100
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP — please wait before trying again.',
    code: 'RATE_LIMITED',
  },
  skip: () => !isProduction && process.env.DISABLE_RATE_LIMIT === 'true',
});

// ─── Auth endpoints (login / register) ───────────────────────────────────────

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                 // 15 minute window
  max: env.AUTH_RATE_LIMIT_MAX,              // default: 10 attempts
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Key by IP + email body to prevent distributed brute-force across IPs
  keyGenerator: (req) => {
    const ip = req.ip ?? 'unknown';
    const email = (req.body?.email as string | undefined) ?? '';
    return `${ip}:${email.toLowerCase()}`;
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please wait 15 minutes.',
      code: 'AUTH_RATE_LIMITED',
      retryAfter: 15 * 60,
    });
  },
  skip: () => !isProduction && process.env.DISABLE_RATE_LIMIT === 'true',
});

// ─── Refresh token endpoint ───────────────────────────────────────────────────

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,                      // 1 minute window
  max: 20,                                  // 20 refreshes per minute per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many token refresh attempts.',
      code: 'REFRESH_RATE_LIMITED',
    });
  },
  skip: () => !isProduction && process.env.DISABLE_RATE_LIMIT === 'true',
});

// Suppress unused variable warning for the base config object
void rateLimitHandler;
