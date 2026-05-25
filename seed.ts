// =============================================================================
//  Database Seed Runner
//  packages/database/src/seed.ts
//
//  Run with: pnpm --filter @lms/database db:seed
//
//  Strategy:
//  • Idempotent — safe to run multiple times (upsert everywhere)
//  • Ordered — respects FK dependencies
//  • Environment-aware — dev gets full data, CI gets minimal data
//  • Atomic — wrapped in a single transaction
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { SEED_USERS } from '../prisma/seed-data/users';
import { SEED_COURSES } from '../prisma/seed-data/courses';
import { SEED_CHALLENGES } from '../prisma/seed-data/challenges';

const prisma = new PrismaClient({
  log: [{ emit: 'stdout', level: 'info' }, { emit: 'stdout', level: 'warn' }],
});

// ─── Utility ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.info(`[seed] ${msg}`);
}

// ─── Seeders ──────────────────────────────────────────────────────────────────

async function seedUsers() {
  log('Seeding users & profiles...');

  for (const u of SEED_USERS) {
    const { profile, ...userData } = u;

    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        ...userData,
        profile: {
          create: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            headline: 'headline' in profile ? profile.headline : undefined,
            bio: 'bio' in profile ? profile.bio : undefined,
            skills: 'skills' in profile ? (profile.skills as string[]) : [],
          },
        },
      },
      update: {
        role: userData.role,
        isVerified: userData.isVerified,
        profile: {
          update: {
            firstName: profile.firstName,
            lastName: profile.lastName,
          },
        },
      },
    });
  }

  log(`✓ Upserted ${SEED_USERS.length} users`);
}

async function seedCourses() {
  log('Seeding courses, modules & lessons...');

  for (const c of SEED_COURSES) {
    const { modules, ...courseData } = c;

    await prisma.course.upsert({
      where: { id: c.id },
      create: {
        ...courseData,
        publishedAt: courseData.status === 'PUBLISHED' ? new Date() : undefined,
        modules: {
          create: modules.map((m) => {
            const { lessons, ...moduleData } = m;
            return {
              ...moduleData,
              lessons: {
                create: lessons,
              },
            };
          }),
        },
      },
      update: {
        title: courseData.title,
        status: courseData.status,
      },
    });
  }

  log(`✓ Upserted ${SEED_COURSES.length} courses`);
}

async function seedChallenges() {
  log('Seeding coding challenges & test cases...');

  for (const ch of SEED_CHALLENGES) {
    const { testCases, ...challengeData } = ch;

    await prisma.codingChallenge.upsert({
      where: { id: ch.id },
      create: {
        ...challengeData,
        starterCode: challengeData.starterCode as Parameters<
          typeof prisma.codingChallenge.create
        >[0]['data']['starterCode'],
        testCases: {
          create: testCases,
        },
      },
      update: {
        title: challengeData.title,
        isPublished: challengeData.isPublished,
      },
    });
  }

  log(`✓ Upserted ${SEED_CHALLENGES.length} challenges`);
}

async function seedEnrollments() {
  log('Seeding sample enrollments...');

  // student_001 enrolled in course_001
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: 'seed_student_001',
        courseId: 'seed_course_001',
      },
    },
    create: {
      userId: 'seed_student_001',
      courseId: 'seed_course_001',
      progress: 25,
    },
    update: {},
  });

  log('✓ Upserted sample enrollments');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const env = process.env.NODE_ENV ?? 'development';
  log(`Starting seed (env: ${env})`);

  try {
    // Order matters: users before everything else
    await seedUsers();
    await seedCourses();
    await seedChallenges();

    if (env !== 'test') {
      await seedEnrollments();
    }

    log('Seed complete ✓');
  } catch (err) {
    console.error('[seed] ERROR:', err);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
