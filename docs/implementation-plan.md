# Implementation Plan — Startup State Atlas

**Status snapshot — what's shipped, what's left.**

The product spec (what to build) lives in `docs/requirements.md`. Frozen
contracts live in `docs/architecture.md` and
`docs/agent-tasks/00-shared-context.md`. This file tracks build status
only.

Source data provided by Utah GOED — use as-is from `docs/source_data/`.
See `CLAUDE.md` § Source data for the file list and field notes.

---

## Shipped

| Phase | Slice | PR |
|-------|-------|----|
| Phase 1 — Foundation | Agent 0 — Next.js scaffold, Cloudflare Workers, D1 binding, lib stubs, shadcn | PR #6 |
| Phase 2 — Data | Agent 1 — schema + migrations + seed (companies, resources, personas) | PR #10 / #13 |
| Phase 2 — Brand & Shell | Agent 7 — Tailwind tokens, root layout, homepage, persona tiles | PR #11 |
| Phase 3a — Recommend | Agent 2 — recommendation engine, founder-passport API, enrich endpoint | PR #16 |
| Phase 3b — Navigator UI | Agent 3 — `/founder` intake, `/plan/:id` results, share link | PR #17 |
| Phase 4a — Map + Profiles | Agent 4 — ecosystem map (MapLibre), company profiles, agent card routes | PR #24 (initial); PR #28 (view modes, dual-pane reveal, dominant-sector cluster colors, scroll-spy tabs, mobile drawer) |
| Phase 4b — Auth + Admin | Agent 5 — Better Auth, OTP, onboarding, claim flow, GOEO admin | PR #20 |

Migration state on `main`: `0000_flaky_scarlet_spider` (Agent 1) +
`0001_brainy_sentinels` + `0002_slow_shotgun` (PR #16) +
`0003_curious_fat_cobra` (PR #20, renumbered cleanly). Next free
index is `0004`.

---

## Active

### Phase 3c — Agent-native layer (Agent 6)

Brief: `docs/agent-tasks/agent-6-agent-native.md`

Not yet started. Owns:

- `app/api/v1/openapi.yaml` — full OpenAPI 3.1 spec for all shipped
  endpoints. Source-of-truth for external integrators.
- `app/api/v1/openapi.json/route.ts` and `app/api/v1/search/route.ts`.
- `cli/index.ts` + `cli/commands/*.ts` — the `startup-state` CLI bin.
- `mcp/server.ts` + tools / resources / prompts — the `startup-state-mcp`
  stdio MCP server.
- `public/llms.txt` — machine-readable summary for LLM context windows.
- `public/AGENTS.md` — end-user agent rules (served at `<host>/AGENTS.md`).
- `app/agents/page.tsx` — human-readable `/agents` docs page.

Agent 6 may ship the OpenAPI spec in two passes: Phase 3 endpoints first,
then a refresh after Phase 4 company PATCH and ownership-submissions
endpoints are confirmed stable. The archived `docs/archive/agent-tasks/openapi-additions.md`
has the endpoint shapes Agents 2 and 4 wrote during parallel build.

---

## Post-launch (scope-locked)

### Phase 6 — Investor public surface (Agent 8)

Brief: `docs/agent-tasks/agent-8-investor.md`

Depends on all of Phases 1–5 being stable. Adds a public investor
directory (`/investors`), public profile pages
(`/investors/<slug>` + `.md` + `.json`), saved-companies watchlists
(`/me/saved`), and admin-brokered intro requests
(`/admin/intros`). None of this gates the initial production ship —
Phase 4 already shipped the `investor_profiles` table and investor
sign-up; Phase 6 surfaces them publicly.

**Do not pick this up** unless the user explicitly asks.

---

## Phase 5 — Launch readiness

Whoever has cycles after Phase 3c merges. Two tracks:

- **5a — hardening:** CI green on `main`, production deploy verified
  (`wrangler deploy` + D1 remote migrated + secrets set), smoke test
  against the live Worker URL, auth security review (session flags,
  CSRF, rate limits), upstream failure handling (Anthropic / Parallel.ai
  timeouts), privacy review on `founder_passports`.
- **5b — polish:** mobile sweep at 375 / 768 / 1280px, empty / error /
  loading states on every surface, end-to-end Playwright smoke test,
  activity ticker wire-up, InvestorBrief prompt tuning.

---

## Archived detail

Shipped agent briefs (Agents 0–5, 7) and the parallel-build coordination
matrix are under `docs/archive/agent-tasks/`. Read them for historical
context or line-number citations — they are not operational.
