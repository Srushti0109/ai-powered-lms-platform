// =============================================================================
//  Server Entry Point
//  apps/server/src/server.ts
//
//  Starts the HTTP server and handles:
//  - Environment validation (happens at env.ts import time)
//  - Database connectivity check before accepting traffic
//  - Graceful shutdown on SIGTERM / SIGINT
// =============================================================================

import 'dotenv/config';                 // load .env before anything else
import { createApp } from './app';
import { env } from '@/config/env';
import { db } from '@lms/database';

const app = createApp();

// ─── Database connectivity check ──────────────────────────────────────────────

async function checkDatabaseConnection(): Promise<void> {
  try {
    await db.$queryRaw`SELECT 1`;
    console.info('✓ Database connection established');
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    process.exit(1);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  await checkDatabaseConnection();

  const server = app.listen(env.PORT, () => {
    console.info(`
╔══════════════════════════════════════════════╗
║           LMS Platform API Server            ║
╠══════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(28)}║
║  Port        : ${String(env.PORT).padEnd(28)}║
║  Client URL  : ${env.CLIENT_URL.slice(0, 28).padEnd(28)}║
╚══════════════════════════════════════════════╝
    `);
  });

  // ─── Graceful shutdown ───────────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    console.info(`\n${signal} received — shutting down gracefully...`);

    server.close(async () => {
      console.info('HTTP server closed');

      try {
        await db.$disconnect();
        console.info('Database connection closed');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }

      process.exit(0);
    });

    // Force exit after 30s if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forced shutdown after 30s timeout');
      process.exit(1);
    }, 30_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ─── Unhandled rejections ────────────────────────────────────────────────────

  process.on('unhandledRejection', (reason) => {
    console.error('[UnhandledRejection]', reason);
    // In production let the process manager restart; in dev crash loudly
    if (env.NODE_ENV === 'production') {
      void shutdown('UNHANDLED_REJECTION');
    }
  });

  process.on('uncaughtException', (err) => {
    console.error('[UncaughtException]', err);
    void shutdown('UNCAUGHT_EXCEPTION');
  });
}

void start();
