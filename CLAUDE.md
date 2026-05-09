# CLAUDE.md

The single coding-agent policy doc for this repo. The product spec is
`docs/requirements.md`; the build status snapshot (what's shipped vs.
left) lives in `docs/implementation-plan.md`.

> Agent infrastructure (skills, hooks, workflows, agents) lives as
> real files under `.agents/skills/`, `.claude/hooks/`,
> `.claude/agents/`, and `.github/workflows/`. They were vendored
> from [`clay-coffman/agent-kit`](https://github.com/clay-coffman/agent-kit)
> at the start of the engagement but are now repo-local — edit them
> in place. The corresponding `.claude/skills/<name>` entries are
> relative symlinks into `.agents/skills/<name>`.

## Where to start

The whole app is shipped and live at <https://startupstateatlas.dev>
(see `docs/deploy-log.md`). The repo is in **maintenance mode** —
new work is small follow-ups + ad-hoc bugfixes; no further phase
planned. Open follow-ups are listed at the bottom of
`docs/implementation-plan.md`. Agent briefs (Agents 0–8) are
archived under `docs/archive/agent-tasks/` for historical context;
they are not operational.

Reading order for an agent picking up work:

1. **`CLAUDE.md`** (this file) — policy and conventions.
2. **`docs/implementation-plan.md`** — what's shipped + open
   follow-ups. Start here for any "what should I work on" question.
3. **`docs/architecture.md`** — stack and frozen contracts.
4. **`docs/conventions.md`** — port table, ID prefixes, branch
   protocol, schema ownership, dual-auth model.
5. **`docs/screens.md`** — only if you own a UI surface.
6. **`docs/design-guidelines.md`** — only if you own a UI surface.

## Project at a glance

**Startup State Atlas** — a production application for Utah's
Governor's Office of Economic Development (GOED). Two products in
one platform: the **Founder's Navigator** (intake → personalized
plan) and the **Utah Startup Map**. Polished founder/investor product
on top, agent-native API/CLI/MCP underneath. Target deploy:
<https://startup.utah.gov/>. The engagement originated at Utah GOED's
AI Builder Day; everything past the initial scaffold is shipping for
real users.

Stack (full table in `docs/architecture.md` § Stack): Next.js 15
App Router on Cloudflare Workers via `@opennextjs/cloudflare`,
D1 + Drizzle, R2 for ownership docs, MapLibre GL, Anthropic Claude
`claude-opus-4-7` for source-bound explanations, Better Auth for
human users, `X-Atlas-Admin-Token` for machine clients.

## Source data (provided — don't research, build)

The GOED-provided datasets live in `docs/source_data/`. Use them
as-is:

- `page-2026-05-08-19-38-24.md` — the canonical brief from Utah GOED.
  Verbatim persona descriptions, required profile fields, customer
  priorities (30% usability / 25% tech / 25% design / 20% innovation).
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

## Runtime and tooling

- **Node.js 24** (pinned via `package.json` `engines.node` and
  the asdf install).
- **Package manager:** npm.
- **Search:** ripgrep (`rg`). Prefer project scripts over ad-hoc
  commands.
- **Cloudflare:** wrangler CLI for D1 / R2 / Workers ops.
- **Third-party SaaS provisioning:** `stripe projects` —
  see `.agents/skills/stripe-projects/SKILL.md`.
- **Don't run destructive git, database, secrets, or infra
  operations** unless the user explicitly asks for that operation.

## Commands

```bash
# Development
npm run dev                       # Next.js dev (port 3000+N)
npm run preview                   # local Cloudflare Worker preview (port 8787+N)

# Database (D1 via wrangler + Drizzle)
npm run db:generate               # drizzle-kit generate
npm run db:migrate:local          # wrangler d1 migrations apply --local
npm run db:migrate:remote         # wrangler d1 migrations apply --remote
npm run seed                      # load personas + read CSVs from docs/source_data/

# Agent-native surfaces (Phase 3 / Agent 6)
npm run cli                       # exec local CLI (startup-state ...)
npm run mcp                       # local stdio MCP server

# Quality gates
npm run lint
npm run typecheck
npm test                          # vitest (lands with PR #16)
npm run test:e2e                  # playwright (Phase 5)

# Deploy
npm run deploy                    # wrangler deploy
```

## Hard rules

Frozen contracts are documented once in `docs/architecture.md` §
Contracts and `docs/conventions.md` § Pre-decided
conventions. Don't restate them; just know what's locked:

- API path prefix `/api/v1/...`
- Error shape `{ error: { code, message, details? } }` via
  `lib/api-error.ts`
