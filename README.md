# Migration Strategy

## Overview

This project uses **Prisma Migrate** for schema versioning. All migrations
live in this directory as named, timestamped SQL folders.

---

## Environments

| Environment | Command              | Behaviour                                              |
|-------------|----------------------|--------------------------------------------------------|
| Development | `db:migrate`         | Creates migration files + applies them                 |
| CI / Test   | `db:push`            | Pushes schema without migration history (fast, lossy)  |
| Production  | `db:migrate:prod`    | Applies pending migrations only — no schema drift      |

---

## Workflow

### 1. Make a schema change
Edit `prisma/schema.prisma`.

### 2. Create the migration
```bash
pnpm --filter @lms/database db:migrate
# Prisma prompts: "Name for the migration:" → e.g. "add_user_social_links"
```
This creates: `prisma/migrations/20241101120000_add_user_social_links/migration.sql`

### 3. Regenerate the Prisma Client
```bash
pnpm --filter @lms/database db:generate
```
This is also triggered automatically after `db:migrate`.

### 4. Commit both files
Always commit `schema.prisma` + the new migration folder together.

---

## Production Deploy

The CI/CD pipeline runs this before starting the server:
```bash
prisma migrate deploy
```
It applies all unapplied migrations in chronological order.
**Never** run `migrate dev` in production.

---

## Custom SQL Migrations

For changes Prisma can't handle automatically (renaming columns, complex
index creation, data backfills), edit the generated `.sql` file before
committing. Add a comment explaining why manual SQL was needed.

Example — creating a GIN index on tags arrays (not supported by Prisma):
```sql
-- Migration: 20241101120000_add_gin_indexes
-- Manual addition: GIN indexes for array contains queries on tags columns

CREATE INDEX CONCURRENTLY "courses_tags_gin_idx"
  ON "courses" USING gin ("tags");

CREATE INDEX CONCURRENTLY "coding_challenges_tags_gin_idx"
  ON "coding_challenges" USING gin ("tags");
```

---

## Rollback Strategy

Prisma does not have built-in rollback. Instead:
1. Write a new migration that reverses the change.
2. Keep backups before deploying breaking changes.
3. Use feature flags to gate new schema-dependent code.

---

## Baseline (existing database)

If you have an existing database with no migration history:
```bash
prisma migrate resolve --applied "migration_name"
```
