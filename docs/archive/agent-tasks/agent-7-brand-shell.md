# Agent 7 — Brand & Shell

You ship the visual identity and root chrome the rest of the UI hangs
on: Tailwind theme tokens, fonts, the root `app/layout.tsx`, the home
hero at `/`, the persona tile contract, and a small set of reusable
brand primitives. Aim for ~60–75 minutes — this is the smaller of the
two Phase 2 tracks (Agent 1 is the critical path).

## Branch + worktree

- **Worktree:** `wt2` (Agent 1 takes wt1 in Phase 2).
- **Branch:** `feat/brand-shell`. First action:
  `git checkout -b feat/brand-shell`.

## Reads first

1. `docs/implementation-plan.md` — your phase + coordination matrix.
2. `docs/agent-tasks/00-shared-context.md`.
3. `docs/screens.md` — every URL the app ships, owned by which agent.
4. `design/startup-state-atlas-wireframes/README.md` and the v2 hero
   variant: `design/.../project/wireframes/v2/hero.js` (chosen direction
   B + G hybrid). Read the HTML/CSS — don't render or screenshot.
5. `design/.../project/Wireframes v2.html` for the design tokens
   (CSS `:root` block) and component primitive recipes.
6. `docs/source_data/page-2026-05-08-19-38-24.md` — the GOED brief
   with the **canonical six-persona descriptions**. Use the exact
   text from "Test Cases" for the persona one-liners; don't paraphrase.
7. `docs/requirements.md` — Personas table for additional context.

## Depends on

- **Agent 0 done** (✅ merged). You inherit the Next.js + Tailwind +
  shadcn scaffold and the layered `tailwind.config.ts`.

## Provides to others

- **Agents 3, 4, 5, 6** consume your `app/layout.tsx` (nav + footer
  shell) and brand tokens. Their pages render inside your layout.
- **Agent 3** consumes `lib/personas.ts` (typed persona list) and
  follows the persona-tile target URL contract — see Coordination.

## Owns (write surface)

- `tailwind.config.ts` — extend `theme.colors`, `theme.fontFamily`,
  spacing, borderRadius, boxShadow with the brand tokens.
- `app/globals.css` — CSS variables, `@font-face` (or `next/font`
  imports), base typography rules.
- `app/layout.tsx` — root layout with persistent nav and footer.
  Replaces Agent 0's placeholder.
- `app/page.tsx` — home / hero. Replaces Agent 0's placeholder.
- `components/brand/` — the brand primitives:
  - `Tile.tsx` — the paper-card-with-shadow base used everywhere
  - `Chip.tsx` — pill / badge primitive
  - `SectionHeader.tsx` — serif heading + label / kicker block
  - `ScribbleDivider.tsx` — the dashed-line / repeating-gradient
    section divider
  - `PersonaTile.tsx` — the six clickable persona tiles
  - `ActivityTicker.tsx` — the right-rail ticker stub
- `lib/personas.ts` — typed persona list (id, slug, displayName,
  oneLiner). Used by `PersonaTile` and imported by Agent 3.
- `components/brand/index.ts` — barrel re-exports so consumers
  `import { Tile, Chip, ... } from '@/components/brand'`.

You do NOT touch:

- `db/schema.ts` (Agent 1).
- `app/api/v1/...` (Agents 2, 4, 5, 6).
- `auth.ts`, `middleware.ts` (Agents 1, 5).
- Any `app/founder/*`, `app/plan/*`, `app/map/*`, `app/startups/*`,
  `app/companies/*`, `app/admin/*`, `app/agents/*`, `app/sign-*`,
  `app/me/*` page files (the agents that own those routes).

## Deliverables

### 1. Tailwind theme tokens

Lift the v2 wireframe palette into `tailwind.config.ts`. The CSS
`:root` block in `design/.../project/Wireframes v2.html` is the source.

Required colors (Tailwind names):

```ts
// tailwind.config.ts excerpt
theme: {
  extend: {
    colors: {
      paper: '#F7F4ED',
      'paper-2': '#FBF9F4',
      stone: '#ECE7DC',
      topo: '#C4B89B',
      ink: '#0F1B2D',
      'ink-2': '#2A3647',
      'ink-3': '#5A6678',
      ember: '#C2410C',
      sage: '#4F6F52',
      sky: '#2563EB',
      danger: '#B91C1C',
      // sector palette — used by Agent 4's map pins + chips
      sector: {
        fintech: '#16A34A',
        saas: '#2563EB',
        ai: '#0891B2',
        aerospace: '#7C3AED',
        bio: '#DC2626',
        energy: '#EA580C',
        consumer: '#DB2777',
        security: '#475569',
      },
    },
    fontFamily: {
      serif: ['var(--font-roboto-serif)', 'Georgia', 'serif'],
      sans: ['var(--font-hanken-grotesk)', 'system-ui', 'sans-serif'],
      hand: ['var(--font-kalam)', 'cursive'],
      mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
    },
    boxShadow: {
      sketch: '5px 5px 0 var(--color-ink, #0F1B2D)',
      'sketch-hover': '7px 7px 0 var(--color-ink, #0F1B2D)',
    },
    borderRadius: {
      tile: '14px',  // brand cards
      pill: '999px',
    },
  },
},
```

