# CLAUDE.md

This file contains Claude Code specific notes for this repository. Shared
project policy, architecture, commands, environment rules, worktree guidance,
and coding conventions live in `AGENTS.md`; read that first.

## Project at a glance

**Startup State Atlas** — 24-hour hackathon build. Next.js 15 (App Router)
on Cloudflare Workers (via `@opennextjs/cloudflare`), D1 + Drizzle, MapLibre
map, Anthropic Claude `claude-opus-4-7` for source-bound explanations.
Polished founder/investor product on top, agent-native API/CLI/MCP
underneath. Full spec: `docs/hackathon-plan.md`. Distilled requirements:
`docs/requirements.md`. Architecture: `docs/architecture.md`.

**Every UI must be responsive — desktop AND mobile.** Design
mobile-first (Tailwind base = ≤375px), then layer up `sm: md: lg:`.
Test every page you ship at 375 / 768 / 1280px before calling it
done. No horizontal scroll at 375px; tap targets ≥ 44×44 px. Tables
collapse to cards on mobile; the map uses a bottom-sheet sidebar at
narrow widths. Use `mcp__playwright__browser_resize` (or the
`agent-browser` device toolbar) during UI testing. Full policy in
`AGENTS.md` § Coding Style.

## Architecture at a glance

Two layers over the same D1 data:

- **Web product** (Next.js App Router on Cloudflare Workers): Founder
  Navigator intake → 90-day plan, ecosystem map (MapLibre), company
  profiles, self-service claim flow, GOEO admin UI.
- **Agent-native layer**: REST at `/api/v1/...`, CLI binary
  `startup-state`, MCP server `startup-state-mcp`, `/llms.txt`, public
  `/AGENTS.md`. Same DB; machine-friendly surfaces.

Dual auth model (frozen):

- **Humans** → Better Auth (cookie sessions in D1, Web Crypto only — no
  Node `crypto`). Roles: `owner` (sign-up default), `goeo_admin`,
  `superadmin`. Email verification + password reset via Resend.
- **Machine clients** (CLI / MCP / scripts) → `X-Atlas-Admin-Token`
  header validated against `env.ATLAS_ADMIN_TOKEN`.
- Reads are unauthenticated. Anonymous founder-passport intake is
  allowed.

LLM usage is narrow and source-bound: Claude `claude-opus-4-7` generates
*explanations* for recommendations, not the rankings. Scoring is
deterministic field-match (see Agent 2 brief). Prompt caching is required.

## Commands

> **The repo is in bootstrap state.** Only docs and agent-kit
> scaffolding exist; Agent 0's brief
> (`docs/agent-tasks/agent-0-foundation.md`) wires up the Next.js
> scaffold, `wrangler.jsonc`, Drizzle config, and most of the scripts
> below. Until Agent 0 lands, `npm run dev` etc. will not work.

Target npm scripts (full list and details in `AGENTS.md` § Commands):

```
npm run dev                # next dev (port 3000+N — see worktree formula below)
npm run preview            # local Cloudflare Worker preview (port 8787+N)
npm run db:generate        # drizzle-kit generate  (Agent 1 only — see Hard rules)
npm run db:migrate:local   # wrangler d1 migrations apply --local
npm run db:migrate:remote  # wrangler d1 migrations apply --remote
npm run seed               # load personas + resource/company CSVs into D1
npm run cli                # local CLI entry (startup-state ...)
npm run mcp                # local stdio MCP server
npm test                   # vitest
npm run test:e2e           # playwright
npm run lint / typecheck
npm run deploy             # wrangler deploy
```

`postinstall` runs `agent-kit sync` to refresh symlinks under
`.agents/skills/` and `.claude/`. Don't disable it.

## Hard rules to remember

A few cross-cutting rules that cause real damage if violated. Full
policy in `AGENTS.md` and `docs/agent-tasks/00-shared-context.md`.

- **Schema ownership: Agent 1 only.** Do not modify `db/schema.ts` or
  run `drizzle-kit generate` from any other agent's worktree. Need a
  new column? Append a request to `docs/agent-tasks/schema-requests.md`
  for Agent 1 to pick up.
