# Implementation Plan — Startup State Atlas

**This is the canonical execution map.** If you're a Claude Code agent
forking into a worktree, read this file first to find your phase and
your dependencies, then your assigned brief.

The product spec lives in `hackathon-plan.md`. The frozen contracts
live in `architecture.md` and `agent-tasks/00-shared-context.md`. This
file does *not* restate either — it sequences the work.

## Source data (provided by Utah GOED — use as-is)

Everything you need to seed the app lives in `docs/source_data/`:

- **`page-2026-05-08-19-38-24.md`** — the AI Builder Day brief from
  Utah's Governor's Office of Economic Development. Authoritative
  product framing, required company-profile fields, judging breakdown
  (30% usability, 25% tech, 25% design, 20% innovation), exact persona
  descriptions, and the link to the live site this build may replace
  or feed: <https://startup.utah.gov/>. **Read this before reading
  `hackathon-plan.md`** if you need to know what the judges actually
  asked for.
- **`Map Data for Builder Day  - Sheet1.csv`** — 254 companies. Note
  the **double space** in the filename. Columns: `Display Type`,
  `LinkedIn Link (...)`, `Startup Name `, `Full Address`,
  `Description of startup`, `Website`, `Stage`, `# of Employees `,
  `Section` (sector). Address-only — no lat/lng. Several columns have
  trailing whitespace.
- **`Resources List - Builder Day - Sheet1.csv`** — 226 resources.
  Columns: `id`, `Title`, `description`, `Communities`, `Industries`,
  `Locations`, `Topics`, `link`, `email`. Multi-values are
  pipe-separated. Resource IDs come from upstream (start at 2543);
  preserve them as `r_<id>` so re-imports don't duplicate.

> The hackathon brief explicitly says: *"The state has prepared
> complete datasets for both products. You don't need to research or
> compile anything — focus every hour on the build."* Don't scrape
> startup.utah.gov, don't enrich from LinkedIn, don't touch
> pampam.city/utah-startup-map. Use what's in `docs/source_data/`.

**Agent 1 owns the loaders** — see Phase 2 below. Other agents
consume seeded data; they don't need to re-read the CSVs.

## Reading order for a forking agent

1. **This file** — find your phase + agent number + dependencies.
2. **`agent-tasks/00-shared-context.md`** — frozen conventions, port
   table, branch protocol, blocker resolution.
3. **`agent-tasks/agent-<N>-<slice>.md`** — your detailed brief.
4. **`architecture.md`** — stack table, system diagram, bindings (skim
   first; reference as needed).
5. **`screens.md`** — sitemap, role gates, wireframe variant pointers
   (only if you own a UI surface).

`AGENTS.md` (root) is the policy doc — read it once at session start;
it doesn't change per agent.

## Phases at a glance

```
Phase 1  Foundation                           Agent 0           [DONE]
            │
Phase 2  Data + Brand & Shell  (parallel ✕2)  Agents 1, 7       [READY]
            │
Phase 3  Recommend + Nav + Agents-native  (parallel ✕3)  Agents 2, 3, 6
            │
Phase 4  Map + Auth & Admin  (parallel ✕2)    Agents 4, 5
            │
Phase 5  Polish + e2e + demo dry-run          (whoever has cycles)
```

Concurrency cap is **3 active worktrees** (each is ~500MB node_modules
+ a dev server + a Claude session). Phases 2 and 4 use 2 worktrees;
Phase 3 saturates at 3.

| Phase | Agents | Branches | Worktrees | Critical path |
|-------|--------|----------|-----------|---------------|
| 1 | 0 | `feat/bootstrap` | wt0 (main checkout) | done |
| 2 | 1, 7 | `feat/data`, `feat/brand-shell` | wt1, wt2 | Agent 1 |
| 3 | 2, 3, 6 | `feat/recommend`, `feat/navigator`, `feat/agent-layer` | wt1, wt2, wt3 | Agent 3 |
| 4 | 4, 5 | `feat/map`, `feat/auth-claim-admin` | any 2 of wt1-3 | Agent 5 |
| 5 | — | `chore/...` or `fix/...` per task | any | demo readiness |

