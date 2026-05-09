# Deploy log

Per-deploy chronology lives on the Cloudflare Workers dashboard
(Deployments tab) and in `git log` on `main`. This file documents
the **current production state** plus the production-readiness
fixes worth keeping for debugging context.

## Production state

| Resource | Value |
|----------|-------|
| **Live URL** | <https://startupstateatlas.dev> (and `https://www.startupstateatlas.dev`) |
| **Custom domain** | managed via `wrangler.jsonc` `routes` with `custom_domain: true`; Cloudflare auto-manages DNS + SSL |
| **Worker** | `startup-state-atlas` (single Worker; OpenNext bundle) |
| **D1** | `startup-state-atlas-db` — binding `DB`, id `698139c1-1b46-456f-a4fe-6206a8c204bb`. Migrations `0000`–`0007` applied (see `docs/implementation-plan.md` § Migration state). |
| **R2** | `atlas-ownership-docs` — binding `OWNERSHIP_DOCS`. Proof-of-ownership uploads for company claims. |
| **Observability** | Cloudflare Workers built-in (free tier). `observability.enabled = true` in `wrangler.jsonc`. Live tail via `wrangler tail`. |
| **Email FROM** | `Startup State Atlas <noreply@startupstateatlas.dev>` (Resend, with DKIM + SPF + DMARC on Cloudflare DNS) |
| **Site gate** | `SITE_PASSWORD` secret active. Rotate via `wrangler secret put SITE_PASSWORD`; drop the gate with `wrangler secret delete SITE_PASSWORD`. |
| **Bootstrap superadmin** | `claymcoffman@gmail.com` |

### Workers secrets

Set via `wrangler secret put <NAME>`. Verify the full set with
`wrangler secret list`.

`ANTHROPIC_API_KEY`, `ATLAS_ADMIN_TOKEN`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `PARALLEL_API_KEY`, `RESEND_API_KEY`,
`R2_ACCESS_KEY_ID`, `R2_ACCOUNT_ID`, `R2_SECRET_ACCESS_KEY`,
`SITE_PASSWORD`.

`BETTER_AUTH_URL` must match the public origin (currently
`https://startupstateatlas.dev`); `auth.ts` boot-checks this and
refuses to start if the cookie prefix would silently downgrade.

## Operator quick-ref

```bash
# Live tail
wrangler tail

# Read prod DB (SELECT only — writes go through the API)
wrangler d1 execute startup-state-atlas-db --remote --command "SELECT …"

# Re-deploy after a code change
npm run deploy

# Apply pending migrations to prod
npm run db:migrate:remote

# Promote a new admin (after they sign up via UI)
npm run bootstrap-superadmin <email> -- --remote

# Workers secret rotation
echo "<new-value>" | wrangler secret put <NAME>
```

See `docs/operator-runbook.md` for the full ops loop (claim review,
admin invites, debugging incidents, etc.).

## Production-readiness fixes (debugging context)

These were flushed out by the first `npm run deploy` invocation and
the subsequent custom-domain switchover. None had been hit by
`npm run dev` because the Next.js / OpenNext / Workers-runtime
build path is only exercised at deploy time. Worth knowing if a
future deploy hiccup looks similar.

1. **Suspense boundaries on 5 auth pages.** Next 15 prerender
   requires an explicit `<Suspense>` wrapper around any client
   component that reads search params via `useSearchParams()`.
   Wrapped `/sign-in`, `/sign-up`, `/sign-up/account`,
   `/sign-up/verify`, `/login/sent`, `/reset-password`.
2. **Stripped `export const runtime = "edge"` from API routes.**
   OpenNext-Cloudflare bundles the entire app as a single Worker
   function; the Workers runtime IS the edge runtime. The
   annotation was a no-op cargo-cult that breaks the bundle.
   Removed from `/api/mcp`, `/api/v1/founder-passports/*`,
   `/api/v1/openapi.json`, `/api/v1/resources/recommend`.
3. **Anthropic SDK fetch shim.** The SDK auto-detects an HTTP
   client that doesn't work on Workers, surfacing as "Connection
   error" on every Claude call. Fixed by passing
   `fetch: globalThis.fetch.bind(globalThis)` in the `Anthropic`
   constructor in `lib/anthropic.ts`.
4. **Async `getAuth()` (PR #57).** `getCloudflareContext()` is
   sync by default, which Next 15 forbids at the top level of
   a non-static route during prerender. After PR #46 added
   `await getAuth().api.getSession(...)` to the root layout, every
   subsequent `npm run deploy` failed at prerender of any static
   auth page (`/forgot-password`, `/reset-password`,
   `/login/sent`, `/_not-found`). Fix: switch `getAuth()` to
   `async` and use `getCloudflareContext({ async: true })`. All
   15 callers updated to `await (await getAuth()).api...`.
5. **Build env requirement.** The prerender step needs
   `BETTER_AUTH_SECRET` in the build environment. `npm run deploy`
   is normally invoked from a worktree where Wrangler auto-loads
   `.dev.vars`; if you're invoking the bare build
   (`npx opennextjs-cloudflare build`) you must
   `set -a; source .dev.vars; set +a` first or every Better Auth
   page errors with "default secret".
6. **Custom-domain CF API token scope.** `wrangler deploy` calls
   `GET /zones/<zone_id>/workers/routes` to verify the routes
   config; the token needs `Zone:Workers Routes:Read` (or `Edit`)
   on the `startupstateatlas.dev` zone. The "Edit Cloudflare
   Workers" template in the CF dashboard bundles every scope
   needed for routine deploys + D1 + R2.
7. **Resend FROM.** `noreply@startup.utah.gov` isn't verified in
   Resend yet. Current FROM is `noreply@startupstateatlas.dev`;
   flip `lib/email.ts` once GOEO ships DNS records for
   `startup.utah.gov`.
