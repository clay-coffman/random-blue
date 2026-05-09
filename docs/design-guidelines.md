# Design & frontend guidelines

The brand and root chrome are frozen after Agent 7's PR. This doc is the
single reference for downstream UI agents (3, 4, 5, 6) and the Phase 5
polish pass. Read it before adding any new page, component, or token.

If you're tempted to add a new color, font, shadow, or radius — push
back. The palette is intentionally small. Reach for the existing token
first; if it really doesn't fit, raise it in the PR.

## Tailwind v4 — where tokens live

This repo uses **Tailwind v4**. There is no `tailwind.config.ts`. Theme
extensions live in `app/globals.css` inside `@theme { … }` blocks.
A token like `--color-paper: #f7f4ed;` automatically becomes the utility
classes `bg-paper`, `text-paper`, `border-paper`, etc.

Two `@theme` blocks coexist:

- The **shadcn `@theme inline`** block forwards `--color-*` for shadcn
  primitives in `components/ui/*` (`bg-primary`, `bg-card`, etc.). Don't
  rename or delete these.
- The **brand `@theme`** block (added by Agent 7) defines paper / ink /
  ember / sage / sky neutrals + accents, the sector palette, the four
  brand fonts, the sketch shadow, and tile/pill radii.

Order matters: brand tokens come **after** the shadcn forwarders so
brand `--font-sans` and `--font-mono` win.

## Brand tokens

Use Tailwind utilities, never hard-code colors or hex values.

### Color

| Tailwind class | Hex | Use for |
|---|---|---|
| `bg-paper` / `text-paper` | `#F7F4ED` | default page background, on-dark text |
| `bg-paper-2` | `#FBF9F4` | tile / card surfaces |
| `bg-stone` | `#ECE7DC` | subtle dividers, hover fills |
| `bg-topo` / `border-topo` | `#C4B89B` | section borders, low-contrast lines |
| `bg-topo-2` | `#A89A78` | rare — only when `topo` reads too light |
| `bg-ink` / `text-ink` | `#0F1B2D` | default body text, dark surfaces |
| `text-ink-2` | `#2A3647` | secondary body |
| `text-ink-3` | `#5A6678` | meta / captions / mono labels |
| `bg-ember` / `text-ember` | `#C2410C` | primary CTA, "now" actions |
| `bg-ember-tint` | `#FBE7DC` | active persona, selected chips |
| `bg-sage` / `text-sage` | `#4F6F52` | success, "approved", verified |
| `bg-sage-tint` | `#DDE7DD` | sage-toned chips |
| `bg-sky` / `text-sky` | `#2563EB` | investor surfaces, "next" actions |
| `bg-sky-tint` | `#DDE6FB` | sky-toned chips |
| `bg-danger` | `#B91C1C` | destructive only (delete, reject) |

**Sector palette** (Agent 4 map pins + sector chips):
`sector-fintech`, `sector-saas`, `sector-ai`, `sector-aerospace`,
`sector-bio`, `sector-energy`, `sector-consumer`, `sector-security`.

### Typography

Four fonts, loaded via `next/font/google` in `app/layout.tsx`:

| Tailwind class | Font | Use for |
|---|---|---|
| `font-serif` | Roboto Serif | headlines, hero, section titles, persona names on tiles |
| `font-sans` (default) | Hanken Grotesk | body copy, form labels, default everywhere |
| `font-hand` | Kalam | kickers, "scribbled" subheads, captions over inputs |
| `font-mono` | JetBrains Mono | meta (kicker labels, location, timestamps), code, IDs |

Don't add a new font. Caveat / handwriting variants are explicitly
out of scope per the brief's cuts list.

### Shadows + radii

| Class | Value | Use for |
|---|---|---|
| `shadow-sketch` | `5px 5px 0 #0F1B2D` | default tiles, primary CTAs |
| `shadow-sketch-hover` | `7px 7px 0 #0F1B2D` | hover state — pair with `hover:-translate-y-0.5` |
| `rounded-tile` | `14px` | brand cards, CTAs, persona pills |
| `rounded-pill` | `999px` | chips, persona pills, status indicators |

The lift-on-hover pattern is the brand interaction:
`shadow-sketch hover:shadow-sketch-hover hover:-translate-y-0.5
transition-transform`.

## Brand primitives

Live in `components/brand/*`. Import via the barrel:

```ts
import {
  Tile, Chip, SectionHeader, ScribbleDivider,
  PersonaTile,
} from '@/components/brand';
```

**Tile** — paper-card-with-shadow base. Props:
`as?` (element), `variant?: 'default' | 'subtle' | 'rotated'`,
`shadow?: 'sketch' | 'sketch-hover' | 'none'`. Use everywhere a card
is needed.

**Chip** — pill / badge primitive. Props:
`tone?: 'ink' | 'ember' | 'sage' | 'sky' | 'stone' | 'ember-tint' | 'sage-tint' | 'sky-tint'`,
`size?: 'sm' | 'md'`. Always mono uppercase. Use for status, sector,
stage, county tags.

**SectionHeader** — kicker (mono) + serif title + optional hand sub.
Props: `kicker?`, `kickerTone?: 'ember' | 'sky' | 'sage' | 'ink-3'`,
`title`, `sub?`. Use as the heading block of any major section.

