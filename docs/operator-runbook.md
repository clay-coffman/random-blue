# GOEO Operator Runbook

How GOEO staff run Startup State Atlas in production: how to mint the
first admin, invite the rest, what to do daily, and how to debug the
prod environment when something looks off.

This is a handover doc for non-developers. Every command below is meant
to be copy-pasted.

Source-of-truth references:

- Product spec: [`docs/requirements.md`](requirements.md)
- Stack: [`docs/architecture.md`](architecture.md)
- Production config: [`wrangler.jsonc`](../wrangler.jsonc) (Worker name,
  D1, R2, observability)

## Day 0 — Mint the first superadmin

The bootstrap script is the only way to create a `superadmin`. Once
you have one, that user can invite every additional admin from the UI.

**Prerequisite:** the future superadmin must sign up first at
`https://<prod-host>/sign-up`, complete email verification (real OTP
via Resend), and land at the founder dashboard. The script doesn't
create users; it flips an existing user's role.

**One-shot command** (run from any worktree against prod):

```bash
npm run bootstrap-superadmin alice@startup.utah.gov -- --remote
```

**What happens:**

- Validates the email shape (strict regex; rejects anything that
  isn't an email).
- Runs `wrangler d1 execute startup-state-atlas-db --remote --command
  "UPDATE user SET role = 'superadmin', updated_at = ... WHERE email
  = '<email>';"`.
- Reports `✓ alice@startup.utah.gov is now a superadmin (1 row(s)
  updated).` on success.
- Reports `No rows updated. Has alice@startup.utah.gov signed up yet
  on the remote D1?` if no matching row.

**Idempotent.** Run it twice with the same email and nothing breaks —
the user stays a superadmin.

**Local-only run** (for testing in a worktree against the local
SQLite): drop the `-- --remote` flag.

```bash
npm run bootstrap-superadmin alice@example.test
```

**Required environment** for the remote run: `wrangler` must be able
to authenticate. Either `wrangler login` once on your machine, or set
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in your shell.

## Day 1+ — Invite additional admins

Once a superadmin exists, every additional admin comes through the UI.

1. The superadmin signs in at `/sign-in`, then opens `/admin/admins`.
2. Click **+ Invite admin**, enter the GOEO staff member's email,
   submit.
3. The system writes a row to `admin_invites` and emails a one-time
   link to `https://<prod-host>/invite/<token>` via Resend. The token
   is single-use and expires in 7 days.
4. The recipient signs up (or signs in) using the **same email
   address** the invite was sent to. Email mismatch → 403; the system
   refuses to flip an unrelated account's role.
5. The recipient opens the invite link, clicks **Accept**. Their role
   flips to `goeo_admin`. They land on `/admin`.

The invite email is sent from `Startup State Atlas
<noreply@startup.utah.gov>`. If a recipient says they didn't get one,
see *Email troubleshooting* below.

## Daily admin queues

Admin sidebar nav (`/admin`) groups everything. Role gates are enforced
in `app/admin/layout.tsx` and re-checked at the API layer for writes.

| URL | Role | What it's for |
|---|---|---|
| `/admin` | `goeo_admin` or `superadmin` | Dashboard. Stats row, top of the claim queue, recent agent edits feed, coverage gaps strip. |
| `/admin/submissions` | `goeo_admin` or `superadmin` | Pending business-ownership claim queue. Open a row to view the uploaded proof doc via a signed R2 URL, then approve (sets `claimed_by_user_id`) or reject with notes. |
| `/admin/resources` | `goeo_admin` or `superadmin` | CRUD for the resource directory (funding, mentoring, training). Status chips show live/stale/draft/broken-link. |
| `/admin/companies` | `goeo_admin` or `superadmin` | CRUD for company profiles. No founder-field whitelist; admins edit anything. |
| `/admin/users` | `goeo_admin` or `superadmin` (read); `superadmin` (role flip) | All users with role-filter chips. Any admin can read; only superadmin sees the role-change dropdown. |
| `/admin/admins` | `superadmin` only | Active admins + pending invites; **+ Invite admin** form. |

The dashboard is the right home base — most pending work surfaces there.

## Production debugging

The Worker is `startup-state-atlas`. The D1 binding is `DB`, pointing
at `startup-state-atlas-db`. The R2 binding is `OWNERSHIP_DOCS`,
pointing at the `atlas-ownership-docs` bucket. Cloudflare observability
is on, so logs are searchable from the Workers dashboard.

**Live tail logs** (during an incident):

```bash
npx wrangler tail --format pretty
```

**One-off prod D1 queries** (read-only — copy-paste, edit the SQL):

```bash
# How many admins do we have?
npx wrangler d1 execute startup-state-atlas-db --remote \
  --command "SELECT role, COUNT(*) FROM user WHERE role IN ('goeo_admin', 'superadmin') GROUP BY role;"

# Pending claim submissions
npx wrangler d1 execute startup-state-atlas-db --remote \
  --command "SELECT id, company_slug, status, created_at FROM business_ownership_submissions WHERE status = 'pending' ORDER BY created_at;"

# Outstanding admin invites that haven't been consumed yet
npx wrangler d1 execute startup-state-atlas-db --remote \
  --command "SELECT email, created_at, expires_at FROM admin_invites WHERE consumed_at IS NULL ORDER BY created_at DESC LIMIT 20;"
```

`SELECT` only. Don't run mutations against prod from this command line
unless you've thought about it twice.

**Find the live URL / current deployment:**

```bash
npx wrangler deployments list
```

**Apply pending DB migrations to prod** (only after they're reviewed
and merged):

```bash
npm run db:migrate:remote
```

## Email setup

Production email goes through Resend. Set `RESEND_API_KEY` as a Worker
secret:

```bash
npx wrangler secret put RESEND_API_KEY
# paste the Resend API key when prompted
```

The from-address is hard-coded to `Startup State Atlas
<noreply@startup.utah.gov>`. The Resend dashboard must have the
`startup.utah.gov` domain verified (SPF + DKIM) for delivery to land
in inboxes rather than spam.

**Dev fallbacks** (don't apply to prod):

- If `MAILPIT_URL` is set, `lib/email.ts` POSTs outgoing email to a
  local mailpit instance instead of Resend. Used in worktrees during
  development. **Never set `MAILPIT_URL` in production.**
- If neither `RESEND_API_KEY` nor `MAILPIT_URL` is set, email falls
  back to a `console.log` of the full HTML body. This is a dev
  convenience; if it ever fires in production, real users won't get
  their OTPs or invite links.

**Sanity-check after any redeploy:**

```bash
# Confirm RESEND_API_KEY is set on the Worker
npx wrangler secret list
```

You should see `RESEND_API_KEY` in the output. If you don't, all
auth/invite emails are getting `console.log`'d instead of sent.

## Known operational gaps & manual workarounds

The product is feature-complete for launch but a few admin workflows
expect a human-in-the-loop today rather than a built UI:

### No invite revocation UI

If you sent an invite to the wrong address, or an admin leaves before
accepting, manually delete the row:

```bash
npx wrangler d1 execute startup-state-atlas-db --remote \
  --command "DELETE FROM admin_invites WHERE email = 'wrong@example.com' AND consumed_at IS NULL;"
```

(After the fact, the recipient's link returns 404.)

### No invite rate-limiting

A superadmin can issue any number of invites to the same email. If
you re-send because the first one didn't arrive, the previous invite
stays valid until expiry. Cleanest workflow: revoke (above), then
re-invite from `/admin/admins`.

Monitor `/admin/admins` — pending invites listed there. If you see
duplicates for the same address, clean up.

### Silent email failure

If `RESEND_API_KEY` is unset on the Worker, the invite row is created
in D1 but the email never sends — the system falls back to
`console.log`. The recipient never gets a link.

If a recipient says they didn't get an invite:

1. Check `/admin/admins` — does the row exist? If yes, the create
   path worked.
2. Tail logs for the email send: `npx wrangler tail --format pretty`,
   then re-trigger the invite. Look for `[email:dev]` lines (means
   the fallback fired) or Resend errors.
3. Verify the secret is set: `npx wrangler secret list`. If
   `RESEND_API_KEY` is missing, set it (above) and re-invite.

### No "Pending edits" review queue UI

The spec mentions an owner-edit review flow. The data layer
(`profile_updates`) is in place and the dashboard shows a read-only
feed of recent agent edits, but there's no admin-side approve/reject
flow yet. Phase 5. Until then, owner-side edits are applied
immediately on submission (the field whitelist enforces what owners
are allowed to change).

### Demoting yourself

The bootstrap script and `/admin/users` API both refuse to demote the
currently-logged-in superadmin. If you genuinely need to demote
yourself, sign in as a different superadmin and demote from there.
This is intentional — it prevents an admin from accidentally locking
the org out of `superadmin` access.

To mint a second superadmin so you can demote yourself, that second
person must have signed up first, then run the bootstrap script
against their email.

## Pre-launch sanity checklist

Run this end to end before announcing the production URL:

- [ ] `npx wrangler secret list` includes `RESEND_API_KEY`,
      `BETTER_AUTH_SECRET`, `ANTHROPIC_API_KEY`, `ATLAS_ADMIN_TOKEN`
      (and any other secrets the deployment needs from
      `.dev.vars.example`).
- [ ] First superadmin minted via `npm run bootstrap-superadmin
      <email> -- --remote`. Confirmed they can sign in and reach
      `/admin`.
- [ ] At least one additional `goeo_admin` invited from
      `/admin/admins` and accepted the invite (proves the email
      pipeline works end to end).
- [ ] Claim queue (`/admin/submissions`) reachable; you can open a
      submission's R2-uploaded doc via the signed URL.
- [ ] `npx wrangler d1 execute startup-state-atlas-db --remote
      --command "SELECT COUNT(*) FROM resources;"` returns a non-zero
      count (seed ran successfully).
- [ ] `npx wrangler d1 execute startup-state-atlas-db --remote
      --command "SELECT COUNT(*) FROM companies;"` returns ~254 (the
      ecosystem map is loaded).
- [ ] Production URL serves `/`, `/founder`, `/map`, `/agents`,
      `/admin` without 5xxs.
- [ ] `/AGENTS.md` and `/llms.txt` return content (agent-native layer).
- [ ] Cloudflare observability tab in the Workers dashboard shows
      requests landing.

When everything above is green, the site is ready to hand over.
