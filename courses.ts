// =============================================================================
//  Seed Data — Courses, Modules, Lessons
// =============================================================================

export const SEED_COURSES = [
  {
    id: 'seed_course_001',
    instructorId: 'seed_inst_001',
    title: 'Complete Node.js & Express API Development',
    slug: 'complete-nodejs-express-api',
    subtitle: 'Build production-ready REST APIs with Node.js, Express, TypeScript & PostgreSQL',
    description:
      'A comprehensive course covering everything you need to build scalable, secure, ' +
      'and maintainable backend APIs. From HTTP fundamentals to JWT authentication, ' +
      'database design, and deployment.',
    difficulty: 'INTERMEDIATE' as const,
    status: 'PUBLISHED' as const,
    tags: ['nodejs', 'express', 'typescript', 'postgresql', 'api'],
    objectives: [
      'Build RESTful APIs with Express.js and TypeScript',
      'Design and query relational databases with PostgreSQL & Prisma',
      'Implement secure JWT authentication with refresh tokens',
      'Write unit and integration tests with Jest',
      'Deploy to production with Docker and Railway',
    ],
    prerequisites: ['Basic JavaScript knowledge', 'Familiarity with HTML/CSS'],
    price: 0,
    completionThreshold: 80,
    modules: [
      {
        id: 'seed_mod_001',
        title: 'Introduction & Setup',
        order: 1,
        isPublished: true,
        lessons: [
          {
            id: 'seed_les_001',
            title: 'Course Overview & What We Will Build',
            order: 1,
            duration: 420,
            isFree: true,
            isPublished: true,
            content: '# Welcome\n\nIn this course we will build a production-grade API...',
          },
          {
            id: 'seed_les_002',
            title: 'Setting Up Your Development Environment',
            order: 2,
            duration: 900,
            isFree: true,
            isPublished: true,
          },
        ],
      },
      {
        id: 'seed_mod_002',
        title: 'Express Fundamentals',
        order: 2,
        isPublished: true,
        lessons: [
          {
            id: 'seed_les_003',
            title: 'Routing & Middleware',
            order: 1,
            duration: 1800,
            isFree: false,
            isPublished: true,
          },
          {
            id: 'seed_les_004',
            title: 'Error Handling Patterns',
            order: 2,
            duration: 1500,
            isFree: false,
            isPublished: true,
          },
        ],
      },
    ],
  },
];
