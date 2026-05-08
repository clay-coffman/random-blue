# Agent 4 — Ecosystem Map + Company Profiles

You build the visual centerpiece for investors and the per-company
profile pages (which double as agent cards). Aim for ~120 minutes —
visual polish matters here.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 2).
- **Branch:** `feat/map`. First action: `git checkout -b feat/map`.

## Reads first

1. `docs/implementation-plan.md` — your phase + coordination matrix
   (you share `app/api/v1/companies/[slug]/route.ts` with Agent 5).
2. `docs/agent-tasks/00-shared-context.md`.
3. `docs/architecture.md` — repo layout + `/startups/:slug.{md,json}`
   route conventions.
4. `docs/requirements.md` — Investor / map view + Company profiles.
5. `docs/hackathon-plan.md` lines 117–183 (map + profile spec) and
   lines 471–495 (Scene 3, investor view).
6. **`docs/source_data/page-2026-05-08-19-38-24.md`** § "The Utah
   Startup Map" — required company-profile fields, filter list, and
   the `pampam.city/utah-startup-map` reference. **Don't scrape or
   fetch the reference site** — it's just inspiration.
7. **`docs/source_data/Map Data for Builder Day  - Sheet1.csv`** to
   know what real sector / stage values you'll be filtering on. The
   `Section` column is what we call `sector`. Vocabulary in the data:
   `B2B Software`, `Security`, `FinTech`, `Aerospace and Defense`,
   `Life Sciences`, etc. — match what's there, don't invent
   "B2B SaaS"-style alternatives.
8. `design/startup-state-atlas-wireframes/project/wireframes/v2/map.js`
   (chosen direction: Variant B map-first floating filters + cluster
   gazetteer toggle complement) and
   `design/.../v2/profile.js` (Variant A classic + Variant B agent
   reveal). Read the HTML/CSS — don't render.