**ScribbleDivider** — CSS-only repeating-gradient divider. Props:
`width?: 'full' | 'med' | 'short'`. `aria-hidden`. Use to visually
break sections without a hard rule. **Don't** ship SVG scribble
assets — use this primitive.

**PersonaTile** — `<Link href="/founder?persona=<id>">`. Props:
`persona: Persona`, `variant?: 'compact' | 'full'`, `active?: boolean`.
Compact = pill with circled initial (used in hero + Agent 3 quick-test
buttons). Full = `<Tile>` with name + location + oneLiner (use on
`/founder` if the page wants a grid; brief allows it). Both variants
honor the same URL contract.

## Personas — the URL contract

`lib/personas.ts` is the typed source of truth for the six GOED test
personas. The shape:

```ts
export type Persona = {
  id: string;          // URL slug, e.g. 'jordan'
  passportId: string;  // DB id from Agent 1's seed, e.g. 'fp_jordan'
  displayName: string;
  location: string;
  oneLiner: string;    // verbatim from docs/source_data/page-2026-05-08-19-38-24.md
};
```

**Frozen URL contract:** clicking a persona anywhere navigates to
`/founder?persona=<id>`. Agent 3's `/founder` reads the query param
and either prefills the form or routes to `/plan/<passportId>` once
Agent 2's seeded recommendations exist. Agents adding sample-founder
shortcuts elsewhere (e.g. an admin "preview as" tool) must use the
same URL.

The oneLiners are verbatim from the GOED brief. Don't paraphrase —
users recognize them.

## Layout chrome

`app/layout.tsx` owns the sticky nav and footer. Page files render
inside `<main>`; they don't add their own nav.

- Nav (top): wordmark `Startup State / Atlas`, center links
  (`Atlas / Map / Resources / For agents`), right CTAs
  (`Sign in`, `Claim a company`). Sticky, paper bg with backdrop blur,
  `border-b border-topo`.
- Footer: small wordmark + four links (`/llms.txt`, `/AGENTS.md`,
  `/api/v1/openapi.json`, GitHub). Mono uppercase, `bg-paper-2`,
  `border-t border-topo`.

If you need a non-default chrome (e.g. an admin shell), put it in
your route's own `layout.tsx` — don't edit `app/layout.tsx`.

## Page conventions

- **Page container:** `mx-auto max-w-[1480px] px-4 sm:px-7`. Don't
  pick a different max width unless the design genuinely calls for
  full-bleed (e.g. the map).
- **Section padding:** `py-10` to `py-14` between hero-scale sections;
  `py-6` inside cards.
- **Two-column layouts:** `md:grid-cols-[Xfr_Yfr]` with `gap-10`. The
  hero uses `[1.4fr_1fr]`.
- **CTA buttons:** lift on hover, sketch shadow, `min-h-[44px]`. Use
  the inline class strings established in `app/page.tsx` rather than
  the shadcn `<Button>` — shadcn's variants don't carry brand tokens.
  If you need a reusable `<Button>` primitive, add it to
  `components/brand/` (don't rewrite the shadcn one).

## Responsive — non-negotiable

Every page must render cleanly at **375 / 768 / 1280px** before merge.

- No horizontal scroll at 375.
- All tap targets ≥ **44 × 44px** (use `min-h-[44px]` on buttons,
  links, persona pills).
- Mobile-first: write base styles for 375, layer up with `sm: md: lg:`.
- Hide non-essential elements on small screens with `hidden sm:block`
  or `hidden md:block` rather than shrinking text below readability.
- Verify each viewport with
  `mcp__playwright__browser_resize` (or any browser device toolbar)
  before opening the PR.

This is restated from `CLAUDE.md § Coding Style`; design polish
doesn't excuse breaking it.

## What not to do

- **No CSS-in-JS libraries** (styled-components, emotion). Tailwind +
  `cn()` covers everything in this repo.
- **No new fonts.** Caveat / cursive / additional weights are out.
- **No SVG scribble assets.** Use `<ScribbleDivider />`.
- **No theme extensions in JS/TS.** Tokens go in `app/globals.css`
  `@theme`; don't recreate them as TS constants.
- **Don't reach for `dynamic` imports** for tiny widgets — keep the
  hero and brand primitives server-rendered.
- **Don't gate UI on auth.** The hero and `/founder` intake are
  anonymous. Auth-gated routes are explicit (admin, claim, edit).
- **Don't paraphrase persona descriptions.** They are part of the production UX.

## Adding to the brand

If a new shared primitive is genuinely needed (a downstream agent
shouldn't ship a third copy of the same component), add it under
`components/brand/<Name>.tsx` and re-export from
`components/brand/index.ts`. Keep components 30–80 lines, Tailwind
only, server-renderable by default. Document its props inline.

## Where to look

- `app/globals.css` — token reference (the `@theme` blocks).
- `app/layout.tsx` — nav + footer source.
- `app/page.tsx` — canonical example of brand primitives in use.
- `lib/personas.ts` — the persona contract.
- `design/startup-state-atlas-wireframes/` — original wireframes;
  read the HTML/CSS, don't render or screenshot.
- `docs/screens.md` — URL → wireframe → owning agent matrix.
