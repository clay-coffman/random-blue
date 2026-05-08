# Architecture — Startup State Atlas

This is the load-bearing reference for every coding agent. If a brief
disagrees with this file, this file wins.

## Stack

| Layer            | Choice                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Framework        | **Next.js 15** App Router via **`@opennextjs/cloudflare`**                               |
| Runtime          | **Cloudflare Workers** (with Static Assets for the Next.js build)                        |
| DB               | **Cloudflare D1** (SQLite at edge) + **Drizzle ORM**                                     |
| Object store     | **Cloudflare R2** (only if photos are in scope; Agent 4 decides)                         |
| LLM              | **Anthropic Claude `claude-opus-4-7`** (use prompt caching where possible)               |
| Map              | **MapLibre GL** (open tiles via OpenStreetMap or CARTO basemap; no API token)            |
| Errors / logs    | **Cloudflare Workers Observability** (built-in, free) — `wrangler tail` + Workers Logs UI |
| Provisioning     | **Stripe Projects CLI** (`stripe projects`) for SaaS credentials and account linkage     |
| Cloud ops        | **Wrangler CLI** for D1, R2, Workers, secrets                                            |
| Code host        | **GitHub** via `gh` CLI                                                                  |
| Test runners     | **Vitest** (unit), **Playwright** (E2E, scope-permitting)                                |
| UI               | **Tailwind CSS** + **shadcn/ui** primitives                                              |
| Lint / format    | ESLint (Next.js defaults) + Prettier (`~/.prettierrc.yaml`, printWidth 80)               |
| Repo agent infra | **`agent-kit`** (skills, hooks, GitHub workflows, templates) — see `AGENTS.md`           |

## System diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Browser / CLI / MCP host                  │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Founder Navigator │  │ Investor map │  │ External agent       │   │
│  │ (Next.js client)  │  │ (MapLibre)   │  │ (Claude / ChatGPT)   │   │
│  └──────────────────┘  └──────────────┘  └──────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────────┐
│                Cloudflare Worker (OpenNext build)                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Next.js App Router                                          │    │
│  │  ├── app/page.tsx, app/founder/, app/map/, app/startups/    │    │
│  │  ├── app/api/v1/resources/recommend/route.ts                │    │
│  │  ├── app/api/v1/companies/route.ts (and :slug, :slug.md, …) │    │
│  │  ├── app/api/v1/openapi.json/route.ts                       │    │
│  │  ├── app/AGENTS.md, app/llms.txt (or under public/)         │    │
│  │  └── public/AGENTS.md, public/llms.txt (end-user agents)    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│             │                  │                  │                  │
│   ┌─────────▼────────┐  ┌──────▼─────┐  ┌─────────▼───────────┐     │
│   │ D1 binding `DB`  │  │ R2 `ASSETS`│  │ env: ANTHROPIC_API_  │     │
│   │ (SQLite)         │  │ (optional) │  │ KEY, ATLAS_ADMIN_… │     │
│   └─────────┬────────┘  └────────────┘  └────────┬────────────┘     │
└─────────────┼──────────────────────────────────────┼─────────────────┘
              │                                       │
        ┌─────▼──────┐                       ┌────────▼─────────┐
        │ D1 DB:     │                       │ Anthropic API    │
        │ resources, │                       │ (claude-opus-4-7)│
        │ companies, │                       └──────────────────┘
        │ passports  │
        └────────────┘