9. `db/schema.ts` (after Agent 1 freezes) — companies + locations.
10. MapLibre GL JS docs (via the `cloudflare:cloudflare` skill or
    <https://maplibre.org/maplibre-gl-js/docs/>).
11. `db/seed/centroids.ts` (Agent 1 produces) for fallback geocoding.

## Depends on

- **Agent 1 done.** You need `companies`, `company_locations`,
  `company_jobs` populated from
  `docs/source_data/Map Data for Builder Day  - Sheet1.csv`. The
  source data is **address-only** — Agent 1 fills `lat`/`lng` via
  `db/seed/centroids.ts`. Some rows will have null coordinates if the
  city isn't in the centroid map; those pins are skipped on the map.
- **Agent 7 done (or in flight).** You consume the root layout
  (`app/layout.tsx`), brand tokens (paper/ink/ember + sector palette),
  and the `Tile` / `Chip` brand primitives. If Agent 7 hasn't merged
  yet, stub minimal styles and rebase later.
- **Agent 0 done.** You need shadcn primitives, `lib/db.ts`,
  `lib/anthropic.ts`.
- Optionally Agent 2 for the "Investor Brief" panel's source-bound
  Anthropic call (or copy that pattern from
  `app/api/v1/resources/recommend/route.ts`).
- **Coordinates with Agent 5** on `app/api/v1/companies/[slug]/route.ts`.
  You ship GET; Agent 5 adds PATCH on top. Land your PR first.

## Owns (write surface)

- `app/map/page.tsx` — server component.
- `app/map/_components/EcosystemMap.tsx` — MapLibre client
  component.
- `app/map/_components/FilterSidebar.tsx`.
- `app/map/_components/InvestorBrief.tsx` — Anthropic
  summarization panel.
- `app/map/_components/ProfileDrawer.tsx` — slide-out company
  preview.
- `app/startups/[slug]/page.tsx` — full profile.
- `app/startups/[slug]/route.md/route.ts` — markdown agent card.
- `app/startups/[slug]/route.json/route.ts` — JSON agent card.
- `app/api/v1/companies/route.ts` — `GET ?sector=…&stage=…`.
- `app/api/v1/companies/[slug]/route.ts` — `GET`.
- `lib/company-card.ts` — formatter shared between profile page,
  .md, and .json endpoints.

You do NOT touch:

- `db/schema.ts`.
- Founder navigator (`app/founder/*`) — Agent 3.
- Claim flow (`app/claim/*`) — Agent 5.

## Deliverables

### 1. `GET /api/v1/companies` (list with filters)

Query params: `sector`, `stage`, `county`, `city`, `min_employees`,
`max_employees`, `hiring_status`, `q` (text search). Returns:

```json
{
  "companies": [
    {
      "id": "co_…", "slug": "crew", "name": "Crew",
      "sector": "FinTech", "stage": "Seed", "employee_count": 5,
      "hiring_status": true, "lat": 40.76, "lng": -111.89,
      "logo_url": "...", "summary": "…"
    }
  ],
  "total": 234
}
```

Cap results at 500 for the map view.

### 2. `GET /api/v1/companies/:slug` (single)

Returns the full Agent Card shape (per
`docs/hackathon-plan.md` lines 158–179). Include all the company
profile fields.

### 3. `app/map/page.tsx` — the map view

Layout:

- **Top bar:** filter sidebar toggle, search box, "Investor brief"
  button.
- **Left:** `FilterSidebar` (sector, stage, employees range,
  county, hiring status).
- **Center:** `EcosystemMap` taking up the rest.
- **Right:** `ProfileDrawer` (slides in when a pin is clicked).

`EcosystemMap` uses MapLibre GL JS:

- Basemap: free OpenStreetMap raster or CARTO Light vector tiles
  (no token).
- Center on Utah (lat 40.5, lng -111.5).
- Add a clustered source from `/api/v1/companies` query results.
- Color clusters by **dominant sector** (or stage — pick whichever
  reads better).
- Click cluster: zoom in. Click pin: open profile drawer with
  preview + "View profile" button to the full page.
- Filter changes update the source data without reloading the map.

### 4. `InvestorBrief` panel

Click "Investor brief" → call Anthropic with the *currently
filtered* set of companies. Source-bound prompt (similar shape to
Agent 2's recommend explanation):

```
You are summarizing a filtered subset of Utah startups for an
investor. Use ONLY the companies provided. Identify 3–5 distinct
clusters/themes. Note 1–2 likely partner-company relationships.
Cite company slugs.

<filter>
{ sector: …, stage: …, … }
</filter>

<companies>
{ slug, name, sector, stage, description, employees }
</companies>
```

Display the response in the right panel as bulleted clusters.
Per `docs/hackathon-plan.md` lines 484–493 — turn the map from
directory into narrative.

### 5. `app/startups/[slug]/page.tsx` — public profile

Sections:

- Hero: name, logo, sector + stage badges, hiring status pill,
  website link.
- Description.
- Location (county + city).
- Team (if available).
- Job postings list.
- "Last updated" / "Verified" timestamps.
- **"Claim this company"** button (Agent 5 wires the handler;
  link to `/claim?slug=...`).
- **"Update with Claude/ChatGPT"** button — copies a structured
  prompt to clipboard (per `docs/hackathon-plan.md` lines
  421–440). Don't implement OAuth; just the prompt-copy UX.
- **"Agent Card"** footer with links to `/startups/:slug.md`,
  `/startups/:slug.json`, `/api/v1/companies/:slug`.

### 6. Markdown / JSON agent card endpoints

- `app/startups/[slug]/route.md/route.ts` — returns
  `text/markdown` with the company's canonical fields rendered as
  markdown. Agents read this for context.
- `app/startups/[slug]/route.json/route.ts` — returns the same
  shape as `GET /api/v1/companies/:slug` with
  `Content-Type: application/json`.

`lib/company-card.ts` is the shared formatter — call it from all
three places (profile page, .md endpoint, JSON endpoint) so they
never drift.

### 7. PR

```bash
git add app/map app/startups app/api lib/company-card.ts
git commit -m "feat(map): ecosystem map + company profiles + agent cards"
git push -u origin feat/map
gh pr create --base main --title "Ecosystem map + company profiles"
```

## DONE when

1. `/map` loads MapLibre with Utah-centered view, clustered
   companies visible.
2. Filtering by `sector=FinTech, stage=Seed, county=Salt Lake`
   shows the cluster from `docs/hackathon-plan.md` Scene 3.
3. Clicking a pin opens the drawer with company preview.
4. "Investor brief" returns 3–5 cluster bullets citing real
   company slugs.
5. `/startups/crew` (or any seeded slug) renders a full profile
   page with all sections.
6. `curl /startups/crew.md` returns valid markdown.
7. `curl /startups/crew.json` returns the JSON agent card.
8. `curl /api/v1/companies?sector=FinTech` returns at least the
   FinTech companies from the seed.
9. **Mobile (375px):** the map fills the viewport; the
   pin-detail/InvestorBrief drawer renders as a **bottom sheet**
   (slides up from the bottom edge), not a side panel. Filter
   chips wrap and remain tappable (≥ 44×44 px). `/startups/:slug`
   profile pages stack their sections vertically with no
   horizontal scroll. Verified with
   `mcp__playwright__browser_resize`.
10. PR open.

## Demo path

**Scene 3 (investor view)** and **Scene 4 (business owner as
website)**. The map is the visual you put on the projector.

## Cuts allowed if time-pressed

- **Skip vector tiles** — use a raster basemap (slower but
  simpler).
- **Skip the InvestorBrief panel** — it's polish; cosmetic if
  short on time.
- **Skip clustering** — show individual pins (works fine for ~200
  companies).
- **Skip the "Update with Claude/ChatGPT" button** — Agent 5 may
  add it as part of claim flow.
- **Skip the .md endpoint** if Agent 6 ends up writing it from
  llms.txt; coordinate with them.

## Common pitfalls

- **MapLibre with Workers SSR** — the map must be a `'use client'`
  component. Don't import `maplibre-gl` from a server component.
- **Pin coordinates fall back to centroids** — Agent 1's seed uses
  city/county centroids when geocoding fails. Don't be surprised
  by stacked pins on a single coordinate (e.g., every Salt Lake
  City company resolving to the same lat/lng). Apply a tiny random
  jitter or rely on clustering to make this readable.
- **Sector vocabulary comes from the source data**, not the
  hackathon brief's prose. Use the actual `Section` values in the
  CSV (`B2B Software`, `Security`, `FinTech`, `Aerospace and Defense`,
  `Life Sciences`, etc.) — the brand palette has eight sector colors,
  but the data may have more or fewer. Map unknown sectors to a
  neutral color rather than throwing.
- **`Stage` values include trailing whitespace** in the source
  (`"Seed "`). Agent 1's loader trims, but if you build dropdowns
  from a `SELECT DISTINCT stage`, double-check.
- **Tile attribution.** OSM/CARTO require attribution — render
  the standard badge.
- **CSS for map container** — set explicit `height: 100%` on a
  parent flexbox; MapLibre needs a sized container or the map
  renders 0px tall.
- **Profile slug uniqueness** — Agent 1 should make `companies.slug`
  UNIQUE; if not, generate slugs deterministically from the name.
