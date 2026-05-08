# Agent 5 — Auth, onboarding, ownership verification, GOEO admin

You build five surfaces:

1. **Authentication** — Better Auth (email + password + 6-digit
   email-OTP verification) for three self-serve user types
   (`founder` / `owner` / `investor`) plus invite-only
   `goeo_admin` and `superadmin`. Three-step sign-up (role →
   account → verify), single sign-in URL with password / forgot,
   and password-reset on the same OTP plumbing.
2. **Role-specific onboarding** — `/onboarding/founder` (redirects
   to Agent 3's intake with a stepper), `/onboarding/owner`
   (search-and-claim shortcut into the existing claim flow),
   `/onboarding/investor` (preferences form, NEW), shared
   `/onboarding/done`.
3. **Founder/owner claim flow with real ownership verification** —
   owners sign up, upload a verification document to R2, admin
   reviews and approves, owner can edit their company.
4. **Account settings** — single sectioned page at `/settings`:
   profile, security, role-specific (Founder Passport view OR
   Investor preferences OR Claimed companies), notifications stub,
   agent-tokens stub, danger zone.
5. **GOEO admin UI** — staff log in (same Better Auth, with role
   `goeo_admin` or `superadmin`) and operate the dashboard,
   ownership-submission queue, claim-review modal, resource
   directory, company list, users list, admin invites, and map
   curation without a developer.

The admin half is required for the demo narrative ("the state can
maintain this without us"). The owner-edit half is the headline
"business owners are the website" demo. The investor type is
production scaffolding — it doesn't gate any demo scene; cut it
first if you slip.

The auth visual scope comes from
`design/startup-state-atlas-wireframes/project/Auth.html`.
**Read all five tabs (Sign up · Log in · Onboarding · Settings ·
Admin) top-to-bottom before coding.** That's the contract.

Aim for **~210 minutes** (was 150 before Auth.html absorbed +
investor type). If you hit ~150 minutes and aren't through the
admin half, start the cuts cascade in
`docs/implementation-plan.md` § Cuts cascade → Agent 5.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 2).
- **Branch:** `feat/auth-claim-admin`. First action:
  `git checkout -b feat/auth-claim-admin`.

## Reads first

1. `docs/implementation-plan.md` — your phase + coordination matrix
   (you depend on Agent 7's layout, share `[slug]/route.ts` with
   Agent 4).
2. `docs/agent-tasks/00-shared-context.md` — § "Auth-for-write
   (dual model)" and "Auth schema ownership".
3. `docs/architecture.md` — repo layout, dual-auth bindings, and
   the OWNERSHIP_DOCS R2 binding.
4. `docs/requirements.md` — Authentication, Self-service claim
   flow, GOEO admin UI.
5. `docs/hackathon-plan.md` — § "Authentication & ownership
   verification".
6. `design/startup-state-atlas-wireframes/project/Auth.html` —
   **primary** auth/onboarding/admin UI reference. Read all five
   tabs (Sign up · Log in · Onboarding · Settings · Admin)
   top-to-bottom; the wireframe is the contract for this brief.
7. `design/startup-state-atlas-wireframes/project/wireframes/v2/claim.js`
   (3-act flow: verify → editor → "update via Claude/ChatGPT"
   handoff). Read HTML/CSS — don't render. The third-act handoff is
   a Phase 5 polish target; ship the first two acts.
8. **`docs/source_data/page-2026-05-08-19-38-24.md`** § "Self-service
   profiles" — the brief's exact requirement on verification
   ("lightweight verification method") and the company-profile field
   list. Confirms the scope of the editor whitelist.
9. `db/schema.ts` — `user` (with `role`), `session`, `account`,
   `verification`, `business_ownership_submissions`,
   `companies` (now with `claimed_by_user_id`), `profile_updates`
   (Agent 1 owns).
10. `auth.ts` — the stub Agent 1 wrote. You expand it (enable the
    `emailOTP` plugin, flip role default to `founder`, widen the
    role enum).
11. Better Auth docs (via `context7`):
    <https://www.better-auth.com/docs>. Specifically
    <https://www.better-auth.com/docs/plugins/email-otp> for the
    6-digit OTP flow.
12. `app/startups/[slug]/page.tsx` (Agent 4) — to know the
    "Claim this company" button.

## Depends on

- **Agent 0 done.** Need: `better-auth` + `@better-auth/cli` +
  `resend` installed; `OWNERSHIP_DOCS` R2 binding;
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`,
  `ATLAS_ADMIN_TOKEN` secrets set; `bootstrap-superadmin` script
  hook in `package.json`.
- **Agent 1 done.** Need: Better Auth tables, ownership
  submissions table, `companies.claimed_by_user_id`. The old
  `company_claims` table must be gone. **You** add two more
  tables in this PR (`investor_profiles`, `admin_invites`) — see
  Deliverable 14 below.
- **Agent 7 done (or in flight).** You consume `app/layout.tsx`,
  brand tokens, and brand primitives (`Tile`, `Chip`, etc.) for the
  auth pages, claim flow, and admin shell. If Agent 7 hasn't
  merged, stub minimal styles and rebase later.
- **Agent 4 in progress or done.** You wire your "Claim" button
  to Agent 4's profile page and add PATCH on top of Agent 4's
  GET in `app/api/v1/companies/[slug]/route.ts`. Land Agent 4
  first; your PR adds the PATCH method to the same file.

## Owns (write surface)

Auth wiring:

- `auth.ts` — full Better Auth config (expanded from Agent 1's
  stub). Enable the `emailOTP` plugin (6-digit code, 10-min
  expiry, 30-sec resend cooldown). Widen the
  `additionalFields.role` enum to
  `founder | owner | investor | goeo_admin | superadmin`; flip
  the default from `'owner'` to **`'founder'`**. Hooks
  `lib/email.ts` for verification + reset mail. Reads the
  request-bound D1 client from `lib/cf.ts`. Magic-link plugin
  and Google social provider stay **off** in Phase 4 (the
  `/sign-in` and `/sign-up` buttons render as Phase-5 stubs to
  match the wireframe).
- `lib/auth-client.ts` — Better Auth React client for the
  browser.
- `lib/email.ts` — thin Resend wrapper used by Better Auth's
  email-OTP + password-reset hooks.
- `middleware.ts` — Next.js middleware that gates `/admin/*` on
  `goeo_admin | superadmin` roles (with extra `superadmin`-only
  gate on `/admin/users`'s role-flip handler and `/admin/admins`),
  gates `/companies/[slug]/edit` on ownership match, gates
  `/companies/[slug]/claim` on any signed-in user, gates
  `/onboarding/*` on signed-in, gates `/settings` on signed-in.
- `app/api/auth/[...all]/route.ts` — Better Auth's catch-all
  handler (it serves sign-up, sign-in, OTP send/verify, etc.).

Auth UI pages — three-step signup, single sign-in, reset, sent:

- `app/sign-up/page.tsx` — **step 1 of 3**: role-select cards
  (founder default, owner, investor) + Continue. Persists the
  role pick in a short-lived cookie or query param so step 2
  can read it. "Already have an account? Log in →" link to
  `/sign-in`. "Admin accounts are not self-serve" footer note.
- `app/sign-up/account/page.tsx` — **step 2 of 3**: full name,
  email, password (12+ chars w/ strength bar), Terms +
  Privacy checkbox. Phase-5 stubs for "Continue with Google"
  and "Email me a magic link." On submit: create the Better
  Auth user with the captured role and request a verification
  OTP via the `emailOTP` plugin → redirect to step 3.
- `app/sign-up/verify/page.tsx` — **step 3 of 3**: 6-digit OTP
  inputs. Auto-advances on the 6th digit. Shows expiry
  countdown + resend cooldown chips. Wrong code → inline
  error (no destructive state change). Verify success →
  redirect to `/onboarding/{role}`.
- `app/sign-in/page.tsx` — single page; email + password +
  Remember me + Forgot. "Email me a magic link" and "Continue
  with Google" render as **Phase-5 stubs** (greyed-out, label
  "Coming soon"). On success → redirect to `?next=` (or `/`).
- `app/forgot-password/page.tsx` — single email field, generic
  confirmation copy ("If we have an account, we'll send a
  6-digit code"); on submit → `/login/sent`.
- `app/reset-password/page.tsx` — OTP entry + new password
  fields. Uses the same `emailOTP` plugin as signup verify.
- `app/login/sent/page.tsx` — shared "code/link sent"
  confirmation. In Phase 4, only the reset-code path lands here;
  in Phase 5 the magic-link path lands here too.

Onboarding pages:

- `app/onboarding/founder/page.tsx` — server-side redirect to
  `/founder?onboard=1`. Agent 3's `/founder` page reads the
  param and renders a stepper above the existing intake form;
  submit redirects to `/onboarding/done` instead of straight to
  `/plan/[id]`.
- `app/onboarding/owner/page.tsx` — search input bound to
  `GET /api/v1/companies?q=…` (Agent 4). Match list with status
  chips (claimed / unclaimed / pending). "+ Add a new company"
  affordance for misses. On click → redirect to
  `/companies/[slug]/claim`.
- `app/onboarding/investor/page.tsx` — preferences form
  (firm/affiliation, investor type single-select, stages
  multi-select, sectors multi-select, check-size range,
  geographic focus). Submit → `POST /api/v1/investor-profiles`,
  redirect to `/onboarding/done`.
- `app/onboarding/done/page.tsx` — single template; reads
  `session.user.role` and renders role-aware copy + CTA
  (founder → `/plan/<latest-passport-id>` if known else
  `/founder`; owner → `/companies/<picked-slug>/claim`;
  investor → `/map`).

Account settings:

- `app/settings/page.tsx` — single sectioned page (no tabs).
  Sections per `Auth.html#settings`:
  1. **Profile** — display name, email (change → re-verify),
     phone (optional), time zone (auto-detected). Save action
     PATCHes Better Auth user.
  2. **Security** — password change, list of active sessions
     ("Sign out other sessions"), connected accounts
     (Google linked stub), 2FA stub.
  3. **Role-specific** — depending on `session.user.role`:
     Founder Passport summary + "Edit passport" link to
     `/founder?settings=1` (or just inline edit; designer's
     choice), OR Investor preferences form (re-uses the
     onboarding form), OR Claimed companies list (re-uses
     the existing `/me/submissions` data, presented inline).
  4. **Notifications** — stub (Phase 5).
  5. **Agent tokens** — stub (Phase 5; distinct from the
     machine `X-Atlas-Admin-Token`).
  6. **Danger zone** — delete account (releases claimed
     companies; prompts confirmation).
  Sidebar rail mirrors the wireframe with a "Switch role" link
  near the bottom.

Ownership submission + edit:

- `app/companies/[slug]/claim/page.tsx` — submission form
  (signed-in only).
- `app/companies/[slug]/edit/page.tsx` — profile editor
  (gated on `companies.claimed_by_user_id === session.user.id`
  OR admin role).
- `app/companies/[slug]/_components/EditorForm.tsx`.
- `app/companies/[slug]/_components/AiDraftButton.tsx` — AI draft
  helper (same idea as the old claim editor).
- `app/me/submissions/page.tsx` — owner's view of their own
  pending/approved/rejected submissions.
- `app/api/v1/ownership-submissions/route.ts` — `POST` (owner
  creates submission with R2 upload), `GET` (owner lists their
  own submissions).
- `app/api/v1/ownership-submissions/[id]/route.ts` — `GET`
  (owner views their own; admin views any), `PATCH`
  (admin approves / rejects with notes; sets
  `companies.claimed_by_user_id` + `verified_at` + `claimed_at`
  on approve).
- `app/api/v1/companies/[slug]/route.ts` — add `PATCH`. Auth
  branches: (a) Better Auth session whose `user.id` matches
  `companies.claimed_by_user_id` (owner edit, field whitelist
  applied); (b) Better Auth session with admin role (no
  whitelist); (c) `X-Atlas-Admin-Token` machine token (no
  whitelist; assumes a privileged caller — used by CLI/MCP).
  Coordinate with Agent 4 — they own the GET.

Admin UI (GOEO-facing, role `goeo_admin` or `superadmin`):

- `app/admin/layout.tsx` — admin shell with the dark sidebar
  per `Auth.html#admin`. Nav groups (Overview · Moderation ·
  Content · People · System) per the wireframe. Gated by
  `middleware.ts`. No password input — if your session lacks the
  role, you're redirected to `/sign-in?next=/admin`.
- `app/admin/page.tsx` — **dashboard**. Stats row of 5 cards
  (USERS / COMPANIES / RESOURCES / CLAIM QUEUE / REPORTS) with
  real D1 counts + week-over-week deltas. Two-column body:
  claim-queue summary (top 4 pending submissions, link to full
  queue) + recent agent edits feed (top 4 from `profile_updates`,
  flagged with the originating client when present —
  claude.ai / chatgpt.com / staff). Coverage-gaps strip below
  the columns (county / sector / community / identity counts;
  placeholder data acceptable for Phase 4).
- `app/admin/submissions/page.tsx` — ownership-submission queue.
- `app/admin/submissions/[id]/page.tsx` — single-submission
  review with **two visual modes**:
  - **Auto-approvable** — domain match clean. One-click
    Approve, with a small "Reject" / "Need more info"
    affordance.
  - **Manual** — no domain match. Show claimant + company info
    blocks (per `Auth.html#admin` claim-review · manual panel),
    claimant note, optional LinkedIn lookup link, GOEO
    contact-on-file lookup, then Approve / Reject / Need more
    info actions with a notes textarea.
  Document preview: server-side, generate a 60-second signed R2
  URL for `r2_key` and embed in an `<iframe>` (PDF) or `<img>`
  (image).
- `app/admin/_components/UpdateReviewer.tsx` — pending
  `profile_updates` reviewer (used inside the dashboard's recent
  edits feed and on a dedicated audit-log page if scope allows).
- `app/admin/resources/page.tsx`, `[id]/page.tsx`,
  `_components/ResourceForm.tsx` — resource CRUD with status
  chips (live / stale / link-broken / draft) per `Auth.html#admin`.
- `app/admin/companies/page.tsx`, `[slug]/page.tsx` — direct
  company editor (no ownership requirement; admin role
  short-circuits the whitelist) with status chips
  (claimed / pending / unclaimed / flagged / duplicate).
- `app/admin/map/page.tsx` — map curation (same as before).
- `app/admin/users/page.tsx` — read = admin, role-flip =
  `superadmin`. Role-filter chips
  (`all · founder · owner · investor · admin`) with counts.
  Dropdown on each row flips between `owner` and `goeo_admin`.
  (You can't demote yourself; you can't promote anyone to
  `superadmin` from the UI — that's the bootstrap script's job.)
  Status chips (verified / pending / flagged) per the wireframe.
- `app/admin/admins/page.tsx` — **`superadmin` only**. Lists
  current admins (email, name, status, joined date) and a "+
  Invite admin" form. Submit writes a row to `admin_invites`
  (random token; store sha256 hash) and emails a one-time link
  via `lib/email.ts`. Consuming the link (via
  `GET /api/v1/admin/invites/:token` + a small landing page)
  flips the recipient's role to `goeo_admin` and marks the
  invite consumed.
- `app/api/v1/admin/users/[id]/route.ts` — `PATCH` for role
  change (superadmin-gated by middleware + a defense-in-depth
  check in the handler).
- `app/api/v1/admin/invites/route.ts` — `POST` (superadmin only;
  emits email + writes `admin_invites`), `GET` (superadmin
  only; lists invites with `consumed_at` status).
- `app/api/v1/admin/invites/[token]/route.ts` — `GET` consume
  (signed-in caller; one-shot — looks up by `token_hash`,
  flips role on the calling user if email matches and not yet
  consumed, sets `consumed_at`).
- `app/api/v1/investor-profiles/route.ts` — `POST` (signed-in;
  upserts by `user_id`), `GET` (signed-in; returns caller's
  own profile or 404).
- `app/api/v1/resources/route.ts`, `[id]/route.ts` — CRUD with
  admin-role check.
- `app/api/v1/companies/route.ts` — POST create with admin-role
  check (coordinate with Agent 4 if they need the GET first).
- `app/api/v1/companies/[slug]/route.ts` — DELETE with
  admin-role check.

Ops:

- `scripts/bootstrap-superadmin.ts` — one-shot script that takes
  an email argv and updates `user.role = 'superadmin'` in remote
  D1 (via wrangler's `d1 execute` or a tiny direct query).
  Wired through `npm run bootstrap-superadmin <email>`.

You DO touch `db/schema.ts` — but only to **add** two new tables
(`investor_profiles`, `admin_invites`). Better Auth tables and
`business_ownership_submissions` are frozen post-Agent-1; do not
touch them. Rebase against `main` before running
`npm run db:generate` to avoid migration-number collisions.

You do NOT touch:

- Existing Better Auth tables, `business_ownership_submissions`,
  or `companies.claimed_by_user_id` (frozen post-Agent-1).
- The map or company list endpoints (Agent 4).
- The recommend endpoint (Agent 2).

## Deliverables

### 1. `auth.ts` — full Better Auth config

Expand Agent 1's stub. Wire the Drizzle adapter to the real
request-bound D1 client (lazy — Better Auth runs inside a request
context). Enable email + password. Turn on the **`emailOTP`
plugin** with 6-digit code, 10-minute expiry, 30-second resend
cooldown — this becomes both the signup-verification path AND
the password-reset path. Hook the OTP send into `lib/email.ts`
(Resend). Keep the `role` `additionalFields` from the stub but
**widen the enum** to
`founder | owner | investor | goeo_admin | superadmin` and
**flip the default from `'owner'` to `'founder'`**. Magic-link
plugin + Google social provider stay off in Phase 4.

### 2. `lib/email.ts`

A thin Resend wrapper exposing `sendVerificationEmail` and
`sendPasswordResetEmail`. Reads `RESEND_API_KEY` from env.
Templates can be plain HTML — no React Email yet.

If `RESEND_API_KEY` is unset (dev / time-pressed), fall back to
`console.log`-ing the link. Do **not** crash the request.

### 3. Auth UI pages — three-step signup, single sign-in,
###    forgot/reset, sent

Each page calls `lib/auth-client.ts`. Tailwind + shadcn primitives,
brand tokens from Agent 7. Server-side error rendering. Visual
contract: `Auth.html#signup` (1.1, 1.2, 1.3), `Auth.html#login`
(2.1, 2.2, 2.3).

- `/sign-up` (step 1) — three role cards (founder default,
  owner, investor); Continue → `/sign-up/account`. The role pick
  threads forward via short-lived cookie (`next-step-state`) or
  signed query param.
- `/sign-up/account` (step 2) — full name, email, password
  (12+ chars w/ live strength bar), Terms checkbox. Phase-5
  stubs for "Continue with Google" and magic link. Submit:
  call `signUp.email` with the captured role; immediately
  request an OTP via the `emailOTP` plugin; redirect to step 3.
- `/sign-up/verify` (step 3) — 6-digit OTP entry, auto-advance
  on the 6th digit, expiry countdown chip, resend cooldown
  chip. Verify success → redirect to `/onboarding/{role}`.
- `/sign-in` — email + password + Remember + Forgot. Magic-link
  / Google buttons render as Phase-5 stubs. Success → `?next=`
  or `/`.
- `/forgot-password` — single email field + generic-confirmation
  copy ("If we have an account, we'll send a 6-digit code").
  Submit → POST `forgetPassword` (or the OTP send equivalent) →
  redirect to `/login/sent` (with mode=reset).
- `/reset-password` — OTP entry + new password. Uses the same
  OTP plugin verification.
- `/login/sent` — shared confirmation page. Phase 4 only renders
  the reset-code variant; Phase 5 also renders the magic-link
  variant.

### 4. `middleware.ts`

```ts
// pseudo
export async function middleware(req: NextRequest) {
  const session = await auth.getSession(req);

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!session) return redirect("/sign-in?next=" + req.nextUrl.pathname);
    if (!["goeo_admin", "superadmin"].includes(session.user.role)) {
      return redirect("/?error=forbidden");
    }
    if (req.nextUrl.pathname.startsWith("/admin/users")
        && session.user.role !== "superadmin") {
      return redirect("/admin?error=superadmin_only");
    }
  }

  if (req.nextUrl.pathname.match(/^\/companies\/[^/]+\/(claim|edit)/)) {
    if (!session) return redirect("/sign-in?next=" + req.nextUrl.pathname);
    // Ownership check happens in the route/page (DB lookup).
  }

  if (req.nextUrl.pathname.startsWith("/onboarding") ||
      req.nextUrl.pathname.startsWith("/settings")) {
    if (!session) return redirect("/sign-in?next=" + req.nextUrl.pathname);
  }
}
```

### 5. `POST /api/v1/ownership-submissions`

Owner-only (Better Auth session). Multipart upload. Behavior:

1. Validate the file: ≤ 10 MB, mime in
   `{application/pdf, image/png, image/jpeg, image/webp}`.
2. PUT the bytes to `OWNERSHIP_DOCS` R2 with key
   `submissions/${userId}/${submissionId}.${ext}`.
3. Insert a `business_ownership_submissions` row:
   `user_id`, `company_id`, `r2_key`, `mime_type`, `file_size`,
   `submitted_at = now`, `status = 'pending'`.
4. Return `{ submission_id, status }`.

### 6. `app/companies/[slug]/claim/page.tsx`

Form: company is preselected from the route. File upload input
(label: "Verification document — Secretary-of-State filing,
business license, EIN letter, or similar"). On submit, posts to
`/api/v1/ownership-submissions`. On success, redirect to
`/me/submissions` with a "thanks, awaiting review" banner.

If the user already has a `pending` submission for this company,
show its status instead of the form.

### 7. `PATCH /api/v1/ownership-submissions/:id`

Admin-only (`goeo_admin` or `superadmin`). Body:
`{ status: 'approved' | 'rejected', review_notes? }`. Behavior:

1. Load the submission. 404 if missing.
2. Update `status`, `reviewed_by_user_id`, `reviewed_at`,
   `review_notes`.
3. **If approved:** in the same DB transaction, set on the
   referenced company:
   - `claimed_by_user_id = submission.user_id`
   - `verified_at = now` (if not already set)
   - `claimed_at = now` (if not already set)
   - `last_updated_by = reviewer_user_id`,
     `last_updated_at = now`
4. Return the updated submission.

If the company already has a different `claimed_by_user_id`,
the admin should be warned in the UI before approving — but the
final decision is theirs (overrides allowed; this is a state
agency).

### 8. `PATCH /api/v1/companies/:slug` — three auth modes

Auth precedence (in order):

1. **Better Auth session** with `user.id ===
   companies.claimed_by_user_id` → owner edit. Apply the field
   whitelist (no changes to `slug`, `linkedin`, `address_text`,
   `verified_at`, `claimed_at`, `claimed_by_user_id`). Insert
   a `profile_updates` row (`reviewed_by_user_id = null` —
   reviewer is the GOEO admin if/when they audit).
2. **Better Auth session** with role `goeo_admin` or
   `superadmin` → admin edit. No whitelist. Insert a
   `profile_updates` row tagged with the admin's user id.
3. **`X-Atlas-Admin-Token` matches** `env.ATLAS_ADMIN_TOKEN` →
   machine edit. No whitelist (caller is privileged). Insert a
   `profile_updates` row with `reviewed_by_user_id = null`.

Anything else → 401.

### 9. Admin verification queue

`/admin/submissions` lists every submission with status
`pending` first (then approved/rejected, paginated).
`/admin/submissions/[id]` shows:

- Submission metadata (company name + slug, submitter email,
  submitted_at, file_size, mime_type).
- Document preview: server-side, generate a 60-second signed R2
  URL for `r2_key` and embed it in an `<iframe>` (PDF) or
  `<img>` (image).
- "Approve" button → confirmation dialog → PATCH with
  `status = 'approved'`.
- "Reject" button → notes textarea → PATCH with
  `status = 'rejected'` + notes.

### 10. `/admin/users` (superadmin only)

Table of every user with email, current role, and a dropdown
that PATCHes `/api/v1/admin/users/:id` to flip between `owner`
and `goeo_admin`. The current logged-in superadmin's row is
disabled (no self-demotion). No "promote to superadmin" option.

### 11. `scripts/bootstrap-superadmin.ts`

CLI script. Argv: `<email>`. Behavior:

1. Read `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` from
   `.env.local`.
2. Issue a `wrangler d1 execute` against the remote DB:
   `UPDATE user SET role = 'superadmin' WHERE email = ?`.
3. Print the affected row count.
4. If 0, exit non-zero.

This is the **only** way to mint a superadmin. Document it in
your PR description so the user knows to run it after the first
GOEO staff member signs up.

### 12. Resources / Companies admin pages

Same scope as the previous version of this brief — list, create,
edit, delete — except the auth gate is "session has admin role,"
not "knows the shared token." The single shared token is gone
from the human admin path entirely.

### 13. Onboarding pages (role-specific)

- **`/onboarding/founder`** — kicks the user into Agent 3's
  intake page in onboarding mode (with the stepper). Submitting
  the intake lands on `/onboarding/done`.
- **`/onboarding/owner`** — search the company index by name,
  website, or domain. Match list shows status (claimed /
  unclaimed / pending). Picking an unclaimed match continues
  into the existing claim flow. "Don't see your company?" leads
  to a "submit a request" CTA — for Phase 4 it's enough that
  the request reaches GOEO; the actual creation can happen via
  `/admin/companies`.
- **`/onboarding/investor`** — the preferences form: firm /
  affiliation, investor type, stages of interest, sectors of
  interest, check-size range, geographic focus. Saves to the
  investor profile and lands on `/onboarding/done`.
- **`/onboarding/done`** — one template, role-aware copy + CTA:
  founder → "See my 90-day plan"; owner → "Verify your domain";
  investor → "Open the map." Visual contract:
  `Auth.html#onboard` final pane.

### 14. Schema additions

Extend `db/schema.ts` with the two tables documented in
`docs/agent-tasks/agent-1-data.md` § Post-ship schema deltas
(`investor_profiles`, `admin_invites`) and generate the next
migration. Rebase before generating to avoid number collisions
(per `00-shared-context.md`).

Add a small seed file with three demo investor profiles (Pelion
Ventures / Salt Lake Angels / Kickstart Fund) tied to one new
investor user so the admin user table has a representative
investor row on day one.

### 15. `/settings` — single sectioned page

Visual contract: `Auth.html#settings`. Sections, in order:

1. **Profile** — display name, email (change re-verifies),
   phone (optional), time zone.
2. **Security** — password change, active sessions ("Sign out
   other sessions"), connected accounts and 2FA as Phase-5
   stubs.
3. **Role-specific** — depends on the user's current role:
   founder passport summary + edit, OR the investor preferences
   form, OR a claimed-companies list.
4. **Notifications** — Phase-5 stub.
5. **Agent tokens** — Phase-5 stub. Distinct from the machine
   `X-Atlas-Admin-Token`; this would be per-user scoped tokens
   that let Claude/ChatGPT update profiles the user owns.
6. **Danger zone** — delete account (releases claimed companies
   back to GOEO review).

The sidebar rail also exposes a "Switch role" link that flips
the user's role between `founder | owner | investor`.

### 16. Investor preferences endpoint

A small REST surface that backs the onboarding form and the
Settings investor section: write the caller's preferences, read
the caller's own preferences. Used in Phase 5 by the map for
filter chip defaults and a weekly cluster-brief email; in
Phase 4 just persistence.

### 17. Admin invites flow

`/admin/admins` (superadmin only) lists current admins and
exposes an "Invite admin" form. Submitting the form emails a
one-time link to the recipient; opening the link while signed
in (with the matching email) flips that user's role to
`goeo_admin` and marks the invite consumed. Invites expire,
are single-use, and never grant `superadmin` (that's the
bootstrap script's job).

### 18. Admin dashboard (`/admin` landing)

Visual contract: `Auth.html#admin` dashboard panel.

- **Stats row** — five cards with live counts: users,
  companies, resources, claim queue, reports. Week-over-week
  deltas where they're meaningful.
- **Claim queue summary** — top pending ownership submissions
  with a link to the full queue.
- **Recent agent edits feed** — most-recent profile updates,
  with the originating client surfaced when known
  (e.g. `claude.ai`, `chatgpt.com`, staff). Helps GOEO see the
  agent-native loop working.
- **Coverage gaps strip** — county / sector / community /
  identity placeholders for Phase 4. Phase 5 wires real
  surfaces here.

### 19. PR

Open a PR titled "Auth, onboarding, ownership verification, GOEO
admin" against `main` from `feat/auth-claim-admin`. Use the
`/ship` skill or the project's normal flow.

## DONE when

1. **Sign-up role select.** `/sign-up` lets you pick founder /
   owner / investor; default is founder; admin accounts are
   clearly not self-serve.
2. **6-digit OTP verification.** Verification mail arrives with
   a 6-digit code (or is logged to console when Resend is unset);
   wrong codes show an inline error; codes expire; resend is
   rate-limited.
3. **Sign-in.** Email + password works. The magic-link and
   Google buttons render visibly disabled (Phase-5 stubs).
4. **Forgot/reset.** `/forgot-password` returns the same
   confirmation regardless of whether the email is on file;
   `/reset-password` succeeds with the OTP.
5. **Founder onboarding.** Verifying as a founder lands on the
   intake page in onboarding mode (stepper visible); submit
   reaches `/onboarding/done` with founder copy + CTA.
6. **Owner onboarding.** Verifying as an owner lands on the
   search-and-claim shortcut; picking a company continues into
   the claim flow.
7. **Investor onboarding.** Verifying as an investor lands on
   the preferences form; submit persists the investor profile
   and lands on `/onboarding/done` with the "Open the map" CTA.
8. **`/onboarding/done`.** Shows the right copy + CTA for each
   role.
9. **`/settings`.** Renders the Profile + Security + role-specific
   + Notifications + Agent tokens + Danger zone sections per the
   wireframe; profile edits save; Phase-5 stubs are clearly
   labeled.
10. **Bootstrap a superadmin.** Running the bootstrap script
    against a signed-up user lets them into `/admin/*` on next
    sign-in.
11. **Owner submission flow.** Fresh owner uploads a verification
    doc → `/me/submissions` shows a pending row.
12. **Admin approval flow.** Superadmin opens the queue, views
    the document via a short-lived signed URL, approves; the
    company gets the new owner stamped on it.
13. **Owner edit + propagation.** The owner can edit the company;
    the website, the markdown card, and the JSON endpoint all
    reflect the change.
14. **`/admin` dashboard.** Renders the five stat cards with real
    counts, the claim-queue summary, and the recent agent edits
    feed.
15. **`/admin/users`.** Filters by role
    (founder · owner · investor · admin) with correct counts.
    Superadmin can flip a user between owner and goeo_admin.
16. **`/admin/admins`.** Superadmin can invite a new admin via
    email; opening the invite link flips that user's role.
17. **`/admin/resources` and `/admin/companies`.** Full CRUD
    works (role-gated, no shared-token prompt).
18. **Machine token still works.** Writes from the CLI / MCP
    using `X-Atlas-Admin-Token` continue to succeed.
19. **Mobile (375px).** Every shipped surface — signup steps,
    OTP entry, sign-in, forgot/reset, onboarding (all three
    roles), `/onboarding/done`, `/settings`, claim/upload, owner
    edit, `/me/submissions`, and every admin page — works
    without horizontal scroll. The document preview on
    `/admin/submissions/[id]` scrolls inside its container, not
    the page.
20. PR open.

## Demo path

**Scene 4 (business owner as website)**: sign up as a founder,
upload a business license, switch to a logged-in admin tab,
approve. Switch back, edit the company, show the website AND
the .md AND the API endpoint all updating from the same source
of truth. The "approve" click is the punchline of the
verification story.

## Cuts allowed if time-pressed (in priority order)

The investor type is **production scaffolding**, not a demo
gate — its drops come first because cutting any of them doesn't
damage the five demo scenes.

1. **Drop the coverage-gaps strip** on `/admin`.
2. **Drop the stats row** on `/admin`.
3. **Drop `/admin/admins`** — promote admins via the bootstrap
   script + manual SQL.
4. **Drop investor onboarding persistence** — collect the form
   inputs but don't write `investor_profiles`. Map
   personalization is Phase 5 anyway.
5. **Drop `/onboarding/investor` entirely** — investor users
   land on `/onboarding/done` immediately.
6. **Drop role select on signup** — default everyone to
   `founder` and skip role-specific onboarding branches.
7. **Drop `/settings`** — replace with a minimal profile-edit
   form (display name + email).
8. **Drop the email-OTP plugin** — fall back to Better Auth's
   default link-based verification. The wireframe matches less
   well, but auth still works.
9. **Drop email verification as a hard gate.** New accounts get
   a session immediately; the verification mail still goes out
   but isn't required.
10. **Drop the AI draft button** on the edit page.
11. **Drop `/admin/map`.**
12. **Drop the `profile_updates` review tab** — owner edits
    apply directly.
13. **Collapse admin to submissions queue + resources CRUD.**
    Drop `/admin/companies` and `/admin/users`. Keep
    `/admin/submissions` (the headline) and resources CRUD.
14. **Last resort: cosmetic-only ownership upload** — the upload
    form lands on a "thanks, your submission is pending review"
    page that doesn't actually persist. The demo says "this
    WOULD update everywhere" without actually doing it.

## Common pitfalls

- **PATCH route handler conflict.** Agent 4 owns the GET on
  `app/api/v1/companies/[slug]/route.ts` — add the PATCH method
  to the **same file** (coordinate via PR).
- **Better Auth + Workers** — pass the request-bound D1 client
  lazily. Don't construct a top-level Drizzle client in
  `auth.ts`; do it inside a factory that runs per request.
- **Web Crypto, not Node bcrypt** — Better Auth uses Web Crypto
  by default on Workers; don't reach for `bcryptjs` or
  `node:crypto`.
- **R2 signed URLs from Workers** — use the `OWNERSHIP_DOCS`
  binding's `createPresignedUrl`-equivalent (or the S3-compat
  endpoint via aws4fetch). Cap expiry at 60–120 seconds —
  these documents are sensitive.
- **Role check defense-in-depth** — middleware-only checks are
  not enough. Re-check the role inside every admin route
  handler. Middleware can be bypassed by misconfigured
  matchers; route handlers must self-defend.
- **`profile_updates.submission_id`** — only set when the patch
  came from an owner edit on a claimed company. Admin direct
  edits leave it `null`.
- **Don't break Agent 4's profile page** — your PATCH must
  update the same row Agent 4's GET reads from.
- **Don't break the machine token path** — the CLI and MCP both
  rely on `X-Atlas-Admin-Token` continuing to work for writes.
  Agent 6 will be unhappy if you remove it.
