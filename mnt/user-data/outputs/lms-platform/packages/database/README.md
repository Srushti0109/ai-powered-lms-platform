# @lms/database

The single source of truth for all database access in the LMS platform.
Every app (`server`, `worker`) imports from this package — never directly from `@prisma/client`.

## What's in here

```
packages/database/
├── prisma/
│   ├── schema.prisma          ← The schema (edit this)
│   ├── migrations/            ← Generated migration history + manual SQL
│   └── seed-data/             ← Typed seed data per domain
├── src/
│   ├── client.ts              ← Prisma singleton with middleware applied
│   ├── seed.ts                ← Seed runner (idempotent upserts)
│   ├── middleware/
│   │   ├── soft-delete.ts     ← Convert delete → deletedAt, filter on reads
│   │   ├── audit-timestamps.ts
│   │   └── query-log.ts
│   ├── helpers/
│   │   ├── pagination.ts      ← getPaginationArgs, buildPaginationMeta, paginate()
│   │   ├── soft-delete.ts     ← softDelete(), restore(), hardDelete()
│   │   └── transaction.ts     ← withTransaction()
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── course.repository.ts
│   │   └── submission.repository.ts
│   └── index.ts               ← Public barrel — import from here
└── package.json
```

## Using in another package

```typescript
// ✅ Correct — always import from @lms/database
import { db, Role, withTransaction } from '@lms/database';
import type { User, Course, Prisma } from '@lms/database';

// ❌ Wrong — bypasses singleton and middleware
import { PrismaClient } from '@prisma/client';
```

## Commands

| Command                | What it does                                                |
|------------------------|-------------------------------------------------------------|
| `pnpm db:generate`     | Re-generates Prisma Client after schema changes             |
| `pnpm db:migrate`      | Creates + applies a new migration (dev only)                |
| `pnpm db:migrate:prod` | Applies pending migrations (CI/production)                  |
| `pnpm db:push`         | Pushes schema without migration history (test/proto only)   |
| `pnpm db:seed`         | Runs the idempotent seed runner                             |
| `pnpm db:reset`        | Drops + recreates + seeds (dev only — destroys data)        |
| `pnpm db:studio`       | Opens Prisma Studio in browser                              |
| `pnpm db:validate`     | Validates schema.prisma without generating                  |
| `pnpm db:format`       | Auto-formats schema.prisma                                  |

Run any command from the monorepo root with:
```bash
pnpm --filter @lms/database <command>
# or via turbo:
pnpm db:generate   # runs db:generate in all packages that have it
```

## Soft Delete

Models with `deletedAt DateTime?` support soft delete.
The middleware intercepts `delete()` and `deleteMany()` calls:

```typescript
// This does NOT hard-delete — middleware converts it to:
// UPDATE users SET deleted_at = NOW() WHERE id = '...'
await db.user.delete({ where: { id } });

// Reads automatically exclude soft-deleted records:
await db.user.findMany();  // WHERE deleted_at IS NULL ← injected by middleware

// Escape hatch — include soft-deleted records:
await db.user.findMany({ where: { includeDeleted: true } });

// GDPR hard-delete:
import { hardDelete } from '@lms/database';
await hardDelete('user', userId);
```

## Transactions

```typescript
import { withTransaction } from '@lms/database';

const result = await withTransaction(async (tx) => {
  const user = await tx.user.create({ data: { ... } });
  await tx.profile.create({ data: { userId: user.id, ... } });
  return user;
});
```

## Pagination

```typescript
import { getPaginationArgs, buildPaginationMeta } from '@lms/database';

const { skip, take, page, limit } = getPaginationArgs({ page: 2, limit: 20 });
const [total, data] = await Promise.all([
  db.course.count({ where }),
  db.course.findMany({ where, skip, take }),
]);
const meta = buildPaginationMeta(total, page, limit);
```
