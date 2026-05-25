-- =============================================================================
--  Manual migration: GIN indexes for array columns
--  Apply after the initial Prisma migration runs.
--
--  Why manual? Prisma Migrate does not support GIN index creation syntax.
--  These are critical for performance of tag-based filtering queries.
-- =============================================================================

-- courses.tags  (supports: { hasSome: [...], has: "...", hasSome: [...] })
CREATE INDEX CONCURRENTLY IF NOT EXISTS "courses_tags_gin_idx"
  ON "courses" USING gin ("tags");

-- coding_challenges.tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS "challenges_tags_gin_idx"
  ON "coding_challenges" USING gin ("tags");

-- coding_challenges.topics
CREATE INDEX CONCURRENTLY IF NOT EXISTS "challenges_topics_gin_idx"
  ON "coding_challenges" USING gin ("topics");

-- profiles.skills
CREATE INDEX CONCURRENTLY IF NOT EXISTS "profiles_skills_gin_idx"
  ON "profiles" USING gin ("skills");

-- Full-text search on courses (title + description)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "courses_fts_idx"
  ON "courses" USING gin (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", ''))
  );

-- Full-text search on coding_challenges
CREATE INDEX CONCURRENTLY IF NOT EXISTS "challenges_fts_idx"
  ON "coding_challenges" USING gin (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", ''))
  );