Verify Tailwind classes resolve: `<div className="bg-paper text-ink">`
should produce the right colors.

### 2. Fonts via `next/font`

In `app/layout.tsx`:

```tsx
import { Roboto_Serif, Hanken_Grotesk, Kalam, JetBrains_Mono } from 'next/font/google';

const robotoSerif = Roboto_Serif({ subsets: ['latin'], variable: '--font-roboto-serif' });
const hankenGrotesk = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken-grotesk' });
const kalam = Kalam({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-kalam' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
```

Apply the variables to `<html>`. **Avoid** loading every font weight —
pick the minimum each face needs.

### 3. Root layout — `app/layout.tsx`

Sticky top nav + footer. Persona-agnostic. Reads:

- **Top nav** (left): wordmark "Startup State / Atlas".
- **Top nav** (center): `Atlas` (`/`), `Map` (`/map`),
  `Resources` (`/founder`), `For agents` (`/agents`).
- **Top nav** (right): "Sign in" (`/sign-in`), "Claim a company"
  (`/sign-up?intent=claim`).
- **Footer**: small wordmark, links to `/llms.txt`, `/AGENTS.md`,
  `/api/v1/openapi.json`, GitHub repo URL.

Sticky on scroll. Mobile nav collapses to a hamburger or scrollable
chip row — designer's choice within the responsive rules.

### 4. Home page — `app/page.tsx`

Hero matching v2 hero variant B + G:

- **Headline** (serif): "A guide for Utah founders. Six questions.
  One 90-day plan."
- **Subhead** (body): one paragraph explaining the product.
- **Primary CTA** (ember button): "Start my plan →" linking to
  `/founder`.
- **Secondary CTAs** (ghost buttons): "Explore the map" (`/map`),
  "For agents" (`/agents`).
- **Persona tiles** (grid of 6) — see deliverable 5.
- **Activity ticker** — see deliverable 6.

### 5. Persona tile contract

`components/brand/PersonaTile.tsx` renders one tile. Six tiles render
in a responsive grid (3×2 on desktop, 2×3 on tablet, 1×6 stack on
mobile).

Each tile shows: persona display name (serif heading), one-line
description (body), small icon/initial. On click, navigates to
`/founder?persona=<id>`. Agent 3's `/founder` page reads the query
param and either prefills the form or routes directly to
`/plan/fp_<id>` once Agent 2's seeded recommendations exist.

The persona list lives in `lib/personas.ts` as the typed source of
truth. **Use the GOED brief's exact descriptions** from
`docs/source_data/page-2026-05-08-19-38-24.md` § Test Cases — these are
the test fixtures that seed the product database.

```ts
// lib/personas.ts
export type Persona = {
  id: string;          // 'jordan'
  passportId: string;  // 'fp_jordan' (matches Agent 1's seed)
  displayName: string; // 'Jordan, 20'
  location: string;    // 'Salt Lake City'
  oneLiner: string;    // verbatim from GOED brief
};

export const personas: readonly Persona[] = [
  {
    id: 'jordan', passportId: 'fp_jordan',
    displayName: 'Jordan, 20', location: 'Salt Lake City',
    oneLiner: 'Pre-seed founder with an idea but no business yet. Looking for resources to take his first steps.',
  },
  {
    id: 'maria', passportId: 'fp_maria',
    displayName: 'Maria, 38', location: 'Washington County',
    oneLiner: 'Running a small agricultural operation near St. George. Rural, woman-owned, looking to scale.',
  },
  {
    id: 'marcus', passportId: 'fp_marcus',
    displayName: 'Marcus, 34', location: 'Ogden (Weber County)',
    oneLiner: 'Left the military and is starting a custom fabrication and manufacturing business. Veteran, early-stage.',
  },
  {
    id: 'priya', passportId: 'fp_priya',
    displayName: 'Priya, 31', location: 'Salt Lake City',
    oneLiner: 'B2B SaaS founder, 18 months in, paying customers, ready to raise her first venture round. Specifically looking for angel groups and VCs.',
  },
  {
    id: 'david', passportId: 'fp_david',
    displayName: 'David, 45', location: 'Provo (Utah County)',
    oneLiner: 'Medical device company, 12 employees, FDA cleared. Looking to expand to international markets. Growth stage, established business.',
  },
  {
    id: 'amir', passportId: 'fp_amir',
    displayName: 'Dr. Amir, 29', location: 'Salt Lake City',
    oneLiner: 'PhD candidate at the University of Utah developing a novel technology. Wants to commercialize his research and found a company. Has never started a business before.',
  },
] as const;
```

