# Repository Guidelines

This file is the shared operating guide for Codex, Claude Code, and other
coding agents working in this repository. Keep tool-specific behavior in
the tool's own config or skill files (`.claude/`, `.codex`, etc.); keep
project policy here.

> Agent infrastructure (skills, hooks, workflows, agents) lives as
> real files under `.agents/skills/`, `.claude/hooks/`,
> `.claude/agents/`, and `.github/workflows/`. They were vendored
> from [`clay-coffman/agent-kit`](https://github.com/clay-coffman/agent-kit)
> at hackathon kickoff but are now repo-local — edit them in place.
> The corresponding `.claude/skills/<name>` entries are relative
> symlinks into `.agents/skills/<name>` so Claude and Codex share a
> single copy of each skill.

## Project Overview

**Startup State Atlas** is a 24-hour hackathon build of Utah's
agent-readable map of startup companies, founder resources, funding
sources, mentor networks, and ecosystem programs. It exposes:

- A polished **Founder Navigator** (intake → personalized 90-day plan)
  and **investor map** for human users.
- A canonical **agent-native layer** (REST API, CLI, MCP server,
  `/llms.txt`, `/AGENTS.md`, per-company `.md`/`.json` profiles) for
  ChatGPT/Claude/Codex-style agents.

Runtime: **Next.js 15 (App Router) on Cloudflare Workers** via
`@opennextjs/cloudflare`. DB: **Cloudflare D1** (SQLite at edge) with
**Drizzle ORM**. LLM: **Anthropic Claude `claude-opus-4-7`**. Map:
**MapLibre GL** (open tiles).

Code is hosted on **GitHub** (`clay-coffman/startup-state-atlas`).
Deployed to **Cloudflare Workers** via `wrangler deploy`. Provisioning
of third-party services flows through the **Stripe Projects CLI**
(`stripe projects`) — see `.agents/skills/stripe-projects/SKILL.md`.

The full product spec lives in `docs/hackathon-plan.md`. The condensed
requirements doc is `docs/requirements.md`. Architecture is in
`docs/architecture.md`. Per-agent task briefs are in
`docs/agent-tasks/`.

## Project Structure

The repo is currently a bootstrap — only this file, the vendored
agent infrastructure under `.agents/`/`.claude/`/`.github/`, and
`docs/` exist. **Agent 0 (Foundation) creates the application
skeleton.** Target tree:

- `app/` — Next.js App Router pages, layouts, API routes
  (`app/api/v1/...`).
- `db/` — Drizzle schema (`schema.ts`), migrations, seeders.
- `lib/` — DB client, Anthropic client, error helpers, ID helpers,
  Cloudflare env accessor.
- `schemas/` — zod schemas (founder passport, company profile, etc.).
- `types/` — generated TS types from API contract.
- `cli/` — single-file CLI entry (`cli/index.ts`); installed as the
  `startup-state` bin.
- `mcp/` — MCP server entry (`mcp/server.ts`); stdio for local Claude
  Desktop demo.
- `public/` — static assets, including `public/llms.txt` and the
  end-user-agent `public/AGENTS.md`.
- `docs/` — `hackathon-plan.md`, `requirements.md`, `architecture.md`,
  `agent-tasks/`.
- `.agents/`, `.claude/`, `.github/` — vendored Claude/Codex/CI
  agent infrastructure (skills, hooks, workflows, agents).

## Branching and PRs

- All work branches from `main` (**trunk-based**: `feat/*` → `main`
  directly; we don't use a `dev` integration branch). **Never edit on
  `main` directly** — the local `.claude/settings.json` PreToolUse
  hook blocks any Edit/Write while checked out on `main`, and GitHub
  branch protection blocks direct pushes. First action of every
  agent: `git checkout -b feat/<slice>`.
- Branch names follow `feat/*`, `fix/*`, `chore/*`, `docs/*`, or
  `refactor/*`. The `.github/workflows/protect-main.yml` workflow
  validates this on every PR.
- Commit messages use conventional prefixes (`feat:`, `fix:`,
  `chore:`, `docs:`, `refactor:`).
- PRs target `main`. Use `gh pr create --base main`. Include a test
  plan and screenshots for UI changes. Squash-merge only.

## Runtime and Tooling

- Node.js **22** (we'll set engines field once Agent 0 scaffolds the
  app).
- Package manager: **npm** (default).
- Search: **`rg`** (ripgrep). Prefer project scripts over ad-hoc
  commands.
- Do not run destructive git, database, secrets, or infra operations
  unless the user explicitly asks for that operation.
- For Cloudflare operations, use **`wrangler`**. For provisioning new
  third-party services (Cloudflare account linkage, Sentry, etc.),
  use **`stripe projects`** — see the `stripe-projects` skill.

## Commands (target — Agent 0 wires these up)

```bash
# Development
npm run dev                       # Next.js dev (port 3000+N)
npm run preview                   # local Worker preview (port 8787+N)

# Database (D1 via wrangler)
npm run db:generate               # drizzle-kit generate
npm run db:migrate:local          # wrangler d1 migrations apply --local
npm run db:migrate:remote         # wrangler d1 migrations apply --remote
npm run seed                      # load personas + CSVs into D1

# Agent-native surfaces
npm run cli                       # exec local CLI (startup-state ...)
npm run mcp                       # local stdio MCP server

# Test / lint / typecheck
npm test                          # vitest
npm run test:e2e                  # playwright
npm run lint
npm run typecheck

# Deploy
npm run deploy                    # wrangler deploy
```

## Environment and Secrets

We have **no enterprise secrets manager** in this hackathon — speed
over ceremony. Layered approach:

- **`.env.local`** (per-worktree, gitignored) — local dev values:
  `ANTHROPIC_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `RESEND_API_KEY`, dev port overrides,
  `ATLAS_ADMIN_TOKEN=dev-only`.
- **`wrangler secret put <NAME>`** — production secrets stored on the
  Worker: `ANTHROPIC_API_KEY`, `BETTER_AUTH_SECRET`,
  `RESEND_API_KEY`, `ATLAS_ADMIN_TOKEN`.
- **`stripe projects` vault** — CLI-managed credentials for
  third-party SaaS providers (Cloudflare account, etc.). Run
  `stripe projects add cloudflare/workers` once to provision +
  populate `.env.local`. See `.agents/skills/stripe-projects/SKILL.md`.

`.env.example` lists every required variable. **Never commit `.env`
files.** A pre-commit guard isn't wired (skipping ceremony for the
hackathon) — be deliberate.

## Authentication

The product has a **dual auth model**:

- **Human users** (founders + GOEO admins) authenticate via
  **Better Auth** (email + password, self-hosted in our D1 via
  the Drizzle adapter). Sessions are cookie-based and stored in
  D1. Roles: `owner` (default for sign-up), `goeo_admin` (Utah
  Startup State staff), `superadmin` (bootstrapping role).
  - Better Auth uses **Web Crypto** for password hashing — do
    not reach for `bcrypt`, `bcryptjs`, or anything that pulls
    in `node:crypto`. Workers don't have it.
  - `auth.ts` lives at the repo root. Agent 1 writes a stub
    (just enough for the `@better-auth/cli` generator); Agent 5
    expands it with email-verification + reset hooks and the
    role plugin.
  - Email verification + password reset go through the
    `send-email` skill (Resend). If `RESEND_API_KEY` is unset,
    fall back to logging the link to `console.log` so dev and
    demo still work.
  - First `superadmin` is bootstrapped via
    `npm run bootstrap-superadmin <email>`. After that,
    `superadmin` promotes others to `goeo_admin` from
    `/admin/users`.

- **Machine clients** (the `startup-state` CLI, the MCP server,
  ad-hoc curl from external agents) use the
  `X-Atlas-Admin-Token` header, validated against
  `env.ATLAS_ADMIN_TOKEN`. This is a service-account-style
  token — it bypasses Better Auth, assumes a privileged caller,
  but the route handler still enforces business rules (e.g.
  only the user matched to `companies.claimed_by_user_id` can
  edit a claimed company unless the caller has admin role).

Read endpoints are unauthenticated for both paths. Anonymous
founder-passport intake stays anonymous — sign-up is not required
to use the Founder Navigator.

Verification documents (uploaded by owners during the claim flow)
live in the `OWNERSHIP_DOCS` R2 bucket (`atlas-ownership-docs`).
Admins fetch via short-lived signed URLs; documents are never
served as public URLs.

## Worktrees and Ports

This repo is set up for **persistent sibling worktrees** so up to three
agents can run isolated dev servers in parallel. Worktree index `N`
comes from `startup-state-atlas-wt<N>`; the main checkout uses `N=0`.

| Variable                          | Formula  | main | wt1  | wt2  | wt3  |
| --------------------------------- | -------- | ---- | ---- | ---- | ---- |
| `PORT` (`next dev`)               | 3000 + N | 3000 | 3001 | 3002 | 3003 |
| `WRANGLER_PORT` (`wrangler dev`)  | 8787 + N | 8787 | 8788 | 8789 | 8790 |

D1 is **per-worktree local** — each worktree has its own SQLite file
under `<worktree>/.wrangler/state/v3/d1/`, written by `wrangler d1
... --local` and `wrangler dev`. The binding name is the same in
every worktree (`startup-state-atlas-db`), but the data is isolated.
No Docker, no shared remote dev DB. The production D1 instance is
created at deploy time, not during local development.

Any agent may edit `db/schema.ts`, run `npm run db:generate` (Drizzle),
and apply with `npm run db:migrate:local` against their own worktree.
Drizzle migration files are sequentially numbered (`0001_*.sql`,
`0002_*.sql`, …) — **rebase against `main` before running
`db:generate`** so two parallel agents don't ship colliding indexes.
If a collision lands on `main`, rename the loser's file to the next
free index and re-run `db:migrate:local`.

Use the shared worktree skills for the lifecycle:

- `create-worktree`: create a new isolated worktree (per-worktree
  local D1 + ports; project-customized).
- `refresh-worktrees`: repair/sync worktree local config.
- `validate-worktrees`: read-only health check across worktrees.

Never hardcode local ports in tests or scripts. Read them from
`.env.local`.

## MCP, Apps, and Local Auth

`.mcp.json` is gitignored — keep it local or symlinked from a trusted
source. No bearer tokens, API keys, or PATs in tracked files.

For local agent-side MCP usage, prefer env-var-based auth.

## Architecture Notes

See **`docs/architecture.md`** for the full picture: stack table, ASCII
system diagram, repo layout, data flow, Cloudflare bindings,
observability setup, deploy flow.

Highlights:

- Single Next.js app deployed to Cloudflare Workers via OpenNext.
- D1 binding `DB`, R2 binding `ASSETS` (only if photos in scope).
- API routes under `/api/v1/...`. Versioned from day one.
- CLI (`cli/index.ts`) and MCP server (`mcp/server.ts`) live in the
  same package as `bin` entries (`startup-state` and
  `startup-state-mcp`). No npm workspaces.
- Two `AGENTS.md` files, two audiences:
  - `/AGENTS.md` (this file) → coding agents working in the repo.
  - `/public/AGENTS.md` → end-user agents calling the API. Served at
    `https://<host>/AGENTS.md`.

## Coding Style

- TypeScript strict mode. Formatting via Prettier (printWidth 80, per
  `~/.prettierrc.yaml`) + ESLint.
- **API on the wire:** snake_case (request bodies, response bodies,
  query params). **TS code:** camelCase. Convert at the boundary.
- **Map:** MapLibre GL only. No Mapbox tokens.
- **UI:** Tailwind + shadcn/ui primitives.
- **Responsive design (REQUIRED):** every page — Founder Navigator,
  map, company profiles, claim flow, GOEO admin UI, `/agents` —
  must work on **both desktop and mobile**. Mobile is not a
  "nice-to-have" or a v2; the demo audience and real founders will
  open this on phones. Concretely:
  - Design mobile-first (Tailwind `base` styles target ≤ 375px),
    then layer `sm:` / `md:` / `lg:` breakpoints up.
  - Test every shipped page at three widths: **375px** (iPhone
    SE), **768px** (tablet), **1280px+** (desktop). No horizontal
    scroll at 375px. Tap targets ≥ 44×44 px.
  - Map and admin tables need explicit mobile fallbacks: tables
    collapse to stacked cards or use horizontal scroll inside a
    bounded container; the map fills the viewport with a
    bottom-sheet sidebar instead of a side panel.
  - Use the device toolbar in `agent-browser` (or
    `mcp__playwright__browser_resize`) during UI testing — don't
    ship a page you've only viewed at desktop width.
- `target="_blank"` links must include `rel="noopener noreferrer"`.
- **Error response shape:**
  `{ error: { code: string, message: string, details?: any } }`.
- **ID prefixes:** `fp_*` founder passports, `co_*` companies, `r_*`
  resources, `rec_*` recommendations, `bos_*` business ownership
  submissions. Use the `lib/ids.ts` helper. (Better Auth's `user`,
  `session`, `account`, `verification` IDs are generated by Better
  Auth itself — leave them alone.)
- **Schema ownership:** any agent may edit `db/schema.ts` and
  generate a migration in their own worktree. Rebase against
  `main` before running `npm run db:generate` so the new
  migration's number doesn't collide with one merged in parallel.
  Agent 1 still owns the *initial* schema + persona seed; later
  changes are anyone's.

## Testing

- Unit/component: **Vitest**.
- E2E: **Playwright** (set up by Agent 0 if scope allows; otherwise
  manual smoke tests).
- External services: **no mocking lib** — call real Anthropic API in
  tests with cheap models, or stub with hand-written fakes.
- Use `agent-browser` for browser automation and visual checks
  (`.claude/hooks/allow-agent-browser.sh` auto-allows it).

## Operations

- **Deploy target:** Cloudflare Workers via `wrangler deploy`.
- **Observability:** Cloudflare Workers built-in (free) — set
  `observability.enabled = true` in `wrangler.jsonc`. Live tail with
  `wrangler tail`. Search/retention via the Workers dashboard. No
  Sentry/PostHog this hackathon.
- **Production read-only DB access:** `wrangler d1 execute
  startup-state-atlas-db --command "SELECT ..."` from the CLI. Read
  queries only.
