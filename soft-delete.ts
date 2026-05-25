// =============================================================================
//  Soft Delete Middleware
//  packages/database/src/middleware/soft-delete.ts
//
//  Models with soft-delete support (have a deletedAt field):
//    User, Course, Module, Lesson, Quiz, Question, Assignment,
//    CodingChallenge, DiscussionPost
//
//  Behaviour:
//  • delete  → update({ deletedAt: now() })
//  • deleteMany → updateMany({ deletedAt: now() })
//  • findMany / findFirst / findUnique / count → auto-filter deletedAt: null
//    UNLESS caller explicitly passes { where: { deletedAt: { not: null } } }
//    or includes deleted: true in the args (escape hatch for admin queries)
// =============================================================================

import type { Prisma } from '@prisma/client';

// Models that support soft delete
const SOFT_DELETE_MODELS = new Set([
  'User',
  'Course',
  'Module',
  'Lesson',
  'Quiz',
  'Question',
  'Assignment',
  'CodingChallenge',
  'DiscussionPost',
]);

type PrismaAction = Prisma.PrismaAction;

const READ_ACTIONS: Set<PrismaAction> = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

const DELETE_ACTIONS: Set<PrismaAction> = new Set(['delete', 'deleteMany']);

export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  const { model, action, args } = params;

  if (!model || !SOFT_DELETE_MODELS.has(model)) {
    return next(params);
  }

  // ── Convert hard-delete → soft-delete ──────────────────────────────────────
  if (DELETE_ACTIONS.has(action)) {
    const newParams = {
      ...params,
      action: action === 'delete' ? 'update' : 'updateMany',
      args: {
        ...args,
        data: { deletedAt: new Date() },
      },
    } as typeof params;
    return next(newParams);
  }

  // ── Inject deletedAt filter on reads ──────────────────────────────────────
  if (READ_ACTIONS.has(action)) {
    // Escape hatch: { includeDeleted: true } skips the filter
    if (args?.where?.includeDeleted === true) {
      const { includeDeleted: _, ...restWhere } = args.where as Record<string, unknown>;
      return next({
        ...params,
        args: { ...args, where: restWhere },
      });
    }

    // Already has an explicit deletedAt filter — don't override
    if (args?.where?.deletedAt !== undefined) {
      return next(params);
    }

    return next({
      ...params,
      args: {
        ...args,
        where: {
          ...(args?.where ?? {}),
          deletedAt: null,
        },
      },
    });
  }

  return next(params);
};
