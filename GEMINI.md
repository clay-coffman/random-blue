# Startup State Atlas - Project Context & Instructions

This file gives Gemini (and any other agent that reads it) the standalone
context needed to work in this repo. It overlaps with `AGENTS.md`
intentionally — `AGENTS.md` is policy; this file is orientation.

> Agent infrastructure (skills, hooks, workflows) lives as real
> files under `.agents/skills/`, `.claude/hooks/`,
> `.github/workflows/`. Originally vendored from
> [`clay-coffman/agent-kit`](https://github.com/clay-coffman/agent-kit);
> now repo-local — edit in place.

## Tech Stack

TODO: short list. Examples:

- TypeScript / Next.js 15 (App Router) on Cloudflare Workers (e.g. TypeScript + React Router v7 + Express)
- Cloudflare D1 (SQLite) + Drizzle ORM (e.g. PostgreSQL via Prisma)
- Tailwind CSS + shadcn/ui (e.g. Tailwind v4 with semantic tokens)
- Auth: X-Atlas-Admin-Token (mock; magic-link domain check for claims) (e.g. email OTP, OAuth, Auth0)
- Secrets: .env.local (dev) + wrangler secrets (prod) + stripe-projects vault for SaaS keys (e.g. Doppler)
- Deploy: Cloudflare Workers (via @opennextjs/cloudflare) (e.g. Railway, Vercel, Fly)
- Monitoring: Cloudflare Workers Observability (built-in, free), none (Workers Analytics covers basics)
- LLM providers: Anthropic Claude (claude-opus-4-7)

## Core Workflows & Commands

### Development

TODO: replace with this project's actual scripts.

```bash
npm run dev
npm run dev:no-mocks
```

### Testing & Validation

```bash
npm test
npm run test:e2e
npm run validate              # full suite
```

### Database

```bash
npm run prisma:migrate
npm run seed
npm run db:refresh-from-prod  # if applicable
```

### Build

```bash
npm run build
npm start
```

## Architecture & Conventions

### Directory Structure

TODO: describe this project's layout (5-10 bullets).

### Routing Groups

TODO: describe route layout and any framework-specific conventions.

### Key Conventions

TODO: list conventions that affect how every change should be written:

- Path aliases used everywhere instead of relative imports
- Form library + validation library
- ORM update semantics (Prisma: `undefined` no-op, `null` clear)
- Design system tokens, not raw colors

## Environment & Worktrees

This repo uses sibling worktrees with per-worktree port offsets. The
worktree index `N` comes from the directory name (`startup-state-atlas-wt<N>`;
main repo = N=0).

| Variable                          | Formula  | main | wt1  | wt2  | wt3  |
| --------------------------------- | -------- | ---- | ---- | ---- | ---- |
| `PORT` (`next dev`)               | 3000 + N | 3000 | 3001 | 3002 | 3003 |
| `WRANGLER_PORT` (`wrangler dev`)  | 8787 + N | 8787 | 8788 | 8789 | 8790 |

D1 is **per-worktree local** — each worktree has its own SQLite at
`<worktree>/.wrangler/state/v3/d1/`. No Docker, no shared dev DB.
After pulling new migrations from `main`, run `npm run db:migrate:local`
in each worktree. Production D1 is created at deploy time, not now.

## Testing Philosophy

- Unit/component tests with Vitest colocated next to source.
- Integration tests against a real local DB.
- E2E tests with Playwright for golden-path flows only.
- External services mocked with none.
- Tests check behavior, not implementation details.

## Production Access

TODO: how to safely query production read-only data, and any constraints.
