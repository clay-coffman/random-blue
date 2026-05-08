---
name: prisma
description: >-
  Prisma CLI operations. Use when running migrations, managing the database
  schema, seeding data, resetting databases, or troubleshooting migration
  issues.
allowed-tools: Bash(npx prisma:*), Bash(npm run prisma:*), Bash(npm run seed:*)
---

# Prisma CLI Operations

## Schema and Client

- Schema: `prisma/schema.prisma`
- Client singleton: `app/utils/db.server.ts`
- Seed script: `prisma/seed.ts`
- Migrations: `prisma/migrations/`

## Environment

Shared env vars come from your secrets manager (e.g. Doppler, dotenv, AWS
Secrets Manager). Per-worktree database URLs typically live in `.env.local`.
Prefer npm scripts since they already include the correct env wrapper where
needed.

If your project uses per-worktree DB ports, you can usually discover the
active local port from `.env.local`:

```bash
DB_PORT=$(grep '^DB_PORT=' .env.local | cut -d= -f2)
```

## npm Scripts

```bash
npm run prisma:migrate    # prisma migrate dev
npm run prisma:generate   # prisma generate
npm run prisma:studio     # prisma studio
npm run seed              # tsx prisma/seed.ts (wrap with your secrets runner if needed)
```

## Migration Workflow

1. Check current status: `npx prisma migrate status`
2. Edit `prisma/schema.prisma`.
3. Validate schema: `npx prisma validate`
4. Create migration: `npm run prisma:migrate -- --name descriptive_name`
5. Regenerate client if needed: `npm run prisma:generate`
6. Run affected tests.

## Safety Rules

- Never run `migrate reset` against staging or production.
- Always check `migrate status` before running migrations.
- Use `migrate dev` locally and `migrate deploy` in CI/production.
- Review generated SQL in `prisma/migrations/` before committing.
- Back up data before destructive schema changes.

## Direct Local Access

Replace `<user>`, `<db>`, and `<password>` with your project's local
PostgreSQL credentials.

```bash
DB_PORT=$(grep '^DB_PORT=' .env.local | cut -d= -f2)
PGPASSWORD=<password> psql -h localhost -p "$DB_PORT" -U <user> -d <db>
```

## Schema Patterns

### Adding a Model

```prisma
model NewModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  name      String

  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("new_models")
}
```

Add the reverse relation to `User` when required.

### Adding an Enum

```prisma
enum Status {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

### Adding an Index

```prisma
@@index([userId, createdAt])
@@unique([userId, externalRefId])
```

## Troubleshooting

- "Migration has already been applied": inspect the existing migration folder
  under `prisma/migrations/` before recreating it.
- "Drift detected": run `npx prisma migrate dev` locally to create a migration
  that reconciles the difference.
- Shadow database errors: ensure the local Docker DB user can create databases.
- Missing `@prisma/client`: run `npm run prisma:generate`.
