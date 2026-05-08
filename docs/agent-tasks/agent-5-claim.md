# Agent 5 — Claim flow + Admin

You build the self-service claim experience: founders claim their
company, edit the profile, and the admin reviews. This is
**cosmetic-acceptable** if time runs short — a non-functional submit
that goes to a "thanks" screen is fine. Aim for ~90 minutes.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 2).
- **Branch:** `feat/claim`. First action: `git checkout -b feat/claim`.

## Reads first

1. `docs/agent-tasks/00-shared-context.md`
2. `docs/architecture.md`
3. `docs/requirements.md` — Self-service claim flow.
4. `docs/hackathon-plan.md` lines 401–444 (claim + profile editor).
5. `db/schema.ts` — `company_claims`, `profile_updates`,
   `companies` tables (Agent 1 owns).
6. `app/startups/[slug]/page.tsx` (Agent 4) — to know the
   "Claim this company" button.

## Depends on

- **Agent 1 done.** You need `company_claims` and `profile_updates`
  tables.
- **Agent 4 in progress or done.** You wire your "Claim" button to
  Agent 4's profile page.
- **Agent 0 done** for shadcn primitives.

## Owns (write surface)

- `app/claim/page.tsx` — claim entry (slug + email).
- `app/claim/[token]/page.tsx` — profile editor (after magic link).
- `app/claim/_components/EditorForm.tsx`.
- `app/claim/_components/AiDraftButton.tsx` — generates a draft
  from existing company fields.
- `app/admin/page.tsx` — admin tab.
- `app/admin/_components/UpdateReviewer.tsx`.
- `app/api/v1/companies/claim/route.ts` — POST.
- `app/api/v1/companies/[slug]/route.ts` — PATCH (with
  `X-Atlas-Admin-Token`). NB: the GET handler is Agent 4's;
  add the PATCH method to the same file (coordinate with Agent 4).

You do NOT touch:

- `db/schema.ts`.
- The map or company list endpoints.

## Deliverables

### 1. `POST /api/v1/companies/claim`

Request: `{ slug, email }`. Behavior:

1. Look up the company by slug.
2. Compare `email`'s domain to the company `website` domain
   (strip `https://`, `www.`). Match → proceed. Mismatch →
   return `403` with `{ error: { code: 'domain_mismatch', … } }`.
3. Insert a `company_claims` row with:
   - `magic_token`: random 32-char string (use
     `crypto.randomUUID()` or `lib/ids.ts` style).
   - `expires_at`: now + 60 minutes.
   - `status`: `pending`.
4. Return `{ claim_id, magic_link: '/claim/<token>' }` — for the
   hackathon, **expose the magic link directly in the response**
   (no email sending). Show it on the page so the demo works.

### 2. `app/claim/page.tsx`

Form: slug (prefilled from `?slug=` query param) + email. Submits
to `/api/v1/companies/claim`. On success, displays the magic link
prominently and explains "in a real product, this would be emailed.
For demo purposes, click here:". Use shadcn primitives.

### 3. `app/claim/[token]/page.tsx` — profile editor

1. Server-side: look up the claim by `magic_token`. If expired or
   missing, render an "expired" state.
2. Render a `EditorForm` with all editable fields: description,
   stage, employee_count, hiring_status, sector, founder/team,
   address, jobs.
3. **AI draft** button: calls Anthropic to generate a draft
   description / who-should-contact-us / what-this-company-sells
   from existing fields. Displays the diff. Founder approves or
   edits.
4. On save, POST to `PATCH /api/v1/companies/:slug`.

### 4. `PATCH /api/v1/companies/:slug`

Auth: requires `X-Atlas-Admin-Token` header matching
`env.ATLAS_ADMIN_TOKEN`. The editor includes the token in its
fetch (read from `.env.local` server-side).

1. Load the company.
2. Apply the patch (whitelist fields — never let the user change
   `slug`, `address`, `linkedin`, `verified_at`).
3. Insert a `profile_updates` row recording the patch and the
   `claim_id`.
4. Update `companies.last_updated_at`, `companies.last_updated_by`.
5. Return the updated company.

### 5. `app/admin/page.tsx` — admin tab

Lists pending `profile_updates` with:

- Company name + slug.
- Diff preview.
- "Approved" / "Reject" buttons (for demo, both just close the
  row — no real review workflow).
- "Last updated" / "Verified" timestamps.

Auth: gated behind a simple password input that compares to
`ATLAS_ADMIN_TOKEN`. Not real auth — just a bouncer for the demo.

### 6. PR

```bash
git add app/claim app/admin app/api/v1/companies/claim
git commit -m "feat(claim): self-service claim + editor + admin tab"
git push -u origin feat/claim
gh pr create --base main --title "Claim flow + admin"
```

## DONE when

1. From `/startups/crew`, click "Claim this company" → lands on
   `/claim?slug=crew`.
2. Submit with `founder@trycrew.com` (or any email matching the
   company's website domain) → returns the magic link.
3. Click the magic link → editor renders with the company's
   current fields prefilled.
4. Click "Generate AI draft" → Anthropic returns a polished
   description.
5. Save changes → `PATCH /api/v1/companies/crew` succeeds.
6. Reload `/startups/crew` → shows the updated description.
7. `/startups/crew.md` and `/startups/crew.json` reflect the
   update (because Agent 4's `lib/company-card.ts` reads from
   the live row).
8. `/admin` shows the pending update.
9. PR open.

## Demo path

**Scene 4 (business owner as website)**: claim Crew, update hiring
status, show the website AND the .md AND the API endpoint all
updating from the same source of truth.

## Cuts allowed if time-pressed (in priority order)

1. **Skip the AI draft button.** The editor still works without it.
2. **Skip the admin tab.** Drop `/admin` entirely.
3. **Skip the magic-link two-step.** Make claim → editor a single
   page with email entry → immediate edit (no token round-trip).
4. **Cosmetic only:** the "Submit" button on the editor goes to a
   "thanks, your update is pending review" page that doesn't
   actually persist. Agent 4's profile page still shows the
   pre-claim data. **The demo says "this WOULD update everywhere"
   without actually doing it.** Acceptable if time-pressed.
5. **Skip domain verification entirely.** Accept any email.

## Common pitfalls

- **PATCH route handler conflict.** Agent 4 owns the GET route at
  `app/api/v1/companies/[slug]/route.ts` — add the PATCH method
  to the **same file** (coordinate with Agent 4 via PR).
- **Magic-link tokens on Workers** — use `crypto.randomUUID()` or
  the Web Crypto API. No `node:crypto`.
- **Admin token in front-end fetch** — only safe because we're
  treating this as mock auth. Don't expose this token publicly,
  but don't burn time on real auth either.
- **`profile_updates` table** — log every patch even if the
  admin tab is skipped. Useful for demo scripting.
- **Don't break Agent 4's profile page** — your PATCH must update
  the same row Agent 4's GET reads from.