Side surfaces (same package, different bin):
- cli/index.ts → `startup-state` bin (talks to the Worker via HTTPS)
- mcp/server.ts → `startup-state-mcp` bin (stdio MCP for Claude Desktop)
```

## Repo layout (target — Agent 0 creates the app skeleton)

```
startup-state-atlas/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── founder/                  # Founder Navigator UI (Agent 3)
│   │   ├── page.tsx              # intake form
│   │   └── results/[id]/page.tsx # results page
│   ├── map/page.tsx              # ecosystem map (Agent 4)
│   ├── startups/[slug]/          # company profile pages (Agent 4)
│   │   ├── page.tsx
│   │   ├── route.md/route.ts     # markdown profile endpoint
│   │   └── route.json/route.ts   # JSON profile endpoint
│   ├── claim/page.tsx            # claim flow (Agent 5)
│   ├── admin/                    # GOEO admin UI (Agent 5)
│   │   ├── layout.tsx            # token gate + nav shell
│   │   ├── page.tsx              # pending-edits review
│   │   ├── resources/page.tsx    # resource list + create
│   │   ├── resources/[id]/page.tsx
│   │   ├── companies/page.tsx    # company list + create
│   │   ├── companies/[slug]/page.tsx  # direct edit (no claim)
│   │   └── map/page.tsx          # map curation
│   ├── agents/page.tsx           # /agents docs page (Agent 6)
│   └── api/v1/
│       ├── resources/route.ts             # GET (Agent 2), POST (Agent 5)
│       ├── resources/[id]/route.ts        # GET, PATCH, DELETE (Agent 5)
│       ├── resources/recommend/route.ts   # POST (Agent 2)
│       ├── companies/route.ts             # GET list, POST create (Agent 5)
│       ├── companies/[slug]/route.ts      # GET, PATCH, DELETE (Agent 5)
│       ├── companies/claim/route.ts       # POST (Agent 5)
│       ├── founder-passports/route.ts     # POST
│       ├── founder-passports/[id]/plan/route.ts # GET
│       ├── search/route.ts                # GET
│       └── openapi.json/route.ts          # spec endpoint (Agent 6)
├── db/                           # Drizzle (Agent 1 owns)
│   ├── schema.ts                 # FROZEN after Agent 1 finishes
│   ├── migrations/0000_*.sql
│   ├── seed/personas.ts
│   ├── seed/resources.ts
│   ├── seed/companies.ts
│   ├── seed/data/resources.csv  # user provides (Google Sheets)
│   └── seed/data/companies.csv  # user provides
├── lib/
│   ├── db.ts                     # drizzle client wired to D1 binding
│   ├── anthropic.ts              # Claude client (claude-opus-4-7)
│   ├── api-error.ts              # ApiError class — frozen error shape
│   ├── ids.ts                    # newId(prefix) helper
│   ├── cf.ts                     # getRequestContext().env accessor
│   └── recommend.ts              # scoring lib (Agent 2)
├── schemas/
│   ├── founder-passport.ts       # zod schema
│   └── company-profile.ts        # zod schema
├── types/
│   └── api.ts                    # zod-derived TS types for every endpoint
├── cli/
│   └── index.ts                  # `startup-state` bin entry (Agent 6)
├── mcp/
│   └── server.ts                 # `startup-state-mcp` bin entry (Agent 6)
├── public/
│   ├── AGENTS.md                 # END-USER-FACING agent docs (Agent 6)
│   └── llms.txt                  # /llms.txt (Agent 6)
├── docs/
│   ├── hackathon-plan.md
│   ├── architecture.md           # this file
│   ├── requirements.md
│   └── agent-tasks/00-…6-…md
├── wrangler.jsonc                # CF Workers config
├── open-next.config.ts           # OpenNext for CF
├── drizzle.config.ts
├── next.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

## Data flow — the three demo paths

### A) Founder intake → personalized plan

```
Browser /founder
  → POST /api/v1/founder-passports        (Agent 2)
      → insert into D1 founder_passports
  → POST /api/v1/resources/recommend      (Agent 2)
      → SELECT scored resources from D1 with field-match scoring
      → Anthropic call (source-bound explanation, IDs only from set)
      → return { passport_id, recommendations[] }
  → GET /api/v1/founder-passports/:id/plan (cached "do this now / next / ignore")
  ← render results page (Agent 3)
```

### B) Investor / map view

