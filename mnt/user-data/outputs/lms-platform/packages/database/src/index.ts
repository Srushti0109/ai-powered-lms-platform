// =============================================================================
//  Database Package — Public API
//  packages/database/src/index.ts
//
//  Only import from this barrel in apps/server and apps/worker.
//  Never import directly from @prisma/client in application code —
//  always go through this package so the singleton and middleware
//  are always active.
// =============================================================================

// Client singleton (use this everywhere)
export { db } from './client';

// Re-export all Prisma generated types for convenience
export type {
  User,
  Profile,
  UserSocialLink,
  Course,
  Module,
  Lesson,
  Enrollment,
  LessonProgress,
  Quiz,
  Question,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  CodingChallenge,
  TestCase,
  Submission,
  Certificate,
  Notification,
  ChatHistory,
  DiscussionPost,
  DiscussionVote,
  AuditLog,
  // Enums
  Role,
  SubmissionStatus,
  Language,
  Difficulty,
  QuestionType,
  NotificationType,
  AssignmentStatus,
  CourseStatus,
  DiscussionType,
  // Prisma namespace (for Prisma.UserWhereInput, etc.)
  Prisma,
} from '@prisma/client';

// Repositories (data-access layer)
export * from './repositories';

// Helpers
export * from './helpers/pagination';
export * from './helpers/soft-delete';
export * from './helpers/transaction';
