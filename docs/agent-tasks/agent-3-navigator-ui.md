# Agent 3 — Founder Navigator UI

You build the highest-scoring user-facing surface: the founder
intake → personalized plan flow. Polish matters here. Aim for ~120
minutes — this is the live product's primary entry point. Real
founders will land here on https://startup.utah.gov/.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 1).
- **Branch:** `feat/navigator`. First action:
  `git checkout -b feat/navigator`.

## Reads first

1. `docs/implementation-plan.md` — your phase + coordination matrix
   (you depend on Agent 7's layout + persona contract, plus Agent 2
   for real recommendations).
2. `docs/agent-tasks/00-shared-context.md`.
3. `docs/architecture.md` — repo layout.
4. `docs/requirements.md` — Founder Passport intake.
5. `docs/product-plan.md` lines 39–82 (intake fields), lines
   449–470 (Jordan + Priya flows).
6. **`docs/source_data/page-2026-05-08-19-38-24.md`** — the canonical
   GOED brief; verbatim persona descriptions (§ Test Cases).
7. `design/startup-state-atlas-wireframes/project/wireframes/v2/intake.js`
   (chosen direction: Variant D, two-pane form + live passport JSON)
   and `design/.../v2/plan.js` (chosen: Variant A, Now / Next /
   Ignore columns; complement: Variant D printable memo). Read
   HTML/CSS — don't render.
8. `types/api.ts` — `RecommendRequest`, `RecommendResponse`,
   `RecommendedResource` (Agent 2 produces these).
