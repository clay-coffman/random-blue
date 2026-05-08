# Agent 5 — Auth, ownership verification, GOEO admin

You build three surfaces:

1. **Authentication** — Better Auth (email + password) for two
   real user types: business **owners** and Utah Startup State /
   GOEO **admins**. Sign-up, sign-in, email verification, password
   reset.
2. **Founder claim flow with real ownership verification** —
   founders sign up, upload a verification document to R2,
   admin reviews and approves, owner can edit their company.
3. **GOEO admin UI** — staff log in (same Better Auth, with role
   `goeo_admin` or `superadmin`) and maintain the
   ownership-submission queue, the resource directory, the
   company list, and the map without a developer.

The admin half is required for the demo narrative ("the state can
maintain this without us"). The owner-edit half is the headline
"business owners are the website" demo. The auth UI itself is
plumbing — it has to work but doesn't need design polish.

Aim for **~150 minutes** (this brief grew to absorb auth). If you
hit ~120 minutes and aren't through the admin half, take Cut #1.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 2).
- **Branch:** `feat/auth-claim-admin`. First action:
  `git checkout -b feat/auth-claim-admin`.

## Reads first

1. `docs/agent-tasks/00-shared-context.md` — § "Auth-for-write
   (dual model)" and "Auth schema ownership".
2. `docs/architecture.md` — repo layout, dual-auth bindings, and
   the OWNERSHIP_DOCS R2 binding.
3. `docs/requirements.md` — Authentication, Self-service claim
   flow, GOEO admin UI.
4. `docs/hackathon-plan.md` — § "Authentication & ownership
   verification".
5. `db/schema.ts` — `user` (with `role`), `session`, `account`,
   `verification`, `business_ownership_submissions`,
   `companies` (now with `claimed_by_user_id`), `profile_updates`
   (Agent 1 owns).
6. `auth.ts` — the stub Agent 1 wrote. You expand it.
7. Better Auth docs (via `context7`):
   <https://www.better-auth.com/docs>.
8. `app/startups/[slug]/page.tsx` (Agent 4) — to know the
   "Claim this company" button.

## Depends on

- **Agent 0 done.** Need: `better-auth` + `@better-auth/cli` +
  `resend` installed; `OWNERSHIP_DOCS` R2 binding;
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`,
  `ATLAS_ADMIN_TOKEN` secrets set; `bootstrap-superadmin` script
  hook in `package.json`.
- **Agent 1 done.** Need: Better Auth tables, ownership
  submissions table, `companies.claimed_by_user_id`. The old
  `company_claims` table must be gone.
- **Agent 4 in progress or done.** You wire your "Claim" button
  to Agent 4's profile page and re-use their `MapView`.

## Owns (write surface)

Auth wiring:

- `auth.ts` — full Better Auth config (expanded from Agent 1's
  stub). Hooks `lib/email.ts` for verification + reset mail.
  Configures the role plugin / additional fields. Reads the
  request-bound D1 client from `lib/cf.ts`.
- `lib/auth-client.ts` — Better Auth React client for the
  browser.
- `lib/email.ts` — thin Resend wrapper used by Better Auth's
  email-verification + password-reset hooks.
- `middleware.ts` — Next.js middleware that gates `/admin/*` on
  `goeo_admin | superadmin` roles, gates `/companies/[slug]/edit`
  on ownership match, and gates `/companies/[slug]/claim` on
  any signed-in user.
- `app/api/auth/[...all]/route.ts` — Better Auth's catch-all
  handler (it serves sign-up, sign-in, etc.).
- `app/sign-in/page.tsx`, `app/sign-up/page.tsx`,
  `app/verify-email/page.tsx`, `app/forgot-password/page.tsx`,
  `app/reset-password/page.tsx` — minimal but functional. Use
  shadcn primitives.

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

- `app/admin/layout.tsx` — admin shell with nav (Submissions •
  Pending edits • Resources • Companies • Map • Users) gated by
  `middleware.ts`. No password input — if your session lacks the
  role, you're redirected to `/sign-in?next=/admin`.
- `app/admin/page.tsx` — landing / pending-edits review.
- `app/admin/submissions/page.tsx` — ownership-submission queue.
- `app/admin/submissions/[id]/page.tsx` — review one submission:
  show metadata, fetch a short-lived signed R2 URL for the
  document, render in an `<iframe>`/`<img>`, approve/reject
  buttons + a notes textarea.
- `app/admin/_components/UpdateReviewer.tsx` — pending
  `profile_updates` reviewer.
- `app/admin/resources/page.tsx`, `[id]/page.tsx`,
  `_components/ResourceForm.tsx` — resource CRUD (same as before).
- `app/admin/companies/page.tsx`, `[slug]/page.tsx` — direct
  company editor (no ownership requirement; admin role
  short-circuits the whitelist).
- `app/admin/map/page.tsx` — map curation (same as before).
- `app/admin/users/page.tsx` — **`superadmin` only**. Lists
  every user with current role and a dropdown to switch between
  `owner` and `goeo_admin`. (You can't demote yourself; you
  can't promote anyone to `superadmin` from the UI — that's the
  bootstrap script's job.)
- `app/api/v1/admin/users/[id]/route.ts` — `PATCH` for role
  change (superadmin-gated by middleware + a defense-in-depth
  check in the handler).
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

You do NOT touch:

- `db/schema.ts`.
- The map or company list endpoints (Agent 4).
- The recommend endpoint (Agent 2).

## Deliverables

### 1. `auth.ts` — full Better Auth config

Expand Agent 1's stub. Wire the Drizzle adapter to the real
request-bound D1 client (lazy — Better Auth runs inside a request
context). Enable email + password. Set up email-verification and
password-reset hooks that call `lib/email.ts` (Resend). Keep the
`role` `additionalFields` from the stub.

### 2. `lib/email.ts`

A thin Resend wrapper exposing `sendVerificationEmail` and
`sendPasswordResetEmail`. Reads `RESEND_API_KEY` from env.
Templates can be plain HTML — no React Email yet.

If `RESEND_API_KEY` is unset (dev / time-pressed), fall back to
`console.log`-ing the link. Do **not** crash the request.

### 3. Auth UI pages

Minimal but real. Each page calls `lib/auth-client.ts`. shadcn
primitives. Server-side error rendering. After sign-up, redirect
to `/verify-email`. After successful sign-in, redirect to
`?next=` (or `/`).

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

### 13. PR

```bash
git add auth.ts middleware.ts lib/auth-client.ts lib/email.ts \
        app/sign-in app/sign-up app/verify-email \
        app/forgot-password app/reset-password \
        app/companies app/me app/admin \
        app/api/auth app/api/v1/ownership-submissions \
        app/api/v1/companies app/api/v1/resources \
        app/api/v1/admin scripts/bootstrap-superadmin.ts
git commit -m "feat(auth): Better Auth + ownership verification + GOEO admin"
git push -u origin feat/auth-claim-admin
gh pr create --base main --title "Auth, ownership verification, GOEO admin"
```

## DONE when

1. **Sign-up + sign-in:** `/sign-up` creates an `owner` user;
   `/sign-in` returns a session cookie. Email verification mail
   arrives (or is logged to console if Resend is unset).
2. **Bootstrap a superadmin:**
   `npm run bootstrap-superadmin -- you@example.com` flips that
   user's role; signing in lands you on `/admin/*` without a
   redirect.
3. **Owner submission flow:** sign in as a fresh owner,
   visit `/companies/crew/claim`, upload a PDF → `/me/submissions`
   shows a `pending` row.
4. **Admin approval flow:** sign in as the superadmin, visit
   `/admin/submissions`, open the new submission, view the
   document via the signed R2 URL, click Approve. The submission
   row flips to `approved`; `companies.claimed_by_user_id` is
   set; `verified_at` + `claimed_at` are stamped.
5. **Owner edit:** the original owner can now visit
   `/companies/crew/edit` and `PATCH /api/v1/companies/crew`
   succeeds with their session cookie. The whitelist blocks
   changes to `slug`, `linkedin`, `address_text`.
6. **`/admin` shows the pending update** in the
   `profile_updates` reviewer.
7. **`/startups/crew`, `/startups/crew.md`, `/api/v1/companies/crew`**
   all reflect the owner's edit (Agent 4's reads are unchanged).
8. **`/admin/resources`** — full CRUD works (role-gated; no
   token prompt).
9. **`/admin/companies`** — admin can edit any company directly
   (no whitelist).
10. **`/admin/map`** — pin → side panel → "Edit" deep-link
    works.
11. **`/admin/users`** (superadmin) — flipping a user from
    `owner` to `goeo_admin` lets them into `/admin/*` on next
    sign-in.
12. **Machine token still works:**
    `curl -H "X-Atlas-Admin-Token: $ATLAS_ADMIN_TOKEN" -X PATCH
     https://<worker>/api/v1/companies/crew -d '{...}'`
    succeeds without a session. (Used by Agent 6's CLI/MCP.)
13. **Mobile (375px):** sign-up, sign-in, claim/upload, owner
    edit, `/me/submissions`, `/admin/submissions`,
    `/admin/submissions/[id]`, `/admin/users`, and every other
    admin page work without horizontal scroll. Document preview
    on `/admin/submissions/[id]` scrolls **inside** its container,
    not the page. Verified with
    `mcp__playwright__browser_resize`.
14. PR open.

## Demo path

**Scene 4 (business owner as website)**: sign up as a founder,
upload a business license, switch to a logged-in admin tab,
approve. Switch back, edit the company, show the website AND
the .md AND the API endpoint all updating from the same source
of truth. The "approve" click is the punchline of the
verification story.

## Cuts allowed if time-pressed (in priority order)

1. **Collapse admin to submissions queue + resources CRUD.**
   Drop `/admin/companies`, `/admin/map`, `/admin/users`. Keep
   `/admin/submissions` (the new headline) and resources CRUD
   (the prior demo). Ownership flow is the load-bearing demo
   surface.
2. **Skip `/admin/users`.** Bootstrap script + manual
   `wrangler d1 execute` for role flips is fine for the
   hackathon.
3. **Skip the AI draft button** on the edit page. The editor
   still works without it.
4. **Skip email verification** as a hard gate. New accounts can
   submit immediately; the verification link still gets sent
   (or logged) but isn't required to use the app.
5. **Skip `/admin/map`.**
6. **Skip the `profile_updates` review tab** — owner edits
   apply directly, no admin review.
7. **Cosmetic-only ownership upload:** the upload form goes to
   a "thanks, your submission is pending review" page that
   doesn't actually persist. **The demo says "this WOULD update
   everywhere" without actually doing it.** Acceptable only as a
   last resort — note the GOEO admin UI is now the load-bearing
   surface.

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
