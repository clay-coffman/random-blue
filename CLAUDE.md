# CLAUDE.md

Claude Code-specific notes. Project policy lives in `AGENTS.md` —
read that first. The phase-by-phase execution map lives in
`docs/implementation-plan.md`.

## Where to start

If you're forking into a worktree:

1. **`docs/implementation-plan.md`** — find your phase, your branch,
   and what unblocks you.
2. **`docs/agent-tasks/00-shared-context.md`** — port table, branch
   protocol, blocker rules.
3. **`docs/agent-tasks/agent-<N>-<slice>.md`** — your detailed brief.
4. **`AGENTS.md`** (root) — repo policy.
5. **`docs/architecture.md`** — stack, bindings, frozen contracts.
6. **`docs/screens.md`** — only if you own a UI surface (the URL
   matrix maps screens to wireframes).
7. **`docs/design-guidelines.md`** — only if you own a UI surface.
   Brand tokens, primitives, persona URL contract, and the responsive
   non-negotiables. Frozen by Agent 7.

## Project at a glance

**Startup State Atlas** — a 24-hour hackathon build for Utah's
Governor's Office of Economic Development (GOED). Two products in
one platform: the **Founder's Navigator** (intake → personalized
plan) and the **Utah Startup Map**. Polished founder/investor product
on top, agent-native API/CLI/MCP underneath. Winning builds may go
live on <https://startup.utah.gov/>.

Stack (full table in `docs/architecture.md` § Stack): Next.js 15
App Router on Cloudflare Workers via `@opennextjs/cloudflare`,
D1 + Drizzle, R2 for ownership docs, MapLibre GL, Anthropic Claude
`claude-opus-4-7` for source-bound explanations, Better Auth for
human users, `X-Atlas-Admin-Token` for machine clients.

**Every UI must be responsive.** Design mobile-first (Tailwind base
= ≤375px), then layer up `sm: md: lg:`. Test every page at
375 / 768 / 1280px before calling it done. Full policy in
`AGENTS.md` § Coding Style. Brand tokens, primitives, and the
persona URL contract live in `docs/design-guidelines.md` — read it
before adding any new UI.

## Source data (provided — don't research, build)

The GOED-provided datasets live in `docs/source_data/`. Use them
as-is:

- `page-2026-05-08-19-38-24.md` — the canonical hackathon brief.
  Verbatim persona descriptions, required profile fields, judging
  breakdown (30% usability / 25% tech / 25% design / 20% innovation).
- `Map Data for Builder Day  - Sheet1.csv` — 254 companies (note
  the **double space** in the filename).
- `Resources List - Builder Day - Sheet1.csv` — 226 resources
  (pipe-separated multi-values; upstream IDs preserved as `r_<id>`).

Agent 1 owns the loaders (`db/seed/*.ts`). Other agents consume
seeded data — no need to re-read the CSVs at runtime.

## Design reference

HTML/CSS/JS wireframes from Claude Design live in
`design/startup-state-atlas-wireframes/`. The screen-by-screen
ownership map (URL → wireframe variant → owning agent → role gate)
is in `docs/screens.md`. Read the HTML/CSS directly; don't render
or screenshot unless asked.

## Commands

The repo bootstrap is merged (Agent 0). Target npm scripts (full
list in `AGENTS.md` § Commands):

```
npm run dev                # next dev (port 3000+N — see worktree formula)
npm run preview            # local Cloudflare Worker preview (port 8787+N)
npm run db:generate        # drizzle-kit generate
npm run db:migrate:local   # wrangler d1 migrations apply --local
npm run db:migrate:remote  # wrangler d1 migrations apply --remote
npm run seed               # load personas + read CSVs from docs/source_data/
npm run cli                # local CLI entry (startup-state ...)
npm run mcp                # local stdio MCP server
npm test                   # vitest
npm run test:e2e           # playwright
npm run lint / typecheck
npm run deploy             # wrangler deploy
```

`postinstall` runs `agent-kit sync` to refresh symlinks under
`.agents/skills/` and `.claude/`. Don't disable it.

## Hard rules

Frozen contracts are documented once in `docs/architecture.md` §
Contracts and `docs/agent-tasks/00-shared-context.md` § Pre-decided
conventions. Don't restate them here. The names so you know what's
locked:

- API path prefix `/api/v1/...`
- Error shape `{ error: { code, message, details? } }` via
  `lib/api-error.ts`
- ID prefixes `fp_*`, `co_*`, `r_*`, `rec_*`, `bos_*` via
  `lib/ids.ts`
- snake_case on the wire, camelCase in TS
- Dual auth model (Better Auth for humans, `X-Atlas-Admin-Token`
  for machines)
- Worktree port formula `PORT = 3000 + N`,
  `WRANGLER_PORT = 8787 + N` — see
  `docs/agent-tasks/00-shared-context.md` § Worktree port table

Two cross-cutting rules that are easy to get wrong:

- **Two env files, two purposes.** `.env.local` (per-worktree, gitignored)
  carries `PORT`, `WRANGLER_PORT`, and `CLOUDFLARE_API_TOKEN` — read by
  `process.env` (Next.js, drizzle-kit, wrangler CLI). `.dev.vars` (also
  gitignored, template at `.dev.vars.example`) carries provider secrets
  (`ANTHROPIC_API_KEY`, `PARALLEL_API_KEY`, `BETTER_AUTH_SECRET`, etc.) —
  read by `env()` (the Cloudflare binding helper in `lib/cf.ts`) via
  `initOpenNextCloudflareForDev()` in `next.config.ts`. Code in `lib/*`
  reads secrets through `env()` so the same call works in dev (from
  `.dev.vars`) and prod (from `wrangler secret put`). If you put a secret
  in `.env.local`, lib code won't see it.
- **D1 is per-worktree local.** Each worktree has its own SQLite at
  `<worktree>/.wrangler/state/v3/d1/`. The binding name is the same
  in every worktree (`startup-state-atlas-db`) but the data is
  isolated. After pulling new migrations from `main`, run
  `npm run db:migrate:local` and `npm run seed` in your worktree.
  Production D1 is created at deploy time, not now.
- **Schema is collaborative.** Any agent may edit `db/schema.ts` and
  generate a migration in their own worktree. **Rebase against
  `main` before running `npm run db:generate`** so two parallel
  agents don't ship colliding migration numbers (`0003_*.sql`). If a
  collision lands on `main`, rename the loser's file to the next
  free index. Agent 1 owns the *initial* schema + persona seed; the
  Better Auth tables (`user`, `session`, `account`, `verification`)
  are frozen after Agent 1 runs `@better-auth/cli generate`. If you
  need a column you can't add yourself, append a request to
  `docs/agent-tasks/schema-requests.md`.

## Working in a worktree

If you're a parallel Claude Code session spawned in a worktree, the
reading order in "Where to start" above is the only thing you need.

`git checkout -b feat/<slice>` first (the `protect-main` hook blocks
edits on `main`). Work to your brief's DONE-when criteria. Keep a
clean PR scope.

## Claude Code Hooks

Local safety + convenience hooks in `.claude/settings.json` and
`.claude/hooks/`:

- **`protect-main`** (inline in settings.json) — Edit/Write blocked
  while on `main`. Create a feature branch first.
- **`guard-shared-edits.sh`** — kept for parity with the original
  agent-kit setup; not load-bearing now (nothing in this repo
  symlinks into a shared package). Safe to leave or remove.
- **`allow-agent-browser.sh`** — auto-approves `agent-browser` Bash.
- **`allow-linear.sh`** — auto-approves Linear API calls (except
  destructive org/team/project/user/workspace mutations).
- **`allow-doppler.sh`** — installed but unused. No-op.
- **`cc-notify.sh`** — Notification + Stop hook (desktop ping).

Codex follows `AGENTS.md`, `.agents/skills/`, and its own approval
policy.

## Claude Skills

Skills live in `.agents/skills/<name>/SKILL.md`. The corresponding
`.claude/skills/<name>` is a relative symlink so Claude and Codex
share one source of truth.

Add a skill: drop `SKILL.md` (with frontmatter) into a new
`.agents/skills/<name>/`, then symlink `.claude/skills/<name>` →
`../../.agents/skills/<name>`. Edit by editing the source file
directly — there's no longer any "shared package" to publish back to.

Claude-only behavior stays in `.claude/` and must not duplicate
project policy from `AGENTS.md`.