- ID prefixes `fp_*`, `co_*`, `r_*`, `rec_*`, `bos_*`, `inv_*` via
  `lib/ids.ts` (Better Auth's own IDs are generated by Better Auth
  — leave them alone)
- snake_case on the wire, camelCase in TS — convert at the
  Drizzle/zod boundary
- Dual auth model (Better Auth for humans, `X-Atlas-Admin-Token`
  for machines) — full detail in `conventions.md` § Auth-for-write
- Worktree port formula `PORT = 3000 + N`,
  `WRANGLER_PORT = 8787 + N` — see
  `docs/conventions.md` § Worktree port table

## Two env files, two purposes

- **`.env.local`** (per-worktree, gitignored) carries `PORT`,
  `WRANGLER_PORT`, and `CLOUDFLARE_API_TOKEN` — read by
  `process.env` (Next.js, drizzle-kit, wrangler CLI).
- **`.dev.vars`** (also gitignored, template at `.dev.vars.example`)
  carries provider secrets (`ANTHROPIC_API_KEY`, `PARALLEL_API_KEY`,
  `BETTER_AUTH_SECRET`, etc.) — read by `env()` (the Cloudflare
  binding helper in `lib/cf.ts`) via `initOpenNextCloudflareForDev()`
  in `next.config.ts`. Code in `lib/*` reads secrets through
  `env()` so the same call works in dev (from `.dev.vars`) and prod
  (from `wrangler secret put`). **If you put a secret in
  `.env.local`, lib code won't see it.**

In production, secrets live on the Worker via
`wrangler secret put <NAME>`. `.env.example` lists every required
variable.

## Local authentication testing

Auth uses Better Auth's `emailOTP` plugin (6-digit code, 10-min
expiry) for sign-up verification, sign-in, and password reset.
Two dev-only env vars in `.dev.vars` make iterating against
authenticated routes painless. **NEVER set either in production.**

### Inner loop: skip OTP entirely

```
AUTH_SKIP_OTP=true
```

When set, `auth.ts` drops the `emailOTP` plugin and flips
`emailAndPassword.requireEmailVerification` to `false`. Sign-up
auto-verifies and drops you on the authenticated page — no
verify screen, no code to grab. Use this 90% of the time.

Seed users (full list in `db/seed/README.md`) share the password
`passport12345`. The 12-char floor is enforced by Better Auth
(`auth.ts` `minPasswordLength: 12`) and mirrored in the sign-up
zod schema, so any real account form (including admin-invite
acceptance) needs ≥ 12 chars too. If you bump the seed value,
update both files in lockstep.

### Testing the real OTP flow: route mail to mailpit

```
MAILPIT_URL=http://localhost:802(5+N)
```

When set, `lib/email.ts` POSTs outgoing email to mailpit's HTTP
send API instead of Resend or the console fallback. Browse the
captured inbox at the same URL in your browser. Mailpit serves the
send API and the inbox UI on the same port.

**One mailpit per worktree, ports follow the worktree formula.**
Same shape as `PORT` and `WRANGLER_PORT`: `MAILPIT_HTTP = 8025 + N`,
`MAILPIT_SMTP = 1025 + N`. So `wt1` → `MAILPIT_URL=http://localhost:8026`,
`wt2` → `8027`, `wt3` → `8028`. Each worktree's `.dev.vars` already
has the right value (`create-worktree` and `refresh-worktrees`
seed it).

Start mailpit once per worktree, then leave it running:

```bash
# Native binary (preferred — one process per worktree, easy to kill)
mailpit --listen 0.0.0.0:$((8025+N)) --smtp 0.0.0.0:$((1025+N))

# Or Docker
docker run -d --name mailpit-wt$N \
  -p $((1025+N)):1025 -p $((8025+N)):8025 axllent/mailpit
```

Each worktree's OTPs land in *its own* inbox. wt1's signup
verification doesn't pollute wt2's testing — important when several
agents are exercising auth flows in parallel.

### When to use which

- **Building or fixing any non-auth feature** → `AUTH_SKIP_OTP=true`.
  Faster.
- **Working on `app/sign-up/*`, `app/sign-in/*`, `app/forgot-password`,
  `app/reset-password`, OTP edge cases** → unset `AUTH_SKIP_OTP`,
  set `MAILPIT_URL`. Test the real shape.
- **Production parity sanity check** → unset both. Falls back to
  Resend (if `RESEND_API_KEY` set) or `console.log` (if not).

