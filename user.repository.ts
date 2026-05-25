// =============================================================================
//  User Repository
//  packages/database/src/repositories/user.repository.ts
//
//  Data-access layer for User + Profile. No business logic here —
//  that lives in the server's service layer. Repositories only compose
//  Prisma queries and apply field selection/projection.
// =============================================================================

import { db } from '../client';
import type { Role, Prisma } from '@prisma/client';
import { getPaginationArgs, buildPaginationMeta } from '../helpers/pagination';

// ─── Projections ──────────────────────────────────────────────────────────────

/** Fields safe to return to clients (no passwordHash / refreshTokenHash) */
export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  role: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      avatarUrl: true,
      headline: true,
      bio: true,
      skills: true,
      xp: true,
      streak: true,
    },
  },
} satisfies Prisma.UserSelect;

export type UserPublicPayload = Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_SELECT }>;

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findUserById(id: string): Promise<UserPublicPayload | null> {
  return db.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT });
}

export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      isVerified: true,
      isActive: true,
      tokenVersion: true,
      refreshTokenHash: true,
    },
  });
}

export async function findUsersAdmin(params: {
  page?: number;
  limit?: number;
  role?: Role;
  search?: string;
}) {
  const { skip, take, page, limit } = getPaginationArgs(params);

  const where: Prisma.UserWhereInput = {
    ...(params.role && { role: params.role }),
    ...(params.search && {
      OR: [
        { email: { contains: params.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: params.search, mode: 'insensitive' } } },
      ],
    }),
  };

  const [total, data] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: USER_PUBLIC_SELECT }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createUserWithProfile(data: {
  email: string;
  passwordHash: string;
  role?: Role;
  firstName: string;
  lastName: string;
}) {
  return db.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'STUDENT',
      profile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      },
    },
    select: USER_PUBLIC_SELECT,
  });
}

export async function updateRefreshToken(userId: string, hash: string | null) {
  return db.user.update({
    where: { id: userId },
    data: { refreshTokenHash: hash, lastLoginAt: new Date() },
  });
}

export async function incrementTokenVersion(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

export async function updateUserRole(userId: string, role: Role) {
  return db.user.update({
    where: { id: userId },
    data: { role },
    select: USER_PUBLIC_SELECT,
  });
}
