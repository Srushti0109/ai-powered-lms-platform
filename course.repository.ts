// =============================================================================
//  Course Repository
//  packages/database/src/repositories/course.repository.ts
// =============================================================================

import { db } from '../client';
import type { CourseStatus, Difficulty, Prisma } from '@prisma/client';
import { getPaginationArgs, buildPaginationMeta } from '../helpers/pagination';

// ─── Projections ──────────────────────────────────────────────────────────────

export const COURSE_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  subtitle: true,
  thumbnailUrl: true,
  price: true,
  status: true,
  difficulty: true,
  tags: true,
  language: true,
  createdAt: true,
  instructor: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
  _count: { select: { enrollments: true, modules: true } },
} satisfies Prisma.CourseSelect;

export const COURSE_DETAIL_SELECT = {
  ...COURSE_CARD_SELECT,
  description: true,
  objectives: true,
  prerequisites: true,
  targetAudience: true,
  completionThreshold: true,
  publishedAt: true,
  modules: {
    where: { deletedAt: null },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      isPublished: true,
      lessons: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          duration: true,
          isFree: true,
          isPublished: true,
          videoUrl: true,
        },
      },
    },
  },
} satisfies Prisma.CourseSelect;

export type CourseCardPayload = Prisma.CourseGetPayload<{ select: typeof COURSE_CARD_SELECT }>;
export type CourseDetailPayload = Prisma.CourseGetPayload<{ select: typeof COURSE_DETAIL_SELECT }>;

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findCourses(params: {
  page?: number;
  limit?: number;
  difficulty?: Difficulty;
  tags?: string[];
  search?: string;
  instructorId?: string;
  status?: CourseStatus;
}) {
  const { skip, take, page, limit } = getPaginationArgs(params);

  const where: Prisma.CourseWhereInput = {
    ...(params.status ? { status: params.status } : { status: 'PUBLISHED' }),
    ...(params.difficulty && { difficulty: params.difficulty }),
    ...(params.instructorId && { instructorId: params.instructorId }),
    ...(params.tags?.length && { tags: { hasSome: params.tags } }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { has: params.search } },
      ],
    }),
  };

  const [total, data] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: COURSE_CARD_SELECT,
    }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
}

export async function findCourseBySlug(slug: string): Promise<CourseDetailPayload | null> {
  return db.course.findUnique({ where: { slug }, select: COURSE_DETAIL_SELECT });
}

export async function findCourseById(id: string): Promise<CourseDetailPayload | null> {
  return db.course.findUnique({ where: { id }, select: COURSE_DETAIL_SELECT });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createCourse(data: Prisma.CourseCreateInput) {
  return db.course.create({ data, select: COURSE_CARD_SELECT });
}

export async function updateCourse(id: string, data: Prisma.CourseUpdateInput) {
  return db.course.update({ where: { id }, data, select: COURSE_DETAIL_SELECT });
}

export async function publishCourse(id: string) {
  return db.course.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
    select: COURSE_CARD_SELECT,
  });
}

export async function updateEnrollmentProgress(
  userId: string,
  courseId: string
): Promise<void> {
  // Recalculate progress: completedLessons / totalPublishedLessons * 100
  const [completed, total] = await Promise.all([
    db.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { module: { courseId }, deletedAt: null },
      },
    }),
    db.lesson.count({
      where: { module: { courseId }, isPublished: true, deletedAt: null },
    }),
  ]);

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const completedAt = progress === 100 ? new Date() : undefined;

  await db.enrollment.update({
    where: { userId_courseId: { userId, courseId } },
    data: {
      progress,
      lastActivity: new Date(),
      ...(completedAt && { completedAt }),
    },
  });
}
