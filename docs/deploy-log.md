# Deploy log

## 2026-05-09 — first production deploy (Phase 5a)

**Live URL:** https://startup-state-atlas.claymcoffman.workers.dev (Worker on the
`claymcoffman.workers.dev` subdomain; custom domain — `startup.utah.gov` or
similar — is a follow-up after GOEO points DNS at Cloudflare).

**Git SHA at deploy:** `ac84dd1` (post PR #27 merge) plus the production-
readiness fixes in this PR.

**Cloudflare resources:**
- Worker: `startup-state-atlas`
- D1 binding `DB` → `startup-state-atlas-db` (`698139c1-1b46-456f-a4fe-6206a8c204bb`)
- R2 binding `OWNERSHIP_DOCS` → `atlas-ownership-docs` (created during this
  session via `wrangler r2 bucket create`)
- Observability: enabled in `wrangler.jsonc` (free Cloudflare Workers logs)

**Workers secrets** (9 total, all set via `wrangler secret put`):
`ANTHROPIC_API_KEY`, `ATLAS_ADMIN_TOKEN` (fresh prod value; not the dev one),
`BETTER_AUTH_SECRET` (fresh prod value), `BETTER_AUTH_URL`
(`https://startup-state-atlas.claymcoffman.workers.dev`), `PARALLEL_API_KEY`,
`R2_ACCESS_KEY_ID`, `R2_ACCOUNT_ID`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`.
`wrangler secret list` confirms all nine.

**D1 state:** all 4 migrations applied (`0000_flaky_scarlet_spider`,
`0001_brainy_sentinels`, `0002_slow_shotgun`, `0003_curious_fat_cobra`).
Seeded: 220 companies, 213 resources, 6 personas, 3 investor_profiles.

**First superadmin:** `claymcoffman@gmail.com`, minted via
`npm run bootstrap-superadmin claymcoffman@gmail.com -- --remote` after the
sign-up + OTP-verify round-trip succeeded.

**Email FROM:** `Startup State Atlas <noreply@startupstateatlas.dev>` —
`startupstateatlas.dev` is verified in Resend (DKIM + SPF + DMARC on
Cloudflare DNS). When GOEO verifies `startup.utah.gov` in Resend we'll flip
`lib/email.ts` to `noreply@startup.utah.gov`.

## Production-readiness fixes applied during this deploy

These were flushed out by the first `npm run deploy` invocation; none of them
had been hit by `npm run dev` because the Next.js / OpenNext / Workers-runtime
build path is only exercised at deploy time.

1. **Suspense boundaries on 5 auth pages.** `useSearchParams()` opt-out
   pages were prerender-erroring because Next 15 needs an explicit
   `<Suspense>` wrapper around any client component that reads search
   params. Wrapped `/sign-in`, `/sign-up`, `/sign-up/account`,
   `/sign-up/verify`, `/login/sent`, `/reset-password`.
2. **Stripped `export const runtime = "edge"` from 6 API routes.**
   OpenNext-Cloudflare bundles the entire app as a single Worker
   function — Workers IS the edge runtime — and refuses to ship a
   route alongside the default function when it's marked edge.
   Removed from `/api/mcp`, `/api/v1/founder-passports/*`,
   `/api/v1/openapi.json`, `/api/v1/resources/recommend`. The Workers
   runtime IS edge; the annotation was a no-op cargo-cult from
   templating examples.
3. **Anthropic SDK fetch shim.** The SDK auto-detects an HTTP client
   that doesn't work on Workers, surfacing as "Connection error" on
   every Claude call. Fixed by passing `fetch:
   globalThis.fetch.bind(globalThis)` in the `Anthropic` constructor
   in `lib/anthropic.ts`. Both `recommend-explain.ts` and
   `lib/investor-brief.ts` now produce real Claude output on the
   deployed Worker.
4. **Resend FROM swap.** `noreply@startup.utah.gov` isn't verified in
   Resend yet — the test sender `onboarding@resend.dev` only
   delivers to the Resend account holder's email. Verified
   `startupstateatlas.dev` in Resend (DNS records on Cloudflare),
   set `FROM` to `noreply@startupstateatlas.dev` with a TODO to flip
   to `noreply@startup.utah.gov` when GOEO is ready.

## Smoke test — what passed

Programmatic (curl):
- `/`, `/founder`, `/map`, `/agents`, `/llms.txt`, `/AGENTS.md`,
  `/sign-in`, `/sign-up`, `/forgot-password` — all 200.
- `/startups/crew`, `/startups/crew.md`, `/startups/crew.json`,
  `/startups/alcomy?view=dual` — all 200. 404 paths return 404.
- `/api/v1/openapi.json` — 200, 11 paths, OpenAPI 3.1.0.
- `/api/v1/companies` — 220 total. `?sector=FinTech&stage=seed&county=Salt%20Lake`
  returns 3 companies (`streamos`, `swyf`, `elements`), matching Flow 3.
- `/api/v1/resources/recommend` with `passport_id=fp_priya` returns
  12 scored recs with non-empty `because` sentences (Anthropic round-trip).
- `/api/v1/companies/investor-brief` returns 4 themes for a FinTech
  filter (Anthropic structured output round-trip).
- `/api/mcp` `initialize` returns valid MCP capabilities (tools +
  resources + prompts list-changed flags).

Visual:
- `/map` at 1280px renders MapLibre + CARTO Voyager vector tiles,
  Utah-centered, sector-colored cluster, filter sidebar, view toggle,
  attribution. Browser tested via Playwright.

Auth round-trip:
- Sign-up at `/sign-up` (Founder role) → account page → OTP email
  arrives from `noreply@startupstateatlas.dev` → verify → land
  signed-in.
- Bootstrap script flipped `claymcoffman@gmail.com` to `superadmin`.
- Sign out + back in → `/admin` loads.

## Out of scope (deferred)

- **Custom domain (`startup.utah.gov`):** awaiting GOEO DNS
  coordination. Once they point DNS at Cloudflare and we add the
  custom domain via the dashboard, we'll flip `BETTER_AUTH_URL` and
  the email FROM.
- **GitHub Actions deploy workflow** (`cloudflare/wrangler-action`):
  separate small PR. For now, deploy is manual via `npm run deploy`
  from a developer machine.
- **Rest of Phase 5a:** auth security review, upstream failure
  handling check, privacy review on `founder_passports`,
  observability decision (Sentry vs Workers built-in).
- **Phase 5b polish:** mobile sweep on every surface, full Playwright
  e2e suite, InvestorBrief prompt tuning. The map and profile
  surfaces have been swept; the rest haven't.

## Operator quick-ref

```bash
# Live tail
wrangler tail

# Read prod DB (SELECT only — writes go through the API)
wrangler d1 execute startup-state-atlas-db --remote --command "SELECT …"

# Re-deploy after a code change
npm run deploy

# Promote a new admin (after they sign up via UI)
npm run bootstrap-superadmin <email> -- --remote

# Workers secret rotation
echo "<new-value>" | wrangler secret put <NAME>
```

See `docs/operator-runbook.md` for the full ops loop (claim review,
admin invites, debugging incidents, etc.).