Agents may reuse worktrees as earlier phases' PRs merge. Reset a
worktree between phases with `git checkout main && git pull && git
checkout -b feat/<next-slice>` and re-run `npm run db:migrate:local`
+ `npm run seed`.

## Phase 1 — Foundation [DONE: PR #6, commit `37f49d1`]

**Agent 0** delivered the scaffold. Subsequent phases inherit:

- Next.js 15 (App Router) + `@opennextjs/cloudflare` build.
- `wrangler.jsonc` with D1 binding `DB` and R2 binding
  `OWNERSHIP_DOCS`.
- `lib/cf.ts`, `lib/db.ts`, `lib/anthropic.ts`, `lib/api-error.ts`,
  `lib/ids.ts` (typed stubs).
- `drizzle.config.ts`, empty `db/migrations/`.
- `tailwind.config.ts` (minimal — Agent 7 extends with brand tokens).
- shadcn primitives in `components/ui/*`.
- `.env.example`, `.env.local` gitignored.
- Production D1 + Worker URL deployed.
- Skill symlinks in `.claude/skills/` → `.agents/skills/`.
- Per-worktree local D1 wiring (commit `6de3c4d`).

## Phase 2 — Data + Brand & Shell

**Two agents in parallel.** Both unblock everything in Phase 3 and 4.

### Agent 1 — Data layer

- **Branch:** `feat/data`
- **Worktree:** wt1
- **Brief:** `agent-tasks/agent-1-data.md`
- **Depends on:** Agent 0 (done)
- **Touches:**
  - `db/schema.ts` (initial — 12 app tables + 4 Better Auth tables)
  - `db/migrations/0000_*.sql` (generated)
  - `db/seed/personas.ts` (6 personas — descriptions verbatim from
    `docs/source_data/page-2026-05-08-19-38-24.md`)
  - `db/seed/resources.ts` — loads
    `docs/source_data/Resources List - Builder Day - Sheet1.csv`
    (226 rows). Preserves upstream IDs as `r_<csv_id>`. Pipe-splits
    Communities / Industries / Locations / Topics. Detects
    "all 29 counties" → `statewide=true`.
  - `db/seed/companies.ts` — loads
    `docs/source_data/Map Data for Builder Day  - Sheet1.csv`
    (note the **double space** in the filename, 254 rows). Trims
    trailing whitespace on `Stage`, `Startup Name`, `# of Employees`.
    Geocodes via `centroids.ts` (city/county → lat/lng); the source
    has only `Full Address`, no coordinates.
  - `db/seed/centroids.ts` (city/county geocoding fallback)
  - `auth.ts` (minimal stub for Better Auth CLI codegen — Agent 5 expands)
- **Frozen-after this PR:** Better Auth tables + the
  `business_ownership_submissions` table + `companies.claimed_by_user_id`.
  Other columns may be extended by later agents in their own
  worktrees, with rebase-before-generate discipline.
- **Coordination:** none in Phase 2. Doesn't touch Agent 7's files.

### Agent 7 — Brand & Shell

- **Branch:** `feat/brand-shell`
- **Worktree:** wt2
- **Brief:** `agent-tasks/agent-7-brand-shell.md`
- **Depends on:** Agent 0 (done)
- **Touches:**
  - `tailwind.config.ts` (theme tokens — paper/ink/ember palette + sector colors)
  - `app/globals.css` (CSS vars, font imports via `next/font`)
  - `app/layout.tsx` (root nav + footer shell)
  - `app/page.tsx` (hero — headline, persona tiles, activity ticker stub, secondary CTAs)
  - `components/brand/*` (Tile, Chip, SectionHeader, ScribbleDivider, PersonaTile, ActivityTicker)
  - `lib/personas.ts` (the six personas — display names + IDs)
- **Frozen-after this PR:** brand tokens + root layout. UI agents
  (3, 4, 5, 6) consume them.
