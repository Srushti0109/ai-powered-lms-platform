// =============================================================================
//  Middleware Barrel
//  apps/server/src/middleware/index.ts
// =============================================================================

export { validate } from './validate';
export { authenticate, optionalAuthenticate } from './authenticate';
export {
  authorize,
  requireAdmin,
  requireInstructor,
  requireAuth,
  assertOwnerOrAdmin,
} from './authorize';
export { generalLimiter, authLimiter, refreshLimiter } from './rate-limit';
export { globalErrorHandler } from './error-handler';
