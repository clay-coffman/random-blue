# Screens — Startup State Atlas

The bridge between the wireframes (`design/startup-state-atlas-wireframes/`)
and the agent briefs. Every URL the app ships with one row.

If you're building a UI, find your URL here, follow the wireframe
pointer, and check the role gate. Wireframe variants we'd ship in
Phase 5 (complement variants) are noted but not first-pass scope.

The content shown on these screens comes from the GOED-provided
datasets in `docs/source_data/` (loaded by Agent 1). When you mock
state during development, use those columns and values — not invented
ones.

## How to use this doc

- **Wireframe column** — relative path under
  `design/startup-state-atlas-wireframes/project/` plus the variant
  letter (per the v2 chosen direction).
- **Role** — what auth gate the route enforces. `anon` = no session
  required; `signed-in` = any role; `owner-of-co` = session user
  matches `companies.claimed_by_user_id`; `admin` = role
  `goeo_admin | superadmin`; `superadmin` = role `superadmin`;
  `machine` = `X-Atlas-Admin-Token` header.
- **Agent** — the agent brief that owns the file at
  `agent-tasks/agent-<N>-<slice>.md`.

## Public screens (anonymous)

| URL | Agent | Wireframe variant | Role | Notes |
|-----|-------|------------------|------|-------|
| `/` | 7 | `wireframes/v2/hero.js` (B + G hybrid) | anon | Hero, persona tiles, activity ticker stub, secondary CTAs |
| `/founder` | 3 | `wireframes/v2/intake.js` (Variant D) | anon | Two-pane form + live passport JSON, 6 quick-test persona buttons |
| `/plan/:id` | 3 | `wireframes/v2/plan.js` (Variant A + memo complement) | anon | Now / Next / Ignore columns, share URL, "draft email" actions |
| `/map` | 4 | `wireframes/v2/map.js` (Variant B + cluster gazetteer toggle) | anon | Map-first MapLibre, floating filter chips, Investor Brief panel |
| `/startups/:slug` | 4 | `wireframes/v2/profile.js` (A classic + B agent reveal) | anon | Profile page with `.md` / `.json` / `.html` toggle |
| `/startups/:slug.md` | 4 | — | anon | Markdown agent card. Same data, different content-type. |
| `/startups/:slug.json` | 4 | — | anon | JSON agent card. Same data, different content-type. |
| `/agents` | 6 | `wireframes/v2/agents.js` (C install hero + B tabs + A reference) | anon | API / CLI / MCP / llms.txt docs page |
| `/llms.txt` | 6 | — | anon | Static under `public/`. Site description + agent rules. |
| `/AGENTS.md` | 6 | — | anon | End-user agent rules (distinct from this repo's `AGENTS.md` for coding agents) |
| `/api/v1/openapi.json` | 6 | — | anon | OpenAPI 3.1 spec |

## Auth screens

| URL | Agent | Wireframe variant | Role | Notes |
|-----|-------|------------------|------|-------|
| `/sign-in` | 5 | `project/Auth.html` | anon | Better Auth email + password |
| `/sign-up` | 5 | `project/Auth.html` | anon | Default role: `owner` |
| `/verify-email` | 5 | `project/Auth.html` | anon-with-token | Verification link from Resend |
| `/forgot-password` | 5 | `project/Auth.html` | anon | Sends reset link via Resend |
| `/reset-password` | 5 | `project/Auth.html` | anon-with-token | Reset link target |
| `/api/auth/[...all]` | 5 | — | varies | Better Auth catch-all handler |

## Owner screens (signed-in)

| URL | Agent | Wireframe variant | Role | Notes |
|-----|-------|------------------|------|-------|
| `/companies/:slug/claim` | 5 | `wireframes/v2/claim.js` (Acts 1 + 2) | signed-in | Upload verification doc to R2; submission row inserted |
| `/companies/:slug/edit` | 5 | `wireframes/v2/claim.js` (Act 3) | owner-of-co OR admin | Profile editor with field whitelist for owners |
| `/me/submissions` | 5 | — | signed-in | Owner's submission queue (pending / approved / rejected) |

## GOEO admin screens

| URL | Agent | Wireframe variant | Role | Notes |
|-----|-------|------------------|------|-------|
| `/admin` | 5 | — | admin | Landing — pending edits review |
| `/admin/submissions` | 5 | — | admin | Ownership-submission queue |
| `/admin/submissions/:id` | 5 | — | admin | Single-submission review with 60-second signed R2 URL |
| `/admin/resources` | 5 | — | admin | Resource CRUD (list + create) |
| `/admin/resources/:id` | 5 | — | admin | Resource edit |
| `/admin/companies` | 5 | — | admin | Company CRUD without whitelist |
| `/admin/companies/:slug` | 5 | — | admin | Direct company edit |
| `/admin/map` | 5 | — | admin | Map curation — fix coordinates, hide stale entries |
| `/admin/users` | 5 | — | superadmin | Promote/demote between `owner` and `goeo_admin` |

## API routes

OpenAPI is the source of truth at `app/api/v1/openapi.yaml` (Agent 6).
This list is for orientation — when in doubt, check the spec.

| Method + path | Agent | Auth | Notes |
|---------------|-------|------|-------|
| POST `/api/v1/founder-passports` | 2 | anon | Anonymous intake — no session required |
| GET `/api/v1/founder-passports/:id/plan` | 2 | anon | Cached plan for shareable URL |
| POST `/api/v1/resources/recommend` | 2 | anon | Returns scored recommendations |
| GET `/api/v1/resources` | 2 / 5 | anon | Agent 2 ships GET; Agent 5 may add admin-side filters |
| POST `/api/v1/resources` | 5 | admin | Resource create |
| PATCH `/api/v1/resources/:id` | 5 | admin | Resource update |
| DELETE `/api/v1/resources/:id` | 5 | admin | Resource delete |
| GET `/api/v1/companies` | 4 | anon | List + filters (sector, stage, county, hiring, etc.) |
| POST `/api/v1/companies` | 5 | admin | Direct create |
| GET `/api/v1/companies/:slug` | 4 | anon | Single company |
| PATCH `/api/v1/companies/:slug` | 5 | owner-of-co OR admin OR machine | Three auth paths — see Agent 5 brief |
| DELETE `/api/v1/companies/:slug` | 5 | admin | Soft-delete or hide |
| POST `/api/v1/ownership-submissions` | 5 | signed-in | Multipart upload to R2 |
| GET `/api/v1/ownership-submissions` | 5 | signed-in | Owner's own submissions |
| GET `/api/v1/ownership-submissions/:id` | 5 | owner OR admin | Owner sees own; admin sees any |
| PATCH `/api/v1/ownership-submissions/:id` | 5 | admin | Approve / reject |
| GET `/api/v1/admin/users` | 5 | superadmin | Users management list |
| PATCH `/api/v1/admin/users/:id` | 5 | superadmin | Role flip |
| GET `/api/v1/search` | 6 | anon | Generic search across resources + companies |
| GET `/api/v1/openapi.json` | 6 | anon | Spec |

Read endpoints are unauthenticated. Writes branch inside the route
handler — see the Agent 5 brief for the dual-auth precedence on
`PATCH /api/v1/companies/:slug`.

## Wireframe variant disposition

We're not picking variants now. For each screen with multiple v2
variants, the **chosen** direction is the first implementation; the
**complement** variant is a Phase 5 polish target only if there's
budget.

| Screen | Phase 3/4 ships | Phase 5 polish (if time) |
|--------|----------------|--------------------------|
| Hero (`/`) | B + G hybrid | — |
| Intake (`/founder`) | D (two-pane + live passport) | — |
| Plan (`/plan/:id`) | A (Now / Next / Ignore) | D printable memo toggle |
| Map (`/map`) | B (map-first floating filters) | Cluster gazetteer toggle |
| Profile (`/startups/:slug`) | A classic + B agent reveal toggle | — |
| Claim (`/companies/:slug/claim` + `/edit`) | A magic + B editor | C "Update via Claude/ChatGPT" handoff |
| Agents (`/agents`) | C install hero + B tabs + A reference | — |

## Mobile compliance

Every screen above must work at **375 / 768 / 1280px**. The wireframes
are desktop-only; mobile layouts are designer's-discretion within
the rules from `AGENTS.md` § Coding Style:

- No horizontal scroll at 375px.
- Tap targets ≥ 44×44 px.
- Tables → cards on mobile.
- Map drawer → bottom sheet (not side panel).
- Two-pane forms → stacked single-column with the live preview
  collapsed under the form (not beside it).

Verify with `mcp__playwright__browser_resize` (or agent-browser
device toolbar) before marking your brief DONE.

## Things specced but with no wireframe

Worth flagging — these need invented UI without a designer reference:

- Email-verification screen (intermediate states: "check your email",
  "link expired", "verified, redirecting").
- Password-reset screens (request, success, expired-link).
- `/me/submissions` (owner's submission status list).
- Every admin screen except `Auth.html` (submissions queue, single
  submission review, users management).
- Loading / empty / error / 404 states across the app.
- "Update via Claude/ChatGPT" claim-flow third act.
- Ownership document file-upload UI (drag-and-drop, progress, error).

Default to "shadcn primitive + paper/ink theme tokens, mobile-first,
keep it boring" for these.