Coordinate with Agent 1 — the `passportId` values must match the
seeded `founder_passports.id` exactly. The card UI may show
`displayName` + `location` on the front and `oneLiner` on hover/click.

### 6. Activity ticker (stub)

`components/brand/ActivityTicker.tsx`. In Phase 2, it's a static
display of three placeholder strings:

```tsx
const stub = [
  '+ Crew (FinTech, SLC) just claimed their profile',
  '+ Maria added a hiring update',
  '+ 3 new resources in Washington County',
];
```

Phase 5 polish can replace `stub` with a server fetch of last-N events
from D1. Comment the file with `// TODO(phase-5): wire to real events`.

### 7. Brand primitives

Implement the components listed under "Owns (write surface)". Each
should be 30–80 lines of Tailwind-only React. Reference the v2
wireframe HTML for visual details (paper background, ink border,
sketchy box-shadow). Do not introduce a CSS-in-JS library.

### 8. PR

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx app/page.tsx components/brand lib/personas.ts
git commit -m "feat(brand-shell): theme tokens, root layout, hero with persona tiles"
git push -u origin feat/brand-shell
gh pr create --base main --title "Brand & shell — theme tokens, layout, hero"
```

## DONE when

1. `npm run dev` opens `/` and shows the hero, persona tiles (6, all
   clickable), the activity ticker stub, and the three-link nav with
   sign-in + "Claim a company" buttons.
2. Tailwind brand tokens resolve from any client component:
   `<div className="bg-paper text-ink border border-ink/30 shadow-sketch">`
   renders correctly.
3. Roboto Serif and Hanken Grotesk visibly load (not fallback fonts).
4. Clicking each persona tile navigates to
   `/founder?persona=<id>` (Agent 3 will handle the destination —
   it's a 404 until Agent 3 ships, but the URL is correct).
5. Page renders cleanly at **375 / 768 / 1280px**:
   - No horizontal scroll at 375px.
   - Persona tiles stack to a single column on mobile.
   - Activity ticker scrolls horizontally on mobile (or tucks into a
     mobile-friendly variant).
   - Tap targets ≥ 44×44 px.
   - Nav collapses to a mobile-appropriate variant.
   Verified with `mcp__playwright__browser_resize`.
6. `lib/personas.ts` exports the six personas with `passportId` values
   matching what Agent 1 seeds (`fp_jordan`, `fp_maria`, …).
7. PR open.

## Cuts allowed if time-pressed

- **Skip the activity ticker entirely.** Delete it from the hero.
- **Skip Kalam / Caveat fonts.** Hanken Grotesk + Roboto Serif +
  JetBrains Mono is the minimum that still feels intentional.
- **Skip the brand primitives folder.** Inline the styles where they're
  used. Agents 3/4/5 will reinvent locally — accept the duplication.
- **Skip the footer.** Nav-only is fine for initial launch.
- **Skip secondary nav links** ("For agents") if the agent docs page
  isn't ready yet — link to `#` and the integration will be straightforward
  after launch.

Never skip:

- Mobile responsive (375 / 768 / 1280).
- The persona tiles → `/founder?persona=<id>` contract (Agent 3 depends
  on it).
- Theme tokens in `tailwind.config.ts` (downstream agents depend on
  these to render in-brand).

## Common pitfalls

- **`next/font` and Workers.** Use `next/font/google`, not local font
  files unless you put them under `public/`. Some `next/font` features
  require Node-runtime helpers — if `npm run preview` errors, fall
  back to `<link>` tags in `<head>` referencing Google Fonts CDN.
- **Don't ship 40 KB of scribble SVGs.** The "scribble" lines in the
  wireframes are a CSS trick:
  `background: repeating-linear-gradient(90deg, var(--ink-2) 0 6px, transparent 6px 10px);`.
  Use it.
- **Don't introduce a CSS-in-JS lib.** Tailwind tokens + small
  primitives are enough.
- **Don't gate UI on Better Auth.** The hero is anonymous; signing in
  is optional. Don't import Agent 5's `auth-client.ts` here.
- **Don't reach for `dynamic` imports** for the activity ticker —
  it's a stub of three strings, not a heavy widget.
- **Persona tile keys.** If Agent 1's seed uses different IDs (e.g.,
  `fp_dr_amir` vs `fp_amir`), update `lib/personas.ts` to match.
  Verify by querying `wrangler d1 execute startup-state-atlas-db --local --command "SELECT id FROM founder_passports"`.
