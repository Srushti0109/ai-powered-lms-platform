// =============================================================================
//  Test Setup
//  apps/server/src/modules/auth/__tests__/setup.ts
//
//  Runs before every test file. Sets environment variables, ensures the
//  test database is clean between runs, and provides global helpers.
// =============================================================================

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// ─── Environment ──────────────────────────────────────────────────────────────
// Set before any module imports so env.ts validation passes
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_minimum_32_characters_long!!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_characters_long!!';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Low for fast tests — NEVER in prod
process.env.AUTH_RATE_LIMIT_MAX = '1000'; // Disable rate limiting in tests
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';

// ─── DB teardown ──────────────────────────────────────────────────────────────

let db: Awaited<ReturnType<typeof import('@lms/database')['db']['$connect']>> | undefined;

beforeAll(async () => {
  const { db: prisma } = await import('@lms/database');
  db = prisma as unknown as typeof db;
});

afterEach(async () => {
  // Clean auth-related tables between tests — order respects FK constraints
  const { db: prisma } = await import('@lms/database');
  await prisma.$executeRaw`TRUNCATE TABLE "audit_logs" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "notifications" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "chat_histories" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "profiles" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`;
});

afterAll(async () => {
  const { db: prisma } = await import('@lms/database');
  await prisma.$disconnect();
});