- **Coordination:** persona-tile target URL — see Agent 7 ↔ Agent 3
  row in the coordination matrix below.

### Phase 2 → Phase 3 gate

Phase 3 may start when **both** Agent 1 and Agent 7 have merged.
Agent 3 may begin earlier with a stubbed nav and rebase Agent 7's
shell in. Agents 2 and 6 don't depend on Agent 7 and may start as
soon as Agent 1 merges.

## Phase 3 — Recommend + Navigator + Agent-native

**Three agents in parallel** — saturates the worktree cap.

### Agent 2 — Recommendation engine

- **Branch:** `feat/recommend`
- **Worktree:** wt1, wt2, or wt3 (whichever is free)
- **Brief:** `agent-tasks/agent-2-recommend.md`
- **Depends on:** Agent 1 (schema + personas seeded)
- **Touches:**
  - `schemas/founder-passport.ts` (zod)
  - `lib/recommend.ts` (deterministic scoring — pure, testable)
  - `app/api/v1/resources/recommend/route.ts` (POST)
  - `app/api/v1/founder-passports/route.ts` (POST)
  - `app/api/v1/founder-passports/[id]/plan/route.ts` (GET, cached)
  - `types/api.ts` (RecommendRequest/Response/RecommendedResource)
  - `tests/recommend.test.ts`
- **Coordination:** writes endpoint shapes to
  `docs/agent-tasks/openapi-additions.md` for Agent 6 to consume.
- **Demo enables:** Scenes 1 (Jordan), 2 (Priya).

### Agent 3 — Founder Navigator UI

- **Branch:** `feat/navigator`
- **Worktree:** wt1, wt2, or wt3
- **Brief:** `agent-tasks/agent-3-navigator-ui.md`
- **Depends on:** Agent 1 (personas), Agent 2 (real or mocked API),
  Agent 7 (brand tokens + root layout — degrade gracefully if not yet
  merged).
- **Touches:**
  - `app/founder/page.tsx` (intake)
  - `app/plan/[id]/page.tsx` (saved plan — shareable URL)
  - `app/founder/_components/IntakeForm.tsx`
  - `app/founder/_components/PersonaButtons.tsx` (consumes
    `lib/personas.ts` from Agent 7)
  - `app/plan/_components/ResultsView.tsx`
  - `app/plan/_components/ShareLink.tsx`
- **URL note:** the saved plan lives at `/plan/:id`, not
  `/founder/results/:id`. The intake stays at `/founder`. See
  `screens.md` for the full URL map.
- **Demo enables:** Scenes 1, 2, 4 (the headline of the demo).

### Agent 6 — Agent-native layer

- **Branch:** `feat/agent-layer`
- **Worktree:** wt1, wt2, or wt3
- **Brief:** `agent-tasks/agent-6-agent-native.md`
- **Depends on:** Agent 1 (schemas to document), Agent 2 (recommend
  endpoint shape via `openapi-additions.md`), Agent 4 (company
  endpoint shapes — Phase 4; may stub initially and refresh after).
- **Touches:**
  - `app/api/v1/openapi.yaml`
  - `app/api/v1/openapi.json/route.ts`
  - `app/api/v1/search/route.ts`
  - `cli/index.ts` + `cli/commands/*.ts` (the `startup-state` bin)
  - `mcp/server.ts` + `mcp/tools/*.ts` + `mcp/resources/*.ts` +
    `mcp/prompts/*.ts` (the `startup-state-mcp` bin)
  - `public/llms.txt`
  - `public/AGENTS.md` (end-user agent rules — distinct from this repo's
    `/AGENTS.md` which is for coding agents)
  - `app/agents/page.tsx` (`/agents` docs page)
- **Coordination:** Agent 6 watches `openapi-additions.md` for shape
  changes from Agents 2 and 4. Agent 6 may ship the spec in two
  passes — first with Phase 3 endpoints, then a refresh after Phase 4
  lands company PATCH and ownership-submissions endpoints.
- **Demo enables:** Scene 5.

### Phase 3 → Phase 4 gate

