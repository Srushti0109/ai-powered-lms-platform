// =============================================================================
//  Auth Routes
//  apps/server/src/modules/auth/auth.routes.ts
//
//  Mount in app.ts:  app.use('/api/auth', authRouter)
//
//  Endpoint map:
//  ┌─────────────────────────────────┬──────────────────────────────────────┐
//  │ POST   /api/auth/register       │ Create account + set cookies         │
//  │ POST   /api/auth/login          │ Authenticate + set cookies           │
//  │ POST   /api/auth/logout         │ Revoke session + clear cookies       │
//  │ POST   /api/auth/refresh-token  │ Rotate refresh token                 │
//  │ GET    /api/auth/me             │ Get current user profile             │
//  │ GET    /api/auth/check          │ Lightweight session validity check   │
//  └─────────────────────────────────┴──────────────────────────────────────┘
// =============================================================================

import { Router } from 'express';
import * as authController from './auth.controller';
import { registerSchema, loginSchema } from './auth.schemas';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/authenticate';
import { authLimiter, refreshLimiter } from '@/middleware/rate-limit';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Rate limited (10/15min per IP+email).
 * Validates body → registers user → sets HttpOnly cookies.
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * POST /api/auth/login
 * Rate limited (10/15min per IP+email).
 * Validates body → authenticates → sets HttpOnly cookies.
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * POST /api/auth/refresh-token
 * Rate limited (20/min per IP).
 * Reads refresh_token cookie → rotates → sets new cookies.
 * No body required — token is read from HttpOnly cookie.
 */
router.post(
  '/refresh-token',
  refreshLimiter,
  authController.refreshToken
);

// ─── Protected routes (require valid access_token cookie) ─────────────────────

/**
 * POST /api/auth/logout
 * Requires authentication. Revokes session, clears cookies.
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * GET /api/auth/me
 * Returns the full public profile of the authenticated user.
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * GET /api/auth/check
 * Returns 200 + role if session is valid.
 * Used by Next.js server middleware for route protection without a full /me call.
 */
router.get(
  '/check',
  authenticate,
  authController.checkSession
);

export { router as authRouter };