- **D1 is shared remote.** Every worktree binds to the same
  `startup-state-atlas-db`. Don't try to provision a per-worktree DB.
- **All API routes live under `/api/v1/...`** from day one.
- **Frozen error shape:** `{ error: { code, message, details? } }`. Use
  `lib/api-error.ts`.
- **ID prefixes (frozen):** `fp_*` (founder passports), `co_*`
  (companies), `r_*` (resources), `rec_*` (recommendations), `bos_*`
  (business ownership submissions). Generate via `lib/ids.ts`.
- **Casing:** snake_case on the wire, camelCase in TS. Convert at the
  Drizzle / Zod boundary.
- **Worktree ports:** `PORT = 3000 + N`, `WRANGLER_PORT = 8787 + N`
  where N is your worktree index (main=0, wt1=1, wt2=2, wt3=3). Read
  from `.env.local`.

## Design reference

HTML/CSS/JS wireframes from Claude Design live in
`design/startup-state-atlas-wireframes/`. The primary file is
`project/Auth.html`; v1 and v2 wireframe sets sit alongside it under
`project/wireframes/` and `project/wireframes/v2/`. Treat these as
visual references — recreate them in the real Next.js + Tailwind
stack rather than copying their internal structure. Read the HTML/CSS
directly; don't render or screenshot unless asked. See
`design/startup-state-atlas-wireframes/README.md` for the bundle's
own handoff notes.

## Working in a worktree

If you're a parallel Claude Code session spawned in a worktree, **read
these in order**:

1. `docs/agent-tasks/00-shared-context.md` — port table, schema policy,
   branch protocol, sequencing.
2. Your assigned agent brief: `docs/agent-tasks/agent-<N>-<slice>.md`.
3. `AGENTS.md` (root) — repo policy.
4. `docs/architecture.md` — stack and bindings.

Then `git checkout -b feat/<slice>` (the `protect-main` hook blocks
edits on `main`). Work to your brief's DONE-when criteria. Keep a
clean PR scope.

## Claude Code Hooks

Claude Code uses `.claude/settings.json` for local safety and convenience
hooks. All hook scripts live in `.claude/hooks/` as real files (no
external dependency):

- **`protect-main`** (inline in settings.json) — Edit/Write is blocked
  while the current branch is `main`. Create a feature branch first.
- **`guard-shared-edits.sh`** — kept for parity with the original
  agent-kit setup, but no longer load-bearing now that nothing in
  this repo is a symlink into a shared package. Safe to leave or
  remove.
- **`allow-agent-browser.sh`** — auto-approves `agent-browser` Bash
  invocations.
- **`allow-linear.sh`** — auto-approves Linear API calls (except
  destructive org/team/project/user/workspace mutations).
- **`allow-doppler.sh`** — installed but unused on this project (we
  don't run Doppler). Harmless no-op.
- **`cc-notify.sh`** — Notification + Stop hook (desktop ping).

These hooks are Claude-specific. Codex follows `AGENTS.md`,
`.agents/skills/`, and its own approval policy.

## Claude Skills

Skills live in `.agents/skills/<name>/` as real files. The
corresponding `.claude/skills/<name>` is a relative symlink to
`.agents/skills/<name>` so both Claude and Codex pick them up from a
single source of truth.

To **add a skill**, drop a `SKILL.md` (with frontmatter) into a new
`.agents/skills/<name>/` directory and create the matching
`.claude/skills/<name>` symlink:

```bash
mkdir -p .agents/skills/<name>
$EDITOR .agents/skills/<name>/SKILL.md
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```

To **edit a skill**, just edit `.agents/skills/<name>/SKILL.md`
directly. There is no longer any "shared package" to publish back to
— the contents originally came from
[`clay-coffman/agent-kit`](https://github.com/clay-coffman/agent-kit)
but were vendored into this repo for the hackathon to avoid sync
churn. Diverge freely.

Claude-only behavior should stay in `.claude/` and must not duplicate
project policy from `AGENTS.md`.