Phase 4 may start when Agent 1 has merged. Phase 3 doesn't have to
finish first — Agents 4 and 5 only depend on Agent 1. In practice the
worktree cap (3 concurrent) means Phase 4 starts as Phase 3 PRs
merge and free up worktrees.

## Phase 4 — Map + Auth & Admin

**Two agents in parallel.**

### Agent 4 — Ecosystem Map + Company Profiles

- **Branch:** `feat/map`
- **Worktree:** any free of wt1-3
- **Brief:** `agent-tasks/agent-4-map.md`
- **Depends on:** Agent 1 (companies + locations + jobs seeded),
  Agent 7 (root layout + tokens).
- **Touches:**
  - `app/map/page.tsx` + `app/map/_components/EcosystemMap.tsx`,
    `FilterSidebar.tsx`, `InvestorBrief.tsx`, `ProfileDrawer.tsx`
  - `app/startups/[slug]/page.tsx`
  - `app/startups/[slug]/route.md/route.ts` (markdown agent card)
  - `app/startups/[slug]/route.json/route.ts` (JSON agent card)
  - `app/api/v1/companies/route.ts` (GET list + filters)
  - `app/api/v1/companies/[slug]/route.ts` — **GET only.** Agent 5 adds PATCH.
  - `lib/company-card.ts` (shared formatter for HTML / .md / .json)
- **Coordination:** GET method on `[slug]/route.ts` is Agent 4's;
  PATCH is Agent 5's. Land Agent 4's PR first; Agent 5 adds PATCH on
  top. If Agent 5 is ready first, they may stub a placeholder GET in
  their PR — Agent 4 replaces it on merge.
- **Demo enables:** Scenes 3, 4.

### Agent 5 — Auth + Claim + Admin

- **Branch:** `feat/auth-claim-admin`
- **Worktree:** any free of wt1-3
- **Brief:** `agent-tasks/agent-5-claim.md`
- **Depends on:** Agent 0 (better-auth installed, OWNERSHIP_DOCS
  binding, secrets), Agent 1 (auth tables + `business_ownership_submissions`),
  Agent 4 (Claim button on profile page; coordinates on `[slug]/route.ts`),
  Agent 7 (root layout + tokens).
