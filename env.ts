// =============================================================================
//  Environment Configuration
//  apps/server/src/config/env.ts
//
//  Single source of truth for all environment variables.
//  Fails fast at startup if any required variable is missing or malformed.
//  Import `env` everywhere — never access process.env directly.
// =============================================================================

import { z } from 'zod';

const envSchema = z.object({
  // ── Runtime ─────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z
    .string()
    .default('4000')
    .transform(Number)
    .pipe(z.number().int().min(1024).max(65535)),

  // ── Database ─────────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // ── Redis ─────────────────────────────────────────────────────────────────────
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // ── JWT ───────────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ── CORS / Client ─────────────────────────────────────────────────────────────
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),

  // ── Cookies ───────────────────────────────────────────────────────────────────
  COOKIE_DOMAIN: z.string().optional(),

  // ── Rate Limiting ─────────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform(Number)
    .pipe(z.number().positive()),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform(Number)
    .pipe(z.number().positive()),

  // ── Auth Specific Rate Limits ─────────────────────────────────────────────────
  AUTH_RATE_LIMIT_MAX: z
    .string()
    .default('10')
    .transform(Number)
    .pipe(z.number().positive()),

  // ── Bcrypt ───────────────────────────────────────────────────────────────────
  BCRYPT_SALT_ROUNDS: z
    .string()
    .default('12')
    .transform(Number)
    .pipe(z.number().int().min(10).max(14)),
});

// ─── Parse & export ───────────────────────────────────────────────────────────

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('❌ Invalid environment variables:\n' + formatted);
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();

// ─── Derived helpers ──────────────────────────────────────────────────────────

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