The two flags are independent. Setting both = OTP skipped (the
plugin isn't loaded, so no email gets sent at all).

## D1 is per-worktree local

Each worktree has its own SQLite at
`<worktree>/.wrangler/state/v3/d1/`. The binding name is the same
in every worktree (`startup-state-atlas-db`) but the data is
isolated. After pulling new migrations from `main`, run
`npm run db:migrate:local` and `npm run seed` in your worktree.
Production D1 is created at deploy time, not now.

## Schema is collaborative

Any agent may edit `db/schema.ts` and generate a migration in
their own worktree. **Rebase against `main` before running
`npm run db:generate`** so two parallel agents don't ship colliding
migration numbers (`0001_*.sql`). If a collision lands on `main`,
rename the loser's file to the next free index. Agent 1 owns the
*initial* schema + persona seed; the Better Auth tables (`user`,
`session`, `account`, `verification`) are frozen after Agent 1 runs
`@better-auth/cli generate`. If you need a column you can't add
yourself, open a GitHub issue describing the change and the
downstream surfaces it touches.

The full schema-coordination protocol lives in
`docs/conventions.md` § Schema ownership.

## Coding Style

- TypeScript strict mode. Formatting via Prettier (printWidth 80).
- **`target="_blank"` links must include `rel="noopener noreferrer"`.**
- **Responsive design (REQUIRED).** Every shipped page — Founder
  Navigator, map, company profiles, claim flow, GOEO admin UI,
  `/agents` — must work on **both desktop and mobile**. Mobile is
  not a "nice-to-have" or a v2; real founders, investors, and
  business owners will open this on phones. Concretely:
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

## Testing

- Unit / component: **Vitest**.
- E2E: **Playwright** (Phase 5; manual smoke tests until then).
- External services: **no mocking lib** — call real Anthropic API
  in tests with cheap models, or stub with hand-written fakes.
- Use `agent-browser` for browser automation and visual checks
  (`.claude/hooks/allow-agent-browser.sh` auto-allows it).

## Operations

- **Deploy target:** Cloudflare Workers via `wrangler deploy`.
- **Observability:** Cloudflare Workers built-in (free) — set
  `observability.enabled = true` in `wrangler.jsonc`. Live tail
  with `wrangler tail`. Search/retention via the Workers dashboard.
  No Sentry/PostHog at launch.
- **Production read-only DB access:**
  `wrangler d1 execute startup-state-atlas-db --command "SELECT ..."`
  from the CLI. Read queries only.

## Working in a worktree

Worktrees are used for parallel Claude Code sessions. See
"Where to start" above for reading order.

`git checkout -b feat/<slice>` first (the `protect-main` hook blocks
edits on `main`). Branch names follow `feat/*`, `fix/*`, `chore/*`,
`docs/*`, or `refactor/*`. Commit messages use the matching
conventional prefixes. PRs target `main` — squash-merge only.

## Keep the planning docs in sync

When your PR closes or advances anything tracked in
`docs/implementation-plan.md` § Status snapshot — your agent slice
moves from `NOT STARTED` → `PR #X OPEN` → `✅ DONE`, or your PR
completes the last open slice in a phase — **flip the line in the
same PR** that ships the work. The status snapshot is the contract
for what's free to start; if it lags reality, the next agent reads
stale state and either duplicates work or waits on something
already done.

Same rule for the per-PR coordination notes (e.g. migration
collisions, in-flight branch references): if your PR resolves or
changes them, update them.

The `ship` skill checks this in Phase 1 before staging files —
don't skip the prompt.

## Hooks

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

## Skills

Skills live in `.agents/skills/<name>/SKILL.md`. The corresponding
`.claude/skills/<name>` is a relative symlink so all loaders share
one source of truth.

Add a skill: drop `SKILL.md` (with frontmatter) into a new
`.agents/skills/<name>/`, then symlink `.claude/skills/<name>` →
`../../.agents/skills/<name>`. Edit by editing the source file
directly — there's no longer any "shared package" to publish back to.

## MCP

`.mcp.json` is gitignored — keep it local or symlinked from a
trusted source. No bearer tokens, API keys, or PATs in tracked
files. For local agent-side MCP usage, prefer env-var-based auth.

## Two `AGENTS.md` files? Just one now.

Historically this repo had two: a root `/AGENTS.md` for coding agents
(Codex + Claude Code) and a `public/AGENTS.md` for end-user agents
calling the API. The root one is gone — this `CLAUDE.md` is the
single coding-agent doc. Agent 6's `public/AGENTS.md` (served at
`https://<host>/AGENTS.md`) is unrelated and stays.