- **Touches:**
  - `auth.ts` (full Better Auth config — expanded from Agent 1's stub)
  - `lib/auth-client.ts`, `lib/email.ts`, `middleware.ts`
  - `app/api/auth/[...all]/route.ts`
  - `app/sign-in/page.tsx`, `app/sign-up/page.tsx`,
    `app/verify-email/page.tsx`, `app/forgot-password/page.tsx`,
    `app/reset-password/page.tsx`
  - `app/companies/[slug]/claim/page.tsx`,
    `app/companies/[slug]/edit/page.tsx`,
    `app/companies/[slug]/_components/EditorForm.tsx`
  - `app/me/submissions/page.tsx`
  - `app/api/v1/ownership-submissions/route.ts`,
    `app/api/v1/ownership-submissions/[id]/route.ts`
  - `app/api/v1/companies/[slug]/route.ts` (PATCH — three auth paths)
  - `app/admin/layout.tsx` + `app/admin/{page,submissions,users,resources,companies,map}/page.tsx`
  - `scripts/bootstrap-superadmin.ts`
- **Three auth paths on PATCH `/api/v1/companies/:slug`:**
  1. Better Auth session, `user.id === companies.claimed_by_user_id` →
     owner edit (whitelist applied).
  2. Better Auth session, role `goeo_admin | superadmin` → admin edit
     (no whitelist).
  3. `X-Atlas-Admin-Token` header matches `env.ATLAS_ADMIN_TOKEN` →
     machine edit (no whitelist).
- **Demo enables:** Scene 4 (claim → review → edit → all surfaces update).

## Phase 5 — Polish, e2e, demo dry-run

Whoever has cycles after Phase 4 merges. Targeted work, not a single
agent's brief. Candidate items in priority order:

1. **Mobile sweep.** Open every shipped page at 375px and fix
   horizontal-scroll / tap-target violations. Use
   `mcp__playwright__browser_resize` or agent-browser device toolbar.
2. **Demo dry-run** — run all five demo scenes end-to-end against the
   deployed Worker. Catch broken share URLs, persona-tile flows, R2
   doc previews, MCP tool listing.
3. **Activity ticker wire-up** — Agent 7 stubbed it with three fake
   strings. Real wiring pulls last-N events (claim approvals, new
   passports) from D1.
4. **InvestorBrief polish** — Agent 4 ships a basic version; tune the
   prompt and cap citation count.
5. **Fixture coverage** — ensure every persona produces a
   meaningfully-different top-3.
6. **`/agents` page polish** — code samples, copy-button on curl
   blocks, MCP install snippet for Claude Desktop.
7. **e2e tests** — Playwright golden paths if scope allows.
8. **Wireframe-variant complement passes** — for screens where a v2
   complement variant adds value (e.g., the printable memo for the
   plan page), implement as an opt-in toggle.

## Coordination matrix

Where two agents touch the same file, contract, or downstream
deliverable. **Read this before starting your phase if you're in
Phase 3 or Phase 4.**

| Agent A | Agent B | Shared surface | Resolution |
|---------|---------|----------------|------------|
| Agent 1 | Agent 5 | `auth.ts` | Agent 1 ships a minimal stub (Drizzle adapter + `additionalFields.role`). Agent 5 expands with email hooks + role plugin. **Better Auth tables stay frozen after Agent 1.** |
| Agent 2 | Agent 6 | `docs/agent-tasks/openapi-additions.md` | Agent 2 writes endpoint shapes there; Agent 6 builds OpenAPI from it. Create the file when first needed. |
| Agent 3 | Agent 7 | persona tile click target | Persona tiles on `/` (Agent 7) link to `/founder?persona=<id>`. Agent 3's `/founder` page reads the query param, prefills the form (or routes directly to `/plan/fp_<persona>` if Agent 2's seeded recommendations are loaded). `lib/personas.ts` (Agent 7) is the typed source for persona names + IDs. |
| Agent 3 | Agent 7 | nav + footer in root layout | Agent 7 owns `app/layout.tsx`. Agent 3 places its routes under it. If Agent 3 starts before Agent 7 merges, stub a minimal nav and rebase. |
| Agent 4 | Agent 5 | `app/api/v1/companies/[slug]/route.ts` | Agent 4 owns GET; Agent 5 adds PATCH. Land Agent 4 first, then Agent 5 PR adds PATCH method to the same file. |
| Agent 4 | Agent 5 | "Claim this company" button on profile | Agent 4 places the button (links to `/companies/:slug/claim`). Agent 5 owns the handler. |
| Agent 4 | Agent 6 | `lib/company-card.ts` | Agent 4 owns the formatter. Agent 6's MCP `get_company` tool calls the `/api/v1/companies/:slug` endpoint, not the formatter directly. |
| Agent 4, 5 | Agent 7 | layout + tokens | Both consume Agent 7's nav + footer + theme. Coordinate only if their pages need new brand primitives Agent 7 hasn't shipped. |
| Any | Agent 1 | `db/schema.ts` extensions | Any agent may extend schema in their own worktree. **Rebase against `main` before `db:generate`.** Number collision rule: rename the loser's migration file to next free index. |
| Any | Agent 1 | new schema column they can't add themselves | Append a request to `docs/agent-tasks/schema-requests.md`. |

## Frozen contracts

This file does **not** restate them. Sources of truth:

- **Stack table** — `architecture.md` § Stack
- **System diagram** — `architecture.md` § System diagram
- **Repo layout** — `architecture.md` § Repo layout
- **API contract** — `app/api/v1/openapi.yaml` (Agent 6 owns) +
  `architecture.md` § Contracts
- **Error shape** `{ error: { code, message, details? } }` — use
  `lib/api-error.ts`
- **ID prefixes** `fp_*`, `co_*`, `r_*`, `rec_*`, `bos_*` — use
  `lib/ids.ts`
