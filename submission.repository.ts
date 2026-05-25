// =============================================================================
//  Submission Repository
//  packages/database/src/repositories/submission.repository.ts
// =============================================================================

import { db } from '../client';
import type { Language, SubmissionStatus, Prisma } from '@prisma/client';
import { getPaginationArgs, buildPaginationMeta } from '../helpers/pagination';

export const SUBMISSION_SELECT = {
  id: true,
  userId: true,
  challengeId: true,
  code: true,
  language: true,
  status: true,
  runtime: true,
  memory: true,
  testResults: true,
  passedCount: true,
  totalCount: true,
  errorMessage: true,
  aiReview: true,
  aiReviewedAt: true,
  isSubmit: true,
  createdAt: true,
  challenge: {
    select: { title: true, slug: true, difficulty: true },
  },
} satisfies Prisma.SubmissionSelect;

export type SubmissionPayload = Prisma.SubmissionGetPayload<{
  select: typeof SUBMISSION_SELECT;
}>;

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findSubmissionById(id: string): Promise<SubmissionPayload | null> {
  return db.submission.findUnique({ where: { id }, select: SUBMISSION_SELECT });
}

export async function findUserSubmissions(params: {
  userId: string;
  challengeId?: string;
  status?: SubmissionStatus;
  page?: number;
  limit?: number;
}) {
  const { skip, take, page, limit } = getPaginationArgs(params);

  const where: Prisma.SubmissionWhereInput = {
    userId: params.userId,
    isSubmit: true,
    ...(params.challengeId && { challengeId: params.challengeId }),
    ...(params.status && { status: params.status }),
  };

  const [total, data] = await Promise.all([
    db.submission.count({ where }),
    db.submission.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: SUBMISSION_SELECT,
    }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
}

export async function findBestSubmission(userId: string, challengeId: string) {
  return db.submission.findFirst({
    where: { userId, challengeId, status: 'ACCEPTED', isSubmit: true },
    orderBy: { runtime: 'asc' },
    select: SUBMISSION_SELECT,
  });
}

// Leaderboard: fastest accepted submission per user for a challenge
export async function findLeaderboard(challengeId: string, limit = 20) {
  return db.$queryRaw<
    Array<{ userId: string; firstName: string; lastName: string; runtime: number; createdAt: Date }>
  >`
    SELECT DISTINCT ON (s.user_id)
      s.user_id   AS "userId",
      p.first_name AS "firstName",
      p.last_name  AS "lastName",
      s.runtime,
      s.created_at AS "createdAt"
    FROM submissions s
    JOIN profiles p ON p.user_id = s.user_id
    WHERE s.challenge_id = ${challengeId}
      AND s.status = 'ACCEPTED'
      AND s.is_submit = true
    ORDER BY s.user_id, s.runtime ASC
    LIMIT ${limit}
  `;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createSubmission(data: {
  userId: string;
  challengeId: string;
  code: string;
  language: Language;
  isSubmit: boolean;
}) {
  return db.submission.create({
    data: {
      userId: data.userId,
      challengeId: data.challengeId,
      code: data.code,
      language: data.language,
      isSubmit: data.isSubmit,
      status: 'PENDING',
    },
    select: { id: true, status: true, createdAt: true },
  });
}

export async function updateSubmissionResult(
  id: string,
  result: {
    status: SubmissionStatus;
    runtime?: number;
    memory?: number;
    testResults?: unknown;
    passedCount?: number;
    totalCount?: number;
    errorMessage?: string;
  }
) {
  return db.submission.update({
    where: { id },
    data: result,
    select: SUBMISSION_SELECT,
  });
}

export async function updateSubmissionAiReview(id: string, review: string) {
  return db.submission.update({
    where: { id },
    data: { aiReview: review, aiReviewedAt: new Date() },
  });
}

/** Increment challenge-level denormalised counters after a final submission */
export async function incrementChallengeCounters(
  challengeId: string,
  accepted: boolean
): Promise<void> {
  await db.codingChallenge.update({
    where: { id: challengeId },
    data: {
      totalSubmissions: { increment: 1 },
      ...(accepted && { acceptedSubmissions: { increment: 1 } }),
    },
  });
}
