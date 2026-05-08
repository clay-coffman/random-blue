# Agent 5 — Claim flow + GOEO Admin UI

You build two surfaces:

1. **Founder claim flow** — founders claim their company, edit
   their profile, admin reviews their pending edits.
2. **GOEO admin UI** — Utah Startup State / GOEO staff log in (mock
   auth) and directly maintain resources, companies, and the map
   without a developer.

The claim half is **cosmetic-acceptable** if time runs short — a
non-functional submit that goes to a "thanks" screen is fine. The
admin half is required for the demo narrative ("the state can
maintain this without us"), but its scope can collapse to
**resources-only CRUD** if needed (see Cuts).

Aim for ~120 minutes. If you hit 90 and aren't through the admin
half, take Cut #1.

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

Claim flow:

- `app/claim/page.tsx` — claim entry (slug + email).
- `app/claim/[token]/page.tsx` — profile editor (after magic link).
- `app/claim/_components/EditorForm.tsx`.
- `app/claim/_components/AiDraftButton.tsx` — generates a draft
  from existing company fields.
- `app/api/v1/companies/claim/route.ts` — POST.
- `app/api/v1/companies/[slug]/route.ts` — PATCH (with
  `X-Atlas-Admin-Token`). NB: the GET handler is Agent 4's;
  add the PATCH method to the same file (coordinate with Agent 4).

Admin UI (GOEO-facing):

- `app/admin/layout.tsx` — admin shell with nav (Pending edits •
  Resources • Companies • Map) + token gate.
- `app/admin/page.tsx` — landing / pending-edits review.
- `app/admin/_components/AdminGate.tsx` — password input compared
  to `ATLAS_ADMIN_TOKEN`; sets a session cookie so child pages
  don't re-prompt.
- `app/admin/_components/UpdateReviewer.tsx` — pending
  `profile_updates` reviewer.
- `app/admin/resources/page.tsx` — resource list + create.
- `app/admin/resources/[id]/page.tsx` — resource editor.
- `app/admin/resources/_components/ResourceForm.tsx`.
- `app/admin/companies/page.tsx` — company list + create.
- `app/admin/companies/[slug]/page.tsx` — direct company editor
  (no claim flow required).
- `app/admin/map/page.tsx` — lightweight map of companies with
  "fix coordinates" / "hide" actions per pin.
- `app/api/v1/resources/route.ts` — GET list + POST create. (No
  one else currently owns this file; Agent 2 owns only the
  `recommend/` sub-route. The list endpoint is referenced by
  `/agents` and `llms.txt` so build the GET too — keep it simple:
  paginate with `?limit=&offset=`, allow `?kind=` filter.)
- `app/api/v1/resources/[id]/route.ts` — GET, PATCH, DELETE.
- `app/api/v1/companies/route.ts` — GET list + POST create.
  (Coordinate with Agent 4 if they need the GET first; otherwise
  you own this file.)
- `app/api/v1/companies/[slug]/route.ts` — DELETE (soft-delete via
  `archived_at` if schema supports it; otherwise hard delete is
  fine for the hackathon).

All admin write endpoints require `X-Atlas-Admin-Token`. The admin
UI fetches with the token attached server-side via a small helper
that reads the session cookie and re-injects the env token.

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

### 5. `app/admin/*` — GOEO admin UI

Persona: Utah GOEO / Startup State staff. They need to keep the
resource directory, company list, and map current without filing a
GitHub issue. Mock auth only.

**Auth shell (`AdminGate` + `app/admin/layout.tsx`).** Password
input compared to `ATLAS_ADMIN_TOKEN`. On match, set an HttpOnly
session cookie (`atlas_admin=1`, 8h expiry). The layout reads the
cookie server-side and renders the nav; otherwise renders the
gate. Not real auth — just a bouncer for the demo.

**Nav tabs (in this priority order):**

1. **Pending edits** (`/admin`) — the existing pending
   `profile_updates` reviewer. For each row: company name + slug,
   diff preview, "Approve" / "Reject" buttons (demo: both just
   close the row), last-updated/verified timestamps.
2. **Resources** (`/admin/resources`) — table of all resources
   with title, kind, last_updated_at, and Edit/Delete buttons.
   "+ New resource" button → `/admin/resources/new`. Editor form
   covers all fields owned by `resources` + the join tables
   (locations, industries, communities, topics) — render the
   joins as multi-selects or comma-separated chips. Save calls
   `POST /api/v1/resources` (create) or
   `PATCH /api/v1/resources/:id` (edit).
3. **Companies** (`/admin/companies`) — table of all companies
   with name, slug, sector, stage, last_updated_at, Edit/Delete.
   "+ New company" → `/admin/companies/new`. Editor mirrors the
   founder claim editor but with **no field whitelist** — gov
   staff can change `slug`, `address`, `linkedin`, `verified_at`,
   etc. Save calls `PATCH /api/v1/companies/:slug` with the admin
   token; the PATCH handler must branch on a query flag (e.g.
   `?as=admin`) or a separate route segment to skip the founder
   whitelist when the caller is gov.
4. **Map** (`/admin/map`) — embeds Agent 4's `MapView` in a
   read-mostly mode with a click handler: clicking a pin opens a
   side panel with "Edit" (deep-link to
   `/admin/companies/[slug]`), "Fix coordinates" (lat/lng inputs
   that PATCH the row), and "Hide" (sets `archived_at` /
   `hidden=true` if the schema supports it; otherwise no-op
   button labeled "(coming soon)").

**Surface APIs needed for the above** (all require admin token):

- `POST /api/v1/resources` — create.
- `PATCH /api/v1/resources/:id` — update.
- `DELETE /api/v1/resources/:id` — delete.
- `POST /api/v1/companies` — create.
- `DELETE /api/v1/companies/:slug` — delete (soft if possible).
- `PATCH /api/v1/companies/:slug?as=admin` — full-field update
  (no whitelist). Without `as=admin`, behaves as the founder
  PATCH from §4 above.

### 6. PR

```bash
git add app/claim app/admin app/api/v1/companies/claim app/api/v1/resources app/api/v1/companies
git commit -m "feat(claim): self-service claim + GOEO admin UI"
git push -u origin feat/claim
gh pr create --base main --title "Claim flow + GOEO admin UI"
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
9. `/admin/resources` lists all seeded resources; you can create a
   new one, edit an existing one's title/description, and delete
   one — all reflected in `GET /api/v1/resources` immediately.
10. `/admin/companies` lists all seeded companies; you can edit
    any company directly (no claim flow) and the change shows up
    on `/startups/:slug` and the map without a redeploy.
11. `/admin/map` renders the map; clicking a pin opens a side
    panel with at least an "Edit" link to the admin company
    editor.
12. The admin-token gate works: visiting `/admin` without the
    cookie shows the password screen; submitting the wrong token
    re-prompts.
13. PR open.

## Demo path

**Scene 4 (business owner as website)**: claim Crew, update hiring
status, show the website AND the .md AND the API endpoint all
updating from the same source of truth.

## Cuts allowed if time-pressed (in priority order)

1. **Collapse admin to resources-only CRUD + pending edits.** Drop
   `/admin/companies` and `/admin/map`. The demo narrative still
   works: "GOEO maintains the resource directory; founders
   maintain their own company pages via claim." This is the
   single biggest budget saver.
2. **Skip `/admin/map` only.** Keep resources + companies CRUD.
   The map page is the most expensive piece because it reuses
   Agent 4's component with custom click handling.
3. **Skip the AI draft button.** The editor still works without it.
4. **Skip the magic-link two-step.** Make claim → editor a single
   page with email entry → immediate edit (no token round-trip).
5. **Skip company create/delete in admin.** Edit-only is enough
   to show "gov can fix typos / update stages."
6. **Skip the pending-edits review tab.** If founders' edits
   apply directly (no review), `/admin` redirects to
   `/admin/resources`. Acceptable for demo.
7. **Cosmetic-only claim:** the "Submit" button on the founder
   editor goes to a "thanks, your update is pending review" page
   that doesn't actually persist. Agent 4's profile page still
   shows the pre-claim data. **The demo says "this WOULD update
   everywhere" without actually doing it.** Acceptable if
   time-pressed — but note the GOEO admin UI is now the
   load-bearing surface, not the claim flow.
8. **Skip domain verification entirely.** Accept any email.

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
