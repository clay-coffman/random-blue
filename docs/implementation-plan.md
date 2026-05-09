# Build status — Startup State Atlas

This file tracks build status. Product spec lives in
`docs/requirements.md`; frozen contracts in `docs/architecture.md`
and `docs/conventions.md`; current production state in
`docs/deploy-log.md`.

Last refreshed **2026-05-09** — post launch + post Phase 6 polish.

---

## Live

**Production URL:** <https://startupstateatlas.dev>
(also `https://www.startupstateatlas.dev`).

Cloudflare Worker deployed via `wrangler deploy` (manual — no CI
auto-deploy). The site is currently behind a `SITE_PASSWORD` gate;
delete that secret to flip public, or rotate it via
`wrangler secret put SITE_PASSWORD`.

Latest applied D1 migration: **`0007_sloppy_paper_doll`**
(`founder_passports.narrative_text`).

---

## Shipped

### Phases 1–4 — foundation through profiles + auth

| PR | What |
|----|------|
| #6  | Phase 1 — Next.js scaffold + Cloudflare Workers + D1 binding + lib stubs + shadcn |
| #10 / #13 | Phase 2 — schema + migrations + seed (companies, resources, personas) |
| #11 | Phase 2 — brand & shell (Tailwind tokens, layout, homepage, persona tiles) |
| #16 | Phase 3a — recommendation engine, founder-passport API, Parallel.ai enrich endpoint |
| #17 | Phase 3b — Founder Navigator UI (`/founder` intake, `/plan/:id`, share link) |
| #20 | Phase 4b — Better Auth + OTP + onboarding + claim flow + GOEO admin |
| #24 / #28 | Phase 4a — ecosystem map (MapLibre), company profiles, view modes / cluster colors / scroll-spy / mobile drawer |
| #26 | Activity ticker — homepage feed off real D1 events |
| #27 | Phase 3c — agent-native layer (OpenAPI 3.1, CLI, local stdio MCP, remote MCP, `/llms.txt`, `/AGENTS.md`, `/agents` page) |
| #31 | GOEO operator runbook + admin nav gate fix |
| #32 | Auth UI polish — match Auth.html wireframe; drop magic-link & Google |

### Phase 5a — launch readiness (security + first deploy)

| PR | What | Closes |
|----|------|--------|
| #36 | Auth security pass — `__Host-` cookies, CSRF on `/api/v1/*` writes, Better Auth rate limits, R2 upload rate-limit binding | — |
| #38 | Saved-search email alerts — daily/weekly cadence, GitHub Actions cron, signed unsubscribe | — |
| #40 | E2E founder walkthrough — findings doc + Playwright fixtures | — |
| #41 | First production deploy — `wrangler deploy` + D1 remote migrate + Worker secrets + bootstrap superadmin | — |
| #42 | MCP write-tool exposure fix — drop `update_company_profile` from public `/api/mcp` | #35 |

### Phase 5b — launch polish

| PR | What | Closes |
|----|------|--------|
| #43 | Custom domain `startupstateatlas.dev` + env-driven preview gate | — |
| #44 | E2E quick-wins bundle — B1 (D1-derived stats), B5 (`trustedOrigins`), B9 (persona quick-test), B11 (Priya naming) | — |
| #45 | Plan page fixes — B7 skip-bucket explainer wording, B8 mailto CTAs prepopulated from passport | — |
| #46 | Header rewrite — B2 mobile sign-in CTA, B6 auth-state branching, B10 sign-out + UserMenu | — |
| #53 | Middleware cookie-prefix fix — pass `cookiePrefix` to `getSessionCookie` | #49 |
| #54 | Rate-limit unauthenticated LLM-backed endpoints (Anthropic / Parallel.ai cost protection) | #34 |
| #55 | Top-bar nav typography — Hanken Grotesk small-caps | — |
| #56 | Plan page — LLM-synthesized "Where to focus" narrative + humanized per-rec `because` | — |
| #57 | Async `getAuth()` to unblock prerender; first successful re-deploy since #46 | — |

### Phase 6 — investor public surface

| PR | What |
|----|------|
| #52 | Public investor directory, profiles (`.md` + `.json`), saved companies watchlist, intro-request brokerage flow, GOED admin queue (`/admin/intros`, `/admin/investors`), intro-brokerage emails. Migration `0006_military_scarlet_spider`. |

### Phase 6 polish

| PR | What |
|----|------|
| #59 | Admin-role e2e walkthrough findings doc (now archived) |
| #60 | Admin tables — card-collapse below lg breakpoint |
| #61 | Admin dashboard polish — sign-out, investor pill, dashboard cleanup |
| #62 | Companies edit form — align sector/stage options with seeded vocabulary |
| #63 | Skip-OTP signups route straight to onboarding |
| #65 | Investor-role e2e walkthrough findings doc (now archived) |
| #66 | Admin resource-affinity editor + R2 dev preview proxy + seed password ≥12 chars |
| #67 | Onboarding — role-aware done page + drop step counter |
| #68 | Dev preflight check for `PORT` / `WRANGLER_PORT` before `next dev` / `preview` |
| #69 | Header refresh after sign-in/up + per-role nav |
| #70 | Company profile — render LinkedIn; hide empty gallery section |
| #71 | Watchlist + investor editor — inline confirm + a11y polish |
| #72 | Intros — owner CTA, success/dup callouts, accessible queue tabs |
| #73 | gitignore engagement-specific notes (`docs/_internal/`, `docs/talking-points.md`) |

(CI, dev-DX, and skill-vendor PRs not listed for brevity — see
`git log --oneline main`.)

### Migration state on `main`

| # | Tag | Source |
|---|-----|--------|
| 0000 | `flaky_scarlet_spider` | PR #10 / #13 |
| 0001 | `brainy_sentinels` | PR #16 |
| 0002 | `slow_shotgun` | PR #16 |
| 0003 | `curious_fat_cobra` | PR #20 |
| 0004 | `striped_ulik` | PR #36 — `rate_limit` table for Better Auth's `storage: "database"` |
| 0005 | `even_medusa` | PR #38 — `saved_searches` + `search_alert_deliveries` |
| 0006 | `military_scarlet_spider` | PR #52 — public investor columns + `saved_companies` + `intro_requests` |
| 0007 | `sloppy_paper_doll` | PR #56 — `founder_passports.narrative_text` |

Next free index: **0008**. All seven applied to prod D1.

---

## Open follow-ups

| # | What |
|---|------|
| #37 | Security follow-ups from PR #36 review — `cookieCache.maxAge` propagation on role demotion, `rate_limit` table cleanup, `unsafe.bindings` → top-level `ratelimit` binding when wrangler supports it |
| #47 | Investor user e2e QA pass — broader walkthrough beyond what the dated doc covered |
| #48 | Admin user e2e testing — same |
| #51 | Site gate rate-limit branch drops the `next` query param; the `rate=1` flag is dead UX |

The repo is in **maintenance mode**. New work is small follow-ups +
ad-hoc bug fixes; no further phase planned.

---

## Archived detail

Shipped agent briefs (Agents 0–8) and the dated e2e walkthrough
findings (founder, admin, investor) live under `docs/archive/`.
Read for historical context or line-number citations — they are
not operational.
