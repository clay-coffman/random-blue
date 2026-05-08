# Agent 3 — Founder Navigator UI

You build the highest-scoring user-facing surface: the founder
intake → personalized plan flow. Polish matters here. Aim for ~120
minutes — this is the demo's headline.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 1).
- **Branch:** `feat/navigator`. First action:
  `git checkout -b feat/navigator`.

## Reads first

1. `docs/agent-tasks/00-shared-context.md`
2. `docs/architecture.md` — repo layout.
3. `docs/requirements.md` — Founder Passport intake + the
   judging-rubric notes (usability + design = 55%).
4. `docs/hackathon-plan.md` lines 39–82 (intake fields), lines
   449–470 (Jordan + Priya scenes).
5. `types/api.ts` — `RecommendRequest`, `RecommendResponse`,
   `RecommendedResource` (Agent 2 produces these).
6. `db/seed/personas.ts` — the canonical persona IDs.
7. `app/api/v1/resources/recommend/route.ts` — the endpoint shape
   (Agent 2 owns).

## Depends on

- **Agent 1 done.** You need `founder_passports` populated with
  the 6 personas so the "Try Jordan" buttons work.
- **Agent 2 done (or scaffolded).** You need
  `POST /api/v1/resources/recommend` returning real data. If
  Agent 2 isn't done, mock the response from `types/api.ts` and
  swap the fetch URL when Agent 2 lands.
- **Agent 0 done.** shadcn primitives must be installed.

## Owns (write surface)

- `app/founder/page.tsx` — intake landing.
- `app/founder/results/[id]/page.tsx` — results page (server
  component reads cached plan).
- `app/founder/_components/IntakeForm.tsx` — client component.
- `app/founder/_components/PersonaButtons.tsx` — quick-test row.
- `app/founder/_components/ResultsView.tsx` — Do Now / Do Next /
  Ignore display + "Why this matched" detail.
- `app/founder/_components/ShareLink.tsx` — copy-to-clipboard
  share.
- Tailwind tweaks if needed.

You do NOT touch:

- `app/api/v1/...` route handlers (Agent 2).
- `app/map/...` (Agent 4).
- `db/schema.ts`.

## Deliverables

### 1. `/founder` — intake page

Server component for layout, client component for the form. Fields
per `docs/hackathon-plan.md` lines 41–53 + the `FounderPassportInput`
zod schema:

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

Submit POSTs to `/api/v1/resources/recommend`, then redirects to
`/founder/results/[passport_id]`.

Use **shadcn/ui** primitives throughout. Lean on Tailwind for
spacing/typography. Make it look polished — judging weights design
heavily.

### 2. Persona quick-test buttons

Six buttons across the top of `/founder`: **Try Jordan**, **Try
Maria**, **Try Marcus**, **Try Priya**, **Try David**, **Try Dr.
Amir**. Each posts the corresponding `fp_<name>` ID directly to
`/api/v1/founder-passports/{id}/plan` (which Agent 2 implements) or
loads the canonical fixture from the persona seed and posts it to
`/recommend`. Either path is fine — pick the one that gives the
fastest feedback loop.

Place these *prominently* — they're the demo's main entry point.

### 3. `/founder/results/[id]` — results page

Sections (in order):

- **Saved plan URL** at top with copy button (so you can demo
  sharing).
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

The plan URL `/founder/results/<passport_id>` should be:

- Stable (deep-linkable).
- Re-renderable from D1 (server component fetches via
  `GET /api/v1/founder-passports/:id/plan`).
- Copy-to-clipboard one-click.

### 5. Polish

- Empty state on `/founder` is welcoming, not blank.
- Loading state during the POST → redirect uses a skeleton, not a
  spinner.
- Mobile layout works (judges may demo on a phone).
- Use semantic colors (Tailwind tokens), not raw hex.
- Add a top nav with Home / Founder / Map / Agents links so the
  demo can pivot smoothly.

### 6. PR

```bash
git add app/founder
git commit -m "feat(navigator): intake form + results page + persona quick-tests"
git push -u origin feat/navigator
gh pr create --base main --title "Founder Navigator UI"
```

## DONE when

1. `/founder` renders the form and the six persona buttons.
2. Clicking "Try Priya" navigates to `/founder/results/fp_priya` and
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

## Demo path

**Scenes 1, 2, and 4** of the demo script (Jordan, Priya, business
owner). This is the headline of the hackathon presentation.

## Cuts allowed if time-pressed

- **Skip the "Ignore for now" bucket** — only show top-6.
- **Skip the field-level "Why we recommended these" modal** — show
  reasons inline only.
- ~~Skip mobile polish~~ — **NOT a valid cut.** Mobile is a hard
  requirement (see `00-shared-context.md` and `AGENTS.md`).
  Judges, founders, and GOEO staff will all open this on phones.
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