```
Browser /map
  → MapLibre loads with sector-clustered company markers
  → User filters: sector=fintech, stage=seed, county=Salt Lake
  → GET /api/v1/companies?...                (Agent 2/4)
      → SELECT from D1, JOIN locations, filter
  → Click pin → drawer shows profile
  → "Investor Brief" sidebar runs Anthropic on retrieved companies
  → "View profile" → /startups/:slug
      → ALSO available at /startups/:slug.md and .json
```

### C) External agent calls the API

```
Claude/ChatGPT reads /llms.txt and /AGENTS.md
  → POST /api/v1/resources/recommend  (with X-Atlas-Admin-Token? no — read endpoints are open)
  → cites resource IDs in its response to the user
  → optionally: PATCH /api/v1/companies/:slug  (with X-Atlas-Admin-Token, mock auth)
```

## Cloudflare bindings

`wrangler.jsonc` (Agent 0 sets this up):

```jsonc
{
  "name": "startup-state-atlas",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-05-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS_BUCKET" },
  "d1_databases": [
    { "binding": "DB", "database_name": "startup-state-atlas-db", "database_id": "<from `wrangler d1 create`>" }
  ],
  "r2_buckets": [
    { "binding": "ASSETS", "bucket_name": "startup-state-atlas-assets" }
  ],
  "observability": { "enabled": true },
  "vars": {}      // public
  // Secrets via `wrangler secret put`:
  //   ANTHROPIC_API_KEY
  //   ATLAS_ADMIN_TOKEN
}
```

In code, read bindings via the OpenNext context helper:

```ts
import { getRequestContext } from '@opennextjs/cloudflare';
const env = getRequestContext().env;
const db = drizzle(env.DB);
```

Wrap that in `lib/cf.ts` so handlers don't import OpenNext directly.

## Observability (free, no Sentry)

- Enable via `observability.enabled = true` in `wrangler.jsonc`.
- Live tail: `wrangler tail` (during dev).
- Search/retention: Cloudflare Workers dashboard → Logs.
- No third-party error tracker for the hackathon. If we want richer
  grouping later, add Sentry's free tier or self-host GlitchTip — but
  not now.

## Deploys

- **Local dev:** `npm run dev` (Next.js dev server) for fast UI
  iteration. `npm run preview` (or `npx wrangler dev`) when you need
  live D1/R2 bindings.
- **Push deploy:** `npm run deploy` → `wrangler deploy`. Agent 0 ships
  the empty scaffold to confirm wiring works on day one (catches
  binding/env surprises early).
- **GitHub Action:** optional `.github/workflows/deploy.yml` using
  `cloudflare/wrangler-action` if we want push-to-deploy. Defer until
  after Agent 0 has a green deploy locally.

## Contracts (FROZEN before agents fork)

- **Schema** lives in `db/schema.ts`. Only Agent 1 touches it. New
  columns: ask Agent 1.
- **API contract** lives in `app/api/v1/openapi.yaml` (committed) and
  is also served at `/api/v1/openapi.json`. Agent 6 owns it.
- **Error shape:** `{ error: { code, message, details? } }`.
- **ID prefixes:** `fp_*`, `co_*`, `r_*`, `rec_*`, `cl_*`. Use
  `lib/ids.ts`.
- **Casing:** snake_case API ↔ camelCase TS. Convert at the
  Drizzle/zod boundary.
- **Auth:** `X-Atlas-Admin-Token` Workers secret, no real OAuth.

## Open questions to escalate

If an agent needs answers it can't infer from these docs, the user is
the source of truth. Don't guess on:

- A new database column (Agent 1 only).
- A new public API endpoint (must update OpenAPI; Agent 6 awareness).
- A new third-party SaaS dependency (run it past the user — keep the
  free/CLI-only constraint).
- A change to the error response shape, ID prefixes, casing, or auth
  model (these are architectural; the user decides).
