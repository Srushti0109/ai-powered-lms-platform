// =============================================================================
//  Authenticate Middleware
//  apps/server/src/middleware/authenticate.ts
//
//  Verifies the access_token HttpOnly cookie on every protected request.
//
//  Flow:
//  1. Extract access_token cookie
//  2. Verify JWT signature + expiry
//  3. Check tokenVersion matches DB (catches logout/password-change invalidation)
//  4. Check user is still active and not soft-deleted
//  5. Attach req.user = { id, email, role, tokenVersion }
//
//  Token version check:
//  Each User has a tokenVersion integer. When the user logs out or changes
//  their password we increment it. The access token payload carries the
//  version at issue time. If they differ the token is stale — reject it.
//  This lets us "revoke" all sessions without a token blacklist.
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import { db } from '@lms/database';
import { verifyAccessToken } from '@/utils/jwt';
import { getAccessTokenFromCookies } from '@/utils/cookies';
import { AuthErrors } from '@/lib/app-error';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract cookie
    const token = getAccessTokenFromCookies(req);
    if (!token) throw AuthErrors.tokenInvalid();

    // 2. Verify JWT signature + expiry
    const payload = verifyAccessToken(token);

    // 3. Fetch user for live tokenVersion + isActive check
    //    We keep this query minimal — only the fields we need for validation.
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
        tokenVersion: true,
      },
    });

    // 4. Guard: user must exist, be active, and not soft-deleted
    if (!user || user.deletedAt !== null) throw AuthErrors.accountDeleted();
    if (!user.isActive) throw AuthErrors.accountDisabled();

    // 5. Guard: tokenVersion must match the one embedded in the JWT.
    //    If the user logged out or changed password, tokenVersion was incremented,
    //    making all previously issued tokens invalid instantly.
    if (user.tokenVersion !== payload.tokenVersion) {
      throw AuthErrors.sessionVersionMismatch();
    }

    // 6. Attach sanitised user to request — available to all downstream handlers
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — same as authenticate() but does NOT throw if no token
 * is present. Useful for routes that behave differently for logged-in users
 * (e.g. course catalog shows "enrolled" badge only if authenticated).
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = getAccessTokenFromCookies(req);
  if (!token) return next();
  return authenticate(req, res, next);
}
