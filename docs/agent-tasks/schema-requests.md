# Schema requests

A single queue for schema changes that an agent can't make in their
own worktree. Most schema work doesn't go here — see below.

## When to use this file

You're building under your assigned brief and discover you need a new
column or table that:

- **Affects another agent's frozen surface** — e.g., a new column on
  the Better Auth `user` table (Agent 1 owns those after generation),
  or a new `companies.*` field that Agent 4's GET endpoint and Agent
  5's PATCH whitelist both need to know about.
- **Requires a coordinated migration order** across PRs from multiple
  agents.
- **Has an obvious ripple** to the seed scripts, the OpenAPI spec, or
  another agent's typed responses.

## When NOT to use this file

- **You need a new column scoped to your own surface.** Just edit
  `db/schema.ts` in your worktree. Rebase against `main` first; run
  `npm run db:generate` and `npm run db:migrate:local`. Commit the
  migration in your PR. (See `00-shared-context.md` § Schema
  ownership.)
- **You need a new table no other agent touches.** Same as above.
- **You hit a migration-number collision after merging from `main`.**
  Rename your local migration file to the next free index and re-run
  `npm run db:migrate:local`. No queue entry needed.

## Format

Append a section to the bottom of this file. One block per request:

```markdown
### <YYYY-MM-DD> · Agent <N> · <one-line summary>

- **Table / column:** <fully qualified name>
- **Type:** <SQL type or Drizzle helper>
- **Why:** <what your brief needs this for>
- **Blocks:** <which of your DONE-when criteria depends on it>
- **Suggested owner:** <Agent 1 unless it's auth tables which Agent 1
  also owns>
```

The owning agent picks it up on their next sync, applies the change,
and ships a migration. The requesting agent rebases and consumes.

## Open requests

(none yet)

## Closed requests

(none yet)
