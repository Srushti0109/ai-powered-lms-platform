// =============================================================================
//  Soft Delete Helpers
//  packages/database/src/helpers/soft-delete.ts
//
//  These are thin utility functions for calling soft-delete and restore
//  directly in repository/service code where needed.
// =============================================================================

import { db } from '../client';

type SoftDeletableModel =
  | 'user'
  | 'course'
  | 'module'
  | 'lesson'
  | 'quiz'
  | 'question'
  | 'assignment'
  | 'codingChallenge'
  | 'discussionPost';

/**
 * Soft-delete a single record by ID.
 * The middleware intercepts the delete() call, so this is just a thin wrapper
 * that makes intent explicit at call sites.
 */
export async function softDelete(model: SoftDeletableModel, id: string): Promise<void> {
  // Middleware converts this to update({ deletedAt: new Date() })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db[model] as any).delete({ where: { id } });
}

/**
 * Restore a soft-deleted record.
 * Passes the escape hatch to bypass the middleware filter.
 */
export async function restore(model: SoftDeletableModel, id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db[model] as any).update({
    where: { id, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
}

/**
 * Hard-delete — bypasses middleware. Use sparingly (GDPR erasure only).
 * Requires explicit database-level deletion.
 */
export async function hardDelete(model: SoftDeletableModel, id: string): Promise<void> {
  await db.$executeRawUnsafe(
    `DELETE FROM "${modelToTable(model)}" WHERE id = $1`,
    id
  );
}

// Map model name → table name (mirrors @@map in schema)
function modelToTable(model: SoftDeletableModel): string {
  const map: Record<SoftDeletableModel, string> = {
    user: 'users',
    course: 'courses',
    module: 'modules',
    lesson: 'lessons',
    quiz: 'quizzes',
    question: 'questions',
    assignment: 'assignments',
    codingChallenge: 'coding_challenges',
    discussionPost: 'discussion_posts',
  };
  return map[model];
}
