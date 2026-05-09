# Implementation Plan — Startup State Atlas

**Status snapshot — what's shipped, what's in flight, what's left.**

The product spec (what to build) lives in `docs/requirements.md`. Frozen
contracts live in `docs/architecture.md` and
`docs/agent-tasks/00-shared-context.md`. This file tracks build status
only.

Last refreshed **2026-05-09** (after PR #42 merge). Per-deploy state
lives in `docs/deploy-log.md`. The e2e walkthrough that surfaced the
`B1`–`B11` bug bucket lives in `docs/e2e-findings-2026-05-09.md`.

---

## Live

**Production URL:** <https://startup-state-atlas.claymcoffman.workers.dev>
(custom domain `startupstateatlas.dev` lands with PR #43; the final
hostname will be set by GOEO).

First production deploy: **PR #41** (2026-05-09). DB seeded with 220
companies, 213 resources, 6 personas. First superadmin minted via
`scripts/bootstrap-superadmin.ts`. Nine Worker secrets configured.

> **Prod is behind `main`.** Deploys are manual (`wrangler deploy` —
> there is no CI auto-deploy). The Worker is currently running
> `dc7fa59` (PR #41 merge), which includes PR #36 (auth security)
> but **not** PR #38 (saved-search alerts) or **PR #42 (MCP write-tool
> exposure fix — security-critical)**. A re-deploy is needed before
> the MCP fix is live. Prod D1 is still at migration `0003`; the
> next deploy needs `npm run db:migrate:remote` to apply `0004`
> (Better Auth `rate_limit`) and `0005` (`saved_searches`).

---

## Shipped

### Phases 1–4 — foundation through profiles + auth

| PR | What |
|----|------|
| #6  | Phase 1 — Agent 0 — Next.js scaffold + Cloudflare Workers + D1 binding + lib stubs + shadcn |
| #10 / #13 | Phase 2 — Agent 1 — schema + migrations + seed (companies, resources, personas) |
| #11 | Phase 2 — Agent 7 — brand & shell (Tailwind tokens, layout, homepage, persona tiles) |
| #16 | Phase 3a — Agent 2 — recommendation engine, founder-passport API, Parallel.ai enrich endpoint |
| #17 | Phase 3b — Agent 3 — Founder Navigator UI (`/founder` intake, `/plan/:id`, share link) |
| #20 | Phase 4b — Agent 5 — Better Auth + OTP + onboarding + claim flow + GOEO admin |
| #24 / #28 | Phase 4a — Agent 4 — ecosystem map (MapLibre), company profiles, agent cards (#28 added view modes / dual-pane reveal / dominant-sector cluster colors / scroll-spy tabs / mobile drawer) |
| #26 | Activity ticker — homepage feed off real D1 events |
| #27 | Phase 3c — Agent 6 — agent-native layer (OpenAPI 3.1, CLI, local stdio MCP, remote MCP, `/llms.txt`, `/AGENTS.md`, `/agents` page) |
| #31 | GOEO operator runbook + admin nav gate fix |
| #32 | Auth UI polish — match Auth.html wireframe; drop magic-link & Google |

### Phase 5a — launch readiness (security + first deploy)

| PR | What | Closes |
|----|------|--------|
| #36 | Auth security pass — `__Host-` cookies, CSRF on `/api/v1/*` writes, Better Auth rate limits, Cloudflare upload rate-limit binding | — |
| #38 | Saved-search email alerts — daily/weekly cadence, GitHub Actions cron, signed unsubscribe (post-judge-feedback addition) | — |
| #40 | E2E founder walkthrough — findings doc + Playwright fixtures | — |
| #41 | First production deploy — `wrangler deploy` + D1 remote migrate + Worker secrets + bootstrap superadmin | — |
| #42 | MCP write-tool exposure fix — drop `update_company_profile` from public `/api/mcp` | #35 |

(Documentation, CI, dev-DX, and skill PRs not listed for brevity — see
`git log --oneline main`.)

### Migration state on `main`

| # | Tag | Source |
|---|-----|--------|
| 0000 | `flaky_scarlet_spider` | Agent 1 (PR #10 / #13) |
| 0001 | `brainy_sentinels` | PR #16 |
| 0002 | `slow_shotgun` | PR #16 |
| 0003 | `curious_fat_cobra` | PR #20 |
| 0004 | `striped_ulik` | PR #36 — `rate_limit` table for Better Auth's `storage: "database"` |
| 0005 | `even_medusa` | PR #38 — `saved_searches` + `search_alert_deliveries` |

Next free index: **0006**.

---

## In flight

Four open PRs as of last refresh. All branched off `main` after PR #42;
check each one for current status before assuming.

| PR | What | Mergeable | Closes |
|----|------|-----------|--------|
| #43 | Custom domain `startupstateatlas.dev` + env-driven preview gate (site-wide password gate so we can share the URL pre-launch) | CLEAN | — |
| #44 | E2E quick-wins bundle — B1 (D1-derived landing stats), B5 (Better Auth `trustedOrigins`), B9 (persona quick-test submit), B11 (Priya naming) | UNSTABLE (checks pending) | — |
| #45 | Plan page fixes — B7 (skip-bucket explainer wording), B8 (mailto CTAs prepopulated from passport) | UNSTABLE | — |
| #46 | Header rewrite — B2 (mobile sign-in CTA), B6 (auth-state branching), B10 (sign-out CTA + UserMenu) | UNSTABLE | — |

Between #44, #45, #46 — **9 of the 11** e2e bugs close. The remaining
two (B3, B4) are not yet PR'd; see _Open issues_ below.

---

## Open issues

| # | What | Priority |
|---|------|----------|
| #34 | Rate-limit public founder-passport endpoints (Anthropic cost protection) | pre-launch nice-to-have, ~30 min fix using the same `unsafe.bindings` ratelimit pattern as PR #36 |
| #37 | Smaller hardening follow-ups — `cookieCache.maxAge` propagation on role demotion; `rate_limit` table cleanup; `unsafe.bindings` → top-level `ratelimit` binding when wrangler supports it | post-launch |

Also from `docs/e2e-findings-2026-05-09.md` but not yet ticketed:

- **B3** — worktree dev: applying migration 0003 wasn't flagged in the
  worktree refresh skill.
- **B4** — `AUTH_SKIP_OTP=true` signup still routes to
  `/sign-up/verify` instead of dropping the user on the founder
  dashboard.

---

## Phase 5b — Polish

Original 5b scope, with current status:

- ✅ End-to-end Playwright smoke test — fixtures in PR #40.
- ✅ Activity ticker wire-up — PR #26.
- ✅ Mobile sweep at 375 / 768 / 1280px — most of the surface, with
  the header gap (B2) closing in #46.
- 🟡 Empty / error / loading states on every surface — handled
  ad-hoc as found; no single sweep PR.
- 🟡 InvestorBrief prompt tuning — not yet on a PR.

---

## Pre-launch sequencing (recommended)

1. **Re-deploy now** to ship the MCP fix (PR #42) and saved-search
   alerts (PR #38) to prod: `npm run deploy` + `npm run db:migrate:remote`
   to apply `0004` + `0005`. The MCP exposure is the security-critical
   one — it's been patched on `main` but until prod re-deploys, the
   live `/api/mcp` still accepts `update_company_profile`.
2. Land #46 → #45 → #44 (e2e-bug PRs). #46 touches the shared header,
   so the others may rebase cleaner with it in first.
3. Land #43 (custom domain + preview gate).
4. Re-deploy after each batch of merges (or set up a CI auto-deploy
   workflow if doing this by hand becomes annoying).
5. Fix #34 (founder-passport rate limits) — modest effort, real cost
   surface for unauthenticated Claude calls.
6. Triage B3 + B4 (assign or punt).
7. Confirm `BETTER_AUTH_URL` is set on prod (PR #36's boot-check
   enforces this — Worker refuses to boot otherwise).
8. Smoke test against the live URL.
9. Coordinate with GOEO on DNS for `startup.utah.gov`.

After launch: #37 (small hardening), InvestorBrief prompt tuning,
then evaluate Phase 6.

---

## Out of scope until launch

### Phase 6 — Investor public surface (Agent 8)

Brief: `docs/agent-tasks/agent-8-investor.md`

Public investor directory (`/investors`), public profile pages
(`/investors/<slug>` + `.md` + `.json`), saved-companies watchlists
(`/me/saved`), and admin-brokered intro requests (`/admin/intros`).
Phase 4 already shipped the `investor_profiles` table and investor
sign-up; Phase 6 surfaces them publicly.

**Do not pick this up unless explicitly asked.**

---

## Archived detail

Shipped agent briefs (Agents 0–7) and the parallel-build coordination
matrix are under `docs/archive/agent-tasks/`. Read for historical
context or line-number citations — they are not operational.
