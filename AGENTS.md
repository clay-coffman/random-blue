# Repository Guidelines

This file is the shared operating guide for Codex, Claude Code, and other
coding agents working in this repository. Keep tool-specific behavior in
the tool's own config or skill files (`.claude/`, `.codex`, etc.); keep
project policy here.

> This project uses **`agent-kit`** for shared agent infrastructure.
> Many of the files under `.agents/skills/`, `.claude/hooks/`, and
> `.claude/agents/` are symlinked into `node_modules/agent-kit/`. See
> `.agents/skills/agent-kit/SKILL.md` for how to add, edit, or override
> shared content. **Do not edit symlinked files from inside this repo** —
> changes mutate the shared package across every project that uses it.

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

The repo is currently a bootstrap — only this file, the rendered
agent-kit scaffolding, and `docs/` exist. **Agent 0 (Foundation)
creates the application skeleton.** Target tree:

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
- `.agents/`, `.claude/`, `.github/` — agent-kit + Claude/Codex/CI
  config.

## Branching and PRs

- All work branches from `main`. **Never edit on `main` directly** —
  the agent-kit `protect-main.yml` workflow + `.claude/settings.json`
  PreToolUse hook block any Edit/Write while checked out on `main` or
  `dev`. First action of every agent: `git checkout -b feat/<slice>`.
- Branch names follow `feat/*`, `fix/*`, `chore/*`, `docs/*`.
- Commit messages use conventional prefixes (`feat:`, `fix:`,
  `chore:`, `docs:`).
- PRs target `main`. Use `gh pr create --base main`. Include a test
  plan and screenshots for UI changes.

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
  `ANTHROPIC_API_KEY`, dev port overrides, `ATLAS_ADMIN_TOKEN=dev-only`.
- **`wrangler secret put <NAME>`** — production secrets stored on the
  Worker (e.g. `ANTHROPIC_API_KEY`, `ATLAS_ADMIN_TOKEN`).
- **`stripe projects` vault** — CLI-managed credentials for
  third-party SaaS providers (Cloudflare account, etc.). Run
  `stripe projects add cloudflare/workers` once to provision +
  populate `.env.local`. See `.agents/skills/stripe-projects/SKILL.md`.

`.env.example` lists every required variable. **Never commit `.env`
files.** A pre-commit guard isn't wired (skipping ceremony for the
hackathon) — be deliberate.

## Worktrees and Ports

This repo is set up for **persistent sibling worktrees** so up to three
agents can run isolated dev servers in parallel. Worktree index `N`
comes from `startup-state-atlas-wt<N>`; the main checkout uses `N=0`.

| Variable                          | Formula  | main | wt1  | wt2  | wt3  |
| --------------------------------- | -------- | ---- | ---- | ---- | ---- |
| `PORT` (`next dev`)               | 3000 + N | 3000 | 3001 | 3002 | 3003 |
| `WRANGLER_PORT` (`wrangler dev`)  | 8787 + N | 8787 | 8788 | 8789 | 8790 |

D1 is a **shared remote database** — no per-worktree DB. All worktrees
hit the same `startup-state-atlas-db`. **Schema changes go through
Agent 1 only** (see `docs/agent-tasks/00-shared-context.md`); other
agents read/seed but don't run `drizzle-kit generate`.

Use the shared worktree skills for the lifecycle:

- `create-worktree`: create a new isolated worktree (it has TODOs to
  customize for this project — Agent 0 fills them in).
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
  resources, `rec_*` recommendations, `cl_*` claims. Use the
  `lib/ids.ts` helper.
- **Schema ownership:** only Agent 1 alters `db/schema.ts`. Other
  agents read/seed; if they need a new column, they ask Agent 1.

## Testing

- Unit/component: **Vitest**.
- E2E: **Playwright** (set up by Agent 0 if scope allows; otherwise
  manual smoke tests).
- External services: **no mocking lib** — call real Anthropic API in
  tests with cheap models, or stub with hand-written fakes.
- Use `agent-browser` for browser automation and visual checks (the
  agent-kit hook auto-allows it).

## Operations

- **Deploy target:** Cloudflare Workers via `wrangler deploy`.
- **Observability:** Cloudflare Workers built-in (free) — set
  `observability.enabled = true` in `wrangler.jsonc`. Live tail with
  `wrangler tail`. Search/retention via the Workers dashboard. No
  Sentry/PostHog this hackathon.
- **Production read-only DB access:** `wrangler d1 execute
  startup-state-atlas-db --command "SELECT ..."` from the CLI. Read
  queries only.