9. `db/seed/personas.ts` — the canonical persona IDs (matches
   Agent 7's `lib/personas.ts`).
10. `app/api/v1/resources/recommend/route.ts` — the endpoint shape
    (Agent 2 owns).

## Depends on

- **Agent 1 done.** You need `founder_passports` populated with the
  6 personas so the "Try Jordan" buttons work. The personas are
  seeded from the GOED brief (verbatim descriptions in
  `docs/source_data/page-2026-05-08-19-38-24.md`).
- **Agent 7 done (or in flight).** You consume `app/layout.tsx`
  (root nav + footer), brand tokens (paper/ink/ember theme), and
  `lib/personas.ts` (the typed persona list — your `PersonaButtons`
  is just rendering of it). The persona-tile click contract from
  Agent 7's hero is: tile links to `/founder?persona=<id>`. Your
  `/founder` page reads the query param and either prefills the form
  or routes straight to `/plan/fp_<id>`. If Agent 7 hasn't merged,
  hardcode persona names locally and rebase later.
- **Agent 2 done (or scaffolded).** You need
  `POST /api/v1/resources/recommend` returning real data. If
  Agent 2 isn't done, mock the response from `types/api.ts` and
  swap the fetch URL when Agent 2 lands.
- **Agent 0 done.** shadcn primitives must be installed.

## Owns (write surface)

- `app/founder/page.tsx` — intake landing.
- `app/founder/_components/IntakeForm.tsx` — client component.
- `app/founder/_components/PersonaButtons.tsx` — quick-test row
  (mirrors Agent 7's hero-page persona tiles; same `lib/personas.ts`
  source).
- `app/plan/[id]/page.tsx` — saved plan / results page (server
  component, fetches via `GET /api/v1/founder-passports/[id]/plan`).
  **Shareable URL** — clean and production-ready.
- `app/plan/_components/ResultsView.tsx` — Do Now / Do Next /
  Ignore display + "Why this matched" detail.
- `app/plan/_components/ShareLink.tsx` — copy-to-clipboard share.
- Tailwind tweaks if needed.

You do NOT touch:

- `app/api/v1/...` route handlers (Agent 2).
- `app/map/...` (Agent 4).
- `db/schema.ts`.

## Onboarding hook (Agent 5 coordination)

The `/founder` page does double duty as the founder-onboarding
target for Agent 5's signup flow. When a freshly-signed-up user
with `role='founder'` finishes verification, Agent 5 redirects
them to `/onboarding/founder`, which is itself a server-side
redirect to `/founder?onboard=1`.

When `?onboard=1` is set:

- Render a stepper above the form: `1 role · 2 account · 3 intake`,
  with step 3 active. Visual reference: `Auth.html#signup` stepper.
- Submitting the intake redirects to `/onboarding/done` (which
  reads `session.user.role` to render the founder-flavored
  copy and CTA `See my 90-day plan →` linking to
  `/plan/<passport_id>`). Without the param, the page works as it
  does today and lands directly on `/plan/<id>`.

If Agent 5 hasn't merged yet, ship the param-handling no-op-ily —
just don't render the stepper if the param is unset and don't
break the existing redirect-to-plan path.

## Deliverables

### 1. `/founder` — intake page

Server component for layout, client component for the form. Fields
per `docs/product-plan.md` lines 41–53 + the `FounderPassportInput`
zod schema:

- **Optional website URL** at the top of the form ("Got a
  website? Drop the URL and we'll pre-fill what we can"). Triggers
  the prefill flow described in § 1b below. Skippable — manual
  fill always works.
- County (select — Utah counties)
- City (text, optional)
- Stage (select)
- Industry (combobox)
- Founder identity tags (multi-select chips: student, veteran,
  woman-owned, rural, university researcher, …)
- Goal (select)
- Urgency (radio: this week / this month / next quarter)
- Business size / revenue stage (select)
- What you want (multi-select: capital, customers, talent,
  regulatory help, operating support)

Submit POSTs to `/api/v1/resources/recommend` (passing
`website_url` along when present), then redirects to
`/plan/[passport_id]`.

Use **shadcn/ui** primitives throughout. Lean on Tailwind for
spacing/typography. Make it look polished — judging weights design
heavily.

### 1b. Smart prefill from business website

When the founder fills the URL field and triggers prefill (button
or blur — pick whichever feels less twitchy):

1. POST `/api/v1/founder-passports/enrich` with `{ website_url }`
   (Agent 2 owns the endpoint).
2. Show a non-blocking loading state next to the URL field
   ("Reading your site…"). The form must remain interactive — if
   the founder wants to start typing, they can.
3. On response, populate matching form fields with the returned
   `fields[*].value` and render a small dismissible "filled from
   your site" chip on each prefilled field. The founder is the
   decider — every prefilled value must be editable.
4. On `degraded: true`, network error, or timeout: silently fall
   back to manual fill. Show a small inline note ("couldn't read
   that site — fill in below"). **Never block the form.**
5. Persona quick-test buttons bypass this entirely — they load
   fixtures and skip the URL field.

The exact field-mapping comes from Agent 2's `EnrichResponse`
shape in `types/api.ts`. Don't invent fields the response doesn't
return.

### 2. Persona quick-test buttons

Six buttons across the top of `/founder`: **Try Jordan**, **Try
Maria**, **Try Marcus**, **Try Priya**, **Try David**, **Try Dr.
Amir**. Each posts the corresponding `fp_<name>` ID directly to
`/api/v1/founder-passports/{id}/plan` (which Agent 2 implements) or
loads the canonical fixture from the persona seed and posts it to
`/recommend`. Either path is fine — pick the one that gives the
fastest feedback loop.

Place these *prominently* — they're the primary entry point for testing and user onboarding.

### 3. `/plan/[id]` — results page

Sections (in order):

- **Saved plan URL** at top with copy button for sharing.
- **"Do this now"** (top 3) — large cards with the resource
  title, why-it-matched bullets, and an "Action" line.
- **"Do this next"** (next 3) — slightly smaller cards.
- **"Ignore for now"** (collapsed by default) — list of near-misses
  with one-line dismissals.
- **"Why we recommended these"** detail link/modal — shows the
  field-level breakdown.

Use the `RecommendedResource` type from `types/api.ts`. Render the
LLM "Because…" explanations alongside the field-level reasons.

### 4. Save / share / re-render

The plan URL `/plan/<passport_id>` should be:

- Stable (deep-linkable).
- Re-renderable from D1 (server component fetches via
  `GET /api/v1/founder-passports/:id/plan`).
- Copy-to-clipboard one-click.

### 5. Polish

- Empty state on `/founder` is welcoming, not blank.
- Loading state during the POST → redirect uses a skeleton, not a
  spinner.
- Mobile layout works (users will open this on phones).
- Use semantic colors (Tailwind tokens), not raw hex.
- Add a top nav with Home / Founder / Map / Agents links for smooth navigation.

### 6. PR

```bash
git add app/founder
git commit -m "feat(navigator): intake form + results page + persona quick-tests"
git push -u origin feat/navigator
gh pr create --base main --title "Founder Navigator UI"
```

## DONE when

1. `/founder` renders the form and the six persona buttons.
2. Clicking "Try Priya" navigates to `/plan/fp_priya` and
   shows VC/angel-flavored recommendations (Pelion, Grix, Tandem,
   etc., assuming Agent 1 seeded them and Agent 2 is producing the
   right data).
3. Clicking "Try Jordan" produces *meaningfully different*
   recommendations (start-business / student / community resources).
4. Manual form submission works: fill out → submit → see results.
5. Share URL copy + paste loads the same plan.
6. The page renders cleanly at **375 / 768 / 1280px** — no
   horizontal scroll at 375px, persona buttons stack to a
   one-column grid on mobile, results sidebar collapses above the
   plan instead of next to it. Verified with
   `mcp__playwright__browser_resize` or `agent-browser` device
   mode.
7. PR open.

## Cuts allowed if time-pressed

- **Skip the URL-prefill UX** (the URL field can stay; it just
  submits alongside the intake without triggering enrich). When behind on launch readiness,
  drop this first — manual fill is the always-works path. Coordinate with Agent 2.
- **Skip the "Ignore for now" bucket** — only show top-6.
- **Skip the field-level "Why we recommended these" modal** — show
  reasons inline only.
- ~~Skip mobile polish~~ — **NOT a valid cut.** Mobile is a hard
  requirement (see `00-shared-context.md` and `CLAUDE.md`).
  Founders and GOEO staff will all open this on phones.
- **Skip the share URL** — just keep the deep-link working.
- **Skip skeleton loaders** — simple "Loading…" text is fine.

## Common pitfalls

- **Don't reimplement scoring** in the front-end. The API does it.
- **Persona fixtures must match `db/seed/personas.ts`** — if Jordan
  isn't seeded with the right `goal`, his results won't show
  start-business resources. Coordinate with Agent 1.
- **Cloudflare Workers cold-start** can make the first
  `/recommend` POST slow. Show a loading state, not a frozen UI.
- **shadcn components require Tailwind config to include their
  paths** — Agent 0 handles this; verify if a component renders
  unstyled.
- **Server vs client components.** Forms with state must be
  `'use client'`. Pages that just fetch + render can stay server.
- **Don't use `localStorage` for the plan** — every refresh should
  re-fetch from D1 via the passport ID.