- **Casing** snake_case wire ↔ camelCase TS — convert at
  Drizzle/zod boundary
- **Dual auth model** — `architecture.md` § Contracts and
  `agent-tasks/agent-5-claim.md`
- **Worktree port table** — `agent-tasks/00-shared-context.md` §
  Worktree port table
- **Branch protocol** — `agent-tasks/00-shared-context.md` § Branch
  protocol
- **Responsive design (375 / 768 / 1280px)** — `AGENTS.md` § Coding
  Style

## Demo gating

| Scene | Story | Required agents |
|-------|-------|-----------------|
| 1 | Jordan (pre-seed) — start-business plan | 1, 2, 3, 7 |
| 2 | Priya (raising) — capital plan | 1, 2, 3, 7 |
| 3 | Investor map — filter, click, brief | 1, 4, 7 |
| 4 | Business owner as website — claim → approve → edit → all surfaces update | 1, 4, 5, 7 |
| 5 | Terminal / MCP proof | 1, 2, 4, 6 |

If a phase slips, scenes drop in this order: 5 → 4 → 3 → 2 → 1
(keep the founder Navigator scenes if at all possible — they're the
headline). Scene 5 is a 20-second flourish; cut first.

## Cuts cascade — when behind, take these in order

Drawn from each brief's "Cuts allowed if time-pressed" sections,
prioritized.

1. **Phase 5 entirely** — only do Phase 5 if every Phase 4 PR has
   merged with time to spare.
2. **Agent 6** — skip remote MCP, skip MCP prompts/resources (8 tools
   only), skip CLI's `profile build`, skip search endpoint, stub
   OpenAPI to Phase 3 endpoints only.
3. **Agent 7** — skip activity ticker, skip Caveat font, skip brand
   primitives folder (inline as needed), skip footer.
4. **Agent 5** — collapse admin to submissions queue + resources CRUD
   (drop `/admin/companies`, `/admin/map`, `/admin/users`); skip AI
   draft button; skip email-verification hard gate; skip
   `profile_updates` review tab; **last resort:** cosmetic-only
   ownership upload (no R2 persistence).
5. **Agent 4** — skip vector tiles (raster basemap), skip
   InvestorBrief panel, skip clustering (individual pins), skip
   "Update with Claude/ChatGPT" button.
6. **Agent 3** — skip "Ignore for now" bucket, skip field-level
   modal, skip share URL (deep-link still works), skip skeleton
   loaders. **Mobile is not optional** — never cut responsive.
7. **Agent 2** — skip persistence (recompute on every GET), skip LLM
   explanation (reasons[] only), skip prompt caching, skip "Ignore
   for now" bucket.
8. **Agent 1** — skip embedding column, skip FTS5 (LIKE %term%
   instead), skip `company_photos`, drop malformed CSV rows silently.

Cut earliest from agents whose work is *least* visible in the demo.

## Time budget (advisory, not contractual)

| Phase | Wall clock | Worktree-hours |
|-------|-----------|----------------|
| 1 | done | — |
| 2 | ~90 min (Agent 1 critical; Agent 7 ~60 min in parallel) | ~150 min |
| 3 | ~120 min (longest of Agents 2, 3, 6) | ~330 min |
| 4 | ~150 min (Agent 5 critical; Agent 4 ~120 min in parallel) | ~270 min |
| 5 | remainder, capped at 3 hr | varies |

Buffer for demo prep, deploy validation, and slippage: at least 2 hr
before the 24-hour mark.

## Status snapshot (update as phases complete)

```
Phase 1: ✅ DONE  (PR #6, 2025-XX-XX)
Phase 2: ⬜ PENDING — Agent 1 (data), Agent 7 (brand-shell)
Phase 3: ⬜ PENDING — blocked on Phase 2
Phase 4: ⬜ PENDING — blocked on Phase 2
Phase 5: ⬜ PENDING — blocked on Phase 4
```

When you merge a PR, flip its status to ✅ here in the same commit
(or in the immediate follow-up). Future agents read this to know
what's free to start.
