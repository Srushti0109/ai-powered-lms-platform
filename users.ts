// =============================================================================
//  Seed Data — Users
//  Hard-coded for deterministic local dev. Passwords are "Password123!"
//  Hash generated with: bcrypt.hashSync("Password123!", 12)
// =============================================================================

export const SEED_USERS = [
  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    id: 'seed_admin_001',
    email: 'admin@lms.dev',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxzJT5wJkMbh3sC',
    role: 'ADMIN' as const,
    isVerified: true,
    profile: {
      firstName: 'Super',
      lastName: 'Admin',
      headline: 'Platform Administrator',
    },
  },
  // ── Instructors ────────────────────────────────────────────────────────────
  {
    id: 'seed_inst_001',
    email: 'instructor@lms.dev',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxzJT5wJkMbh3sC',
    role: 'INSTRUCTOR' as const,
    isVerified: true,
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      headline: 'Senior Software Engineer | 10+ years React & Node',
      bio: 'Passionate educator helping developers level up their skills.',
      skills: ['React', 'Node.js', 'TypeScript', 'System Design'],
    },
  },
  // ── Students ───────────────────────────────────────────────────────────────
  {
    id: 'seed_student_001',
    email: 'student@lms.dev',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxzJT5wJkMbh3sC',
    role: 'STUDENT' as const,
    isVerified: true,
    profile: {
      firstName: 'Alex',
      lastName: 'Johnson',
      headline: 'CS Student | Learning full-stack development',
      skills: ['JavaScript', 'Python'],
    },
  },
  {
    id: 'seed_student_002',
    email: 'student2@lms.dev',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxzJT5wJkMbh3sC',
    role: 'STUDENT' as const,
    isVerified: true,
    profile: {
      firstName: 'Maria',
      lastName: 'Garcia',
      headline: 'Self-taught developer transitioning from data science',
      skills: ['Python', 'SQL'],
    },
  },
];
