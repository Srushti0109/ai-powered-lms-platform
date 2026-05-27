// =============================================================================
//  Auth Service
//  apps/server/src/modules/auth/auth.service.ts
//
//  Business logic layer. Orchestrates repository calls, token operations,
//  and enforces security rules. Controllers call service methods only —
//  never the repository directly.
//
//  Refresh Token Rotation Strategy:
//  ══════════════════════════════════════════════════════════════════════════
//  1. On login:    issue access token (15m) + refresh token (7d)
//                  hash refresh token → store in DB
//  2. On refresh:  verify incoming refresh token JWT
//                  compare hash(incoming) === DB.refreshTokenHash
//                  if mismatch → THEFT DETECTED → revoke all sessions
//                  if match    → issue NEW pair, replace DB hash, clear old
//  3. On logout:   clear cookies + null DB.refreshTokenHash + bump tokenVersion
//
//  Token Theft Detection:
//  If a refresh token is used that doesn't match the DB hash, it means either:
//  a) The token was already rotated (legitimate reuse of an old token), or
//  b) An attacker stole and used the token before the legitimate user did.
//  In both cases we treat it as theft and revoke ALL sessions (increment
//  tokenVersion), forcing the user to log in again on all devices.
//  ══════════════════════════════════════════════════════════════════════════
// =============================================================================

import type { Request } from 'express';
import { Role } from '@lms/types';
import type { RegisterBody, LoginBody } from './auth.schemas';
import * as authRepo from './auth.repository';
import { hashPassword, verifyPassword } from '@/utils/password';
import { hashToken, compareTokenHash } from '@/utils/token-hash';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/utils/jwt';
import { AuthErrors } from '@/lib/app-error';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Awaited<ReturnType<typeof authRepo.findAuthUserById>>;
  tokens: TokenPair;
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(data: RegisterBody): Promise<AuthResult> {
  // 1. Check email uniqueness (Prisma unique constraint would also catch this,
  //    but we prefer a human-readable error over a P2002 Prisma error)
  const exists = await authRepo.emailExists(data.email);
  if (exists) throw AuthErrors.emailTaken();

  // 2. Hash password before any DB write
  const passwordHash = await hashPassword(data.password);

  // 3. Create user + profile atomically
  const user = await authRepo.createUserWithProfile({
    email: data.email,
    passwordHash,
    role: (data.role as Role) ?? Role.STUDENT,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  // 4. Issue token pair
  const tokens = await issueTokenPair(user.id, user.role, 0);

  return { user, tokens };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(data: LoginBody): Promise<AuthResult> {
  // 1. Fetch user with credentials — query uses email index
  const user = await authRepo.findUserForAuth(data.email);

  // 2. Always run bcrypt even if user doesn't exist — prevents timing attacks
  //    that could enumerate valid emails by measuring response time.
  const dummyHash = '$2b$12$invalidhashforenumerationprotection00000000000000000000';
  const passwordValid = await verifyPassword(
    data.password,
    user?.passwordHash ?? dummyHash
  );

  // 3. Now apply actual guards (after timing-safe compare)
  if (!user || !passwordValid) throw AuthErrors.invalidCredentials();
  if (user.deletedAt !== null) throw AuthErrors.invalidCredentials(); // same msg
  if (!user.isActive) throw AuthErrors.accountDisabled();

  // 4. Issue token pair — use current tokenVersion so new tokens are valid
  const tokens = await issueTokenPair(user.id, user.role, user.tokenVersion);

  // 5. Fetch public projection for the response (no credentials)
  const publicUser = await authRepo.findAuthUserById(user.id);

  return { user: publicUser, tokens };
}

// ─── Refresh Token Rotation ───────────────────────────────────────────────────

export async function refreshTokens(
  incomingRefreshToken: string
): Promise<TokenPair> {
  // 1. Verify JWT structure + expiry
  const payload = verifyRefreshToken(incomingRefreshToken);

  // 2. Fetch current state from DB
  const user = await authRepo.findUserForAuth('') // placeholder
    .catch(() => null);

  // Fetch the actual user by ID from the payload
  const dbUser = await fetchUserForRefresh(payload.sub);

  // 3. Token version check — must match what's in the JWT
  if (dbUser.tokenVersion !== payload.tokenVersion) {
    // Token version mismatch means this refresh token was issued before
    // a logout or password change. Treat as reuse/theft.
    await authRepo.revokeUserSession(dbUser.id);
    throw AuthErrors.tokenReuse();
  }

  // 4. Hash comparison — the hash of the incoming token must match the DB
  if (!dbUser.refreshTokenHash) {
    // No hash stored → user logged out but token is still circulating
    await authRepo.revokeUserSession(dbUser.id);
    throw AuthErrors.tokenReuse();
  }

  const hashMatches = compareTokenHash(incomingRefreshToken, dbUser.refreshTokenHash);
  if (!hashMatches) {
    // Hash mismatch → old (already-rotated) token being presented.
    // This is the theft detection trigger.
    await authRepo.revokeUserSession(dbUser.id);
    throw AuthErrors.tokenReuse();
  }

  // 5. All checks pass — rotate: issue a new pair and replace the stored hash
  const newTokens = generateTokenPair(dbUser.id, dbUser.role, dbUser.tokenVersion);
  await authRepo.rotateRefreshToken(dbUser.id, hashToken(newTokens.refreshToken));

  return newTokens;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(userId: string): Promise<void> {
  // Null the stored refresh token hash and bump tokenVersion.
  // Effect: ALL issued access tokens for this user instantly become invalid
  // (next request hits authenticate() which checks tokenVersion).
  await authRepo.revokeUserSession(userId);
}

// ─── Get current user ─────────────────────────────────────────────────────────

export async function getCurrentUser(userId: string) {
  const user = await authRepo.findAuthUserById(userId);
  if (!user) throw AuthErrors.accountDeleted();
  return user;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Issues a token pair AND persists the hashed refresh token to the DB.
 * This is the only place both operations happen together.
 */
async function issueTokenPair(
  userId: string,
  role: string,
  tokenVersion: number
): Promise<TokenPair> {
  const tokens = generateTokenPair(userId, role as Role, tokenVersion);
  await authRepo.persistRefreshToken(userId, hashToken(tokens.refreshToken));
  return tokens;
}

/** Pure token generation — does NOT touch the DB. */
function generateTokenPair(userId: string, role: Role, tokenVersion: number): TokenPair {
  const accessToken = signAccessToken({
    sub: userId,
    email: '', // email not needed in payload — fetched from DB on verify
    role,
    tokenVersion,
  });

  const refreshToken = signRefreshToken({
    sub: userId,
    tokenVersion,
  });

  return { accessToken, refreshToken };
}

/** Fetch user by ID specifically for the refresh flow — includes credential fields */
async function fetchUserForRefresh(userId: string) {
  const { db } = await import('@lms/database');
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      deletedAt: true,
      tokenVersion: true,
      refreshTokenHash: true,
    },
  });

  if (!user || user.deletedAt !== null) throw AuthErrors.accountDeleted();
  if (!user.isActive) throw AuthErrors.accountDisabled();

  return user;
}

/** Extract client IP for audit logging — handles proxies */
export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? '';
  return req.ip ?? '';
}
