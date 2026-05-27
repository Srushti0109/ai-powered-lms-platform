// =============================================================================
//  RBAC Middleware — Role-Based Access Control
//  apps/server/src/middleware/authorize.ts
//
//  Must be used AFTER authenticate() — relies on req.user being set.
//
//  Usage:
//    // Single role
//    router.post('/courses', authenticate, authorize(Role.INSTRUCTOR), handler)
//
//    // Multiple roles (OR logic — any of these roles may pass)
//    router.get('/admin/users', authenticate, authorize(Role.ADMIN), handler)
//
//    // Shorthand guards (preferred at call sites for clarity)
//    router.get('/admin', authenticate, requireAdmin, handler)
//    router.post('/courses', authenticate, requireInstructor, handler)
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import { Role } from '@lms/types';
import { Errors, AuthErrors } from '@/lib/app-error';

/**
 * Authorizes a request based on one or more allowed roles.
 * Throws 401 if not authenticated, 403 if authenticated but wrong role.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AuthErrors.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      next(Errors.forbidden());
      return;
    }

    next();
  };
}

// ─── Shorthand middleware ─────────────────────────────────────────────────────

/** Only ADMIN may proceed */
export const requireAdmin = authorize(Role.ADMIN);

/** INSTRUCTOR or ADMIN may proceed */
export const requireInstructor = authorize(Role.INSTRUCTOR, Role.ADMIN);

/** Any authenticated user (STUDENT, INSTRUCTOR, ADMIN) may proceed.
 *  Use this when you only need to confirm authentication, not a specific role. */
export const requireAuth = authorize(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN);

// ─── Ownership guard ──────────────────────────────────────────────────────────

/**
 * Ensures the authenticated user is either the resource owner OR an admin.
 *
 * Usage in controller:
 *   assertOwnerOrAdmin(req, course.instructorId)
 *   → throws 403 if not owner and not admin
 */
export function assertOwnerOrAdmin(req: Request, ownerId: string): void {
  if (!req.user) throw AuthErrors.unauthorized();

  const isOwner = req.user.id === ownerId;
  const isAdmin = req.user.role === Role.ADMIN;

  if (!isOwner && !isAdmin) {
    throw Errors.forbidden();
  }
}
