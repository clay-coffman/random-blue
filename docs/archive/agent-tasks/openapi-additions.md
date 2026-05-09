# OpenAPI additions

A staging file for endpoint shapes that Agent 6 folds into
`app/api/v1/openapi.yaml`. Each agent appends a section when their
endpoints are final; Agent 6 reconciles.

## Conventions

- Path prefix `/api/v1`.
- Error shape (frozen): `{ "error": { "code": string, "message": string, "details"?: unknown } }`.
- `Content-Type: application/json` on every request and response.
- Status codes used: `200`, `201`, `400` (`BAD_REQUEST`), `404` (`NOT_FOUND`), `500` (`INTERNAL`).
- All wire fields are `snake_case`. Internal TS uses `camelCase` and
  converts at the boundary via `lib/api-codec.ts`.

---

## Agent 2 — Recommendation engine

**Owner:** Agent 2 (`feat/recommend`, PR #16).
**Status:** shipped.
**Source of truth:** `schemas/founder-passport.ts`, `schemas/recommend.ts`,
`types/api.ts` (re-exports `*Wire` types `z.infer`-derived from the
zod schemas).

### Shared types

```ts
type Bucket = "now" | "next" | "ignore";

type FounderStage =
  | "idea" | "pre_seed" | "mvp"
  | "paying_customers" | "growth" | "mature";

type FounderGoal =
  | "start_business"
  | "raise_seed_round" | "raise_growth_round"
  | "find_customers" | "hire" | "export"
  | "commercialize_research" | "find_workspace"
  | "find_mentors" | "scale_business";

// Listed in chronological order (soonest → latest).
type FounderUrgency =
  | "this_week" | "this_month"
  | "this_quarter" | "next_quarter" | "this_year";

type FounderPassportInputWire = {
  website_url?: string;          // http(s) only — validated server-side
  county?: string;
  city?: string;
  stage?: FounderStage;
  industry?: string;
  communities: string[];         // default []
  goal?: FounderGoal;
  urgency?: FounderUrgency;
  business_size?: string;
  business_type?: string;
  needs: string[];               // default []
  constraints: string[];         // default []
  // Provider id (e.g. "anthropic-fetch") — set by the front-end when
  // the enrich path ran. Server stamps `enriched_at = now` on the
  // persisted row.
  enrichment_source?: string;
};

type RecommendedResourceWire = {
  resource_id: string;           // "r_<csv_id>"
  title: string;
  score: number;                 // 0–100, integer
  bucket: Bucket;
  reasons: string[];             // deterministic, e.g. "Tagged Funding"
  because: string;               // LLM "Because…" sentence; "" on fallback
  action_text: string;           // suggested next action; "" today
  kind?: string;                 // primary topic, lowercased
  source_url?: string;           // http(s) URL when present
  contact_email?: string;
};
```

### `POST /api/v1/resources/recommend`

Score and bucket Utah resources for a founder's profile. Pass
either `passport_id` (re-uses an existing passport row) or a full
`FounderPassportInputWire` (creates one) — but **not both**.

LLM "Because…" is enabled by default; on Anthropic error/timeout
the response degrades gracefully (`because: ""`) — the endpoint
never 5xxs on the LLM.

**Request:** `FounderPassportInputWire & { passport_id?: string }`

```json
{ "passport_id": "fp_priya" }
```

or a full body:

```json
{
  "county": "Salt Lake",
  "city": "Salt Lake City",
  "stage": "paying_customers",
  "industry": "B2B SaaS",
  "communities": ["women"],
  "goal": "raise_seed_round",
  "needs": [],
  "constraints": []
}
```

**Response 200:**

```json
{
  "passport_id": "fp_priya",
  "generated_at": "2026-05-09T00:31:24.123Z",
  "recommendations": [
    {
      "resource_id": "r_2628",
      "title": "Small Business Administration (SBA)",
      "score": 78,
      "bucket": "now",
      "reasons": [
        "Adjacent stage tagged (growth)",
        "Statewide resource",
        "Tagged funding (matches your goal: raise_seed_round)",
        "Tagged software and information technology",
        "For women-focused founders"
      ],
      "because": "Because the SBA is statewide, supports women in software/IT, and tags funding — aligning with your seed-round goal as a B2B SaaS founder.",
      "action_text": "",
      "kind": "funding",
      "source_url": "https://www.sba.gov",
      "contact_email": "info@sba.gov"
    }
  ]
}
```

**Errors:**

- `400 BAD_REQUEST` — invalid request body (zod details in `details`),
  or both `passport_id` AND a full passport body sent. Send one or
  the other; if `passport_id` is provided, the saved row wins.
- `404 NOT_FOUND` — `passport_id` provided but doesn't exist.
- `500 INTERNAL` — DB or unexpected error, or the stored passport's
  `stage` / `goal` is corrupt (out of vocab). Stored `urgency` is
  permissive: corrupt values coerce to `undefined` rather than 500
  (it's `optional` in the schema).

**Side effects:**

- If no `passport_id` is provided, a `founder_passports` row is created.
- The full result set is persisted to `recommendations` (idempotent;
  any prior recs for the passport are deleted first).

---

### `POST /api/v1/founder-passports`

Create a founder passport without computing recommendations.

**Request:** `FounderPassportInputWire`

**Response 201:**

```json
{ "passport_id": "fp_x9p2…" }
```

**Errors:**

- `400 BAD_REQUEST` — invalid input (incl. non-http(s) `website_url`).
- `500 INTERNAL` — DB error.

---

### `GET /api/v1/founder-passports/{id}/plan`

Return the cached recommendations for a passport. Used by the
shareable plan URL the front-end exposes at `/plan/{id}`.

**Path params:** `id` — `fp_…`.

**Response 200:** Same shape as `RecommendResponseWire` from the
recommend endpoint (`passport_id`, `generated_at`,
`recommendations[]`). Empty `recommendations[]` if no plan has been
computed yet — front-end can call `POST /resources/recommend` to
populate.

**Errors:**

- `404 NOT_FOUND` — passport doesn't exist.
- `500 INTERNAL` — DB error.

---

### `POST /api/v1/founder-passports/enrich`

Founder pastes a website URL on the intake form; this endpoint
fetches the page directly and pipes the text through Anthropic
with a structured-output prompt, returning a partial set of fields
the front-end can use to prefill chips. **No persistence** — the
founder reviews + edits, then submits via `POST /founder-passports`.

(Originally designed around Parallel.ai but their Search API
doesn't return structured data and their Task API exceeds the
form-UX latency budget; the fetch+LLM path lands in ~5–10s.)

**Request:**

```json
{ "website_url": "https://example.com" }
```

- Must be `http://` or `https://` (rejects `javascript:` / `data:` /
  `file:` schemes at the schema layer).
- Rejects social / profile hosts (`linkedin.com`, `facebook.com`,
  `instagram.com`, `x.com`, `twitter.com`, `youtube.com`,
  `tiktok.com`, `github.com`) with `400 BAD_REQUEST`.
- Rejects RFC-1918 / loopback / link-local / metadata-service IPs at
  the lib layer (defense-in-depth; Cloudflare blocks egress to
  private IPs at the platform layer in production).

**Response 200:**

```json
{
  "fields": [
    { "name": "industry",      "value": "Software and Information Technology", "confidence": 0.7 },
    { "name": "stage",         "value": "mvp",                                  "confidence": 0.7 },
    { "name": "city",          "value": "Lehi",                                 "confidence": 0.7 },
    { "name": "county",        "value": "Utah",                                 "confidence": 0.7 },
    { "name": "business_type", "value": "B2B SaaS",                             "confidence": 0.7 },
    { "name": "needs",         "value": ["customers", "talent"],                "confidence": 0.7 }
  ]
}
```

**Degraded mode** (fetch failure / non-HTML response / LLM timeout /
parse failure / private-IP rejection):

```json
{ "fields": [], "degraded": true }
```

The endpoint **never returns 5xx** for upstream provider failures —
the front-end can quietly fall back to manual fill.

**Errors:**

- `400 BAD_REQUEST` — invalid URL (non-http(s) scheme) or
  denylisted host.
- `500 INTERNAL` — only on bugs in this handler, not upstream.

---

### Coordination notes for Agent 6

- Endpoints are stable on the wire format above; expect no further
  shape changes from Agent 2.
- Reasons are localized at the API layer (English-only for now).
- The OpenAPI generator should mark `passport_id` with regex
  `^fp_[a-zA-Z0-9_-]+$` and `resource_id` with `^r_[0-9]+$`.
- `score` is a number `0..100` (integer in practice; clients can
  treat as int for sorting/display).
- `generated_at` is RFC 3339 / ISO 8601.
- `kind` is the primary topic, lowercased — same vocabulary as
  `resource_topics.topic` rows.

---

## Agent 4 — Ecosystem Map + Company Profiles

**Owner:** Agent 4 (`feat/agent-4`).
**Status:** PR open.
**Source of truth:** `lib/companies-list.ts` (list shape),
`lib/company-card.ts` (single-card shape),
`lib/investor-brief.ts` (brief shape + zod validators), and
`lib/company-filters.ts` (filter zod schema). All wire fields
`snake_case`; agents never see camelCase.

### Shared types

```ts
type CompanyStatus = "claimed" | "pending" | "unclaimed";
type VerificationStatus = "verified" | "claimed" | "unclaimed";

type CompanyListItemWire = {
  id: string;                  // "co_…"
  slug: string;
  name: string;
  website: string | null;
  sector: string | null;       // CSV `Section` vocabulary, verbatim
  stage: string | null;
  employee_count: string | null; // bucket: "2-10", "11-50", "51-200", …
  hiring_status: boolean;
  logo_url: string | null;
  summary: string | null;       // first sentence of description
  lat: number | null;
  lng: number | null;
  city: string | null;
  county: string | null;
  last_updated_at: string | null; // ISO 8601
  status: CompanyStatus;
};

type CompanyJobWire = {
  title: string;
  url: string | null;
  posted_at: string | null;     // ISO 8601
};

type CompanyCardWire = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  sector: string | null;
  sector_display: string;       // human-friendly variant of `sector`
  stage: string | null;
  description: string | null;
  what_they_sell: string | null; // first sentence
  who_should_contact: string | null;
  agent_brief: string;          // generated "what agents should know"
  employee_count: string | null;
  hiring_status: boolean;
  founding_year: number | null;
  linkedin: string | null;
  logo_url: string | null;
  founder_team: unknown | null; // parsed JSON or null
  address_text: string | null;
  city: string | null;
  county: string | null;
  lat: number | null;
  lng: number | null;
  jobs: CompanyJobWire[];
  verification: {
    status: VerificationStatus;
    verified_at: string | null;
    claimed_at: string | null;
  };
  last_updated_at: string | null;
  canonical_url: string;        // "/startups/<slug>"
  agent_card_urls: {
    html: string;
    markdown: string;
    json: string;
    api: string;
  };
};

type CompanyFilterParamsWire = {
  // Single-sector filter (legacy, still supported):
  sector?: string;
  // Multi-sector (preferred): comma-separated CSV sector strings.
  sectors?: string;
  stage?: string;
  county?: string;
  city?: string;
  // Either pass a bucket directly or a numeric range — both supported.
  employee_bucket?: string;
  min_employees?: number;
  max_employees?: number;
  hiring_status?: boolean;
  q?: string;                   // free-text LIKE on name/slug/website/description
  limit?: number;               // capped at 500
};

type InvestorBriefThemeWire = {
  title: string;
  slugs: string[];              // verified — hallucinated slugs are dropped
  summary: string;
};

type InvestorBriefRaiseWire = {
  slug: string;
  amount: string;
  date: string | null;          // YYYY-MM or null
};

type InvestorBriefResponseWire = {
  headline: string | null;
  metadata: string | null;
  themes: InvestorBriefThemeWire[];
  notable_raises: InvestorBriefRaiseWire[];
  hiring: { open_roles: number; top_hirers: string[] } | null;
  degraded: boolean;            // true on LLM timeout / parse fail / empty input
};
```

### `GET /api/v1/companies`

List companies with filters. Powers the `/map` view AND the
`/onboarding/owner` claim search (Agent 5's contract). Cap is 500 rows.

**Query params:** any subset of `CompanyFilterParamsWire`.

**Response 200:**

```json
{
  "companies": [
    {
      "id": "co_xfxt0a4ovbpvgffq",
      "slug": "crew",
      "name": "Crew",
      "website": "https://www.trycrew.com",
      "sector": "FinTech",
      "stage": "seed",
      "employee_count": "2-10",
      "hiring_status": false,
      "logo_url": null,
      "summary": "Crew is a neobank for families.",
      "lat": 40.3916,
      "lng": -111.8508,
      "city": "Lehi",
      "county": "Utah",
      "last_updated_at": null,
      "status": "unclaimed"
    }
  ],
  "total": 1
}
```

**Errors:**

- `400 BAD_REQUEST` — invalid filter (zod details in `details`).
- `500 INTERNAL` — DB error.

**Examples:**

```bash
curl 'https://startup.utah.gov/api/v1/companies?sector=FinTech'
curl 'https://startup.utah.gov/api/v1/companies?sector=FinTech&stage=seed&county=Salt%20Lake'
curl 'https://startup.utah.gov/api/v1/companies?min_employees=11&max_employees=50&hiring_status=true'
curl 'https://startup.utah.gov/api/v1/companies?q=labs'  # name/slug/website search
```

---

### `GET /api/v1/companies/{slug}`

Full Agent Card for a single company. Same shape as
`GET /startups/{slug}.json`. Joins jobs + locations + verification
status.

**Path params:** `slug` — URL-safe lowercase identifier.

**Response 200:** `CompanyCardWire` (see shared types above).

**Errors:**

- `404 NOT_FOUND` — slug doesn't match any company.
- `500 INTERNAL` — DB error.

---

### `POST /api/v1/companies/investor-brief`

Source-bound investor narrative over the currently-filtered company
set. The endpoint **never throws** — on Anthropic timeout / parse
failure it returns `{ degraded: true, themes: [], … }` so the UI can
fall back gracefully.

**Request:**

```json
{
  "filter": { "sector": "FinTech", "stage": "seed" },
  "slugs": ["crew", "bracket-labs", "streamos"]
}
```

- `filter` — any `CompanyFilterParamsWire`. Used as a fallback to
  derive companies if `slugs` is empty.
- `slugs` — explicit list of slugs to brief on (preferred; the map
  passes its currently-rendered set). Capped at 120.

**Response 200:** `InvestorBriefResponseWire`.

```json
{
  "headline": "Utah seed-stage fintech: consumer money tools meet finance-team automation",
  "metadata": "5 companies · Utah & Salt Lake counties · ~19-70 employees",
  "themes": [
    {
      "title": "Consumer & Family Neobanking",
      "slugs": ["crew", "swyf"],
      "summary": "Everyday-user financial apps focused on simple, life-oriented money management."
    }
  ],
  "notable_raises": [],
  "hiring": { "open_roles": 0, "top_hirers": [] },
  "degraded": false
}
```

**Slug verification:** any slug returned by the model that wasn't in
the input set is dropped before the response is sent. Empty themes
are filtered out.

**Errors:**

- `400 BAD_REQUEST` — body isn't JSON or fails the zod schema.
- `500 INTERNAL` — only on bugs in this handler, not upstream.

---

### `GET /startups/{slug}.md`

Markdown agent card. Same source as `/api/v1/companies/{slug}`
formatted as Markdown via `lib/company-card.ts → toMarkdown()`.

**Response 200:** `Content-Type: text/markdown; charset=utf-8`.
Includes a Facts table, About, "What agents should know", Open
roles, Links, and a footer attribution line.

**Errors:** `404 NOT_FOUND` (text/plain body).

---

### `GET /startups/{slug}.json`

JSON agent card. **Identical shape** to `/api/v1/companies/{slug}`.
Lives at the human-readable `/startups/<slug>.json` URL via Next.js
rewrites in `next.config.ts` (the file-system route is at
`app/startups/[slug]/route.json/route.ts`).

**Response 200:** `CompanyCardWire`.

**Errors:** `404 NOT_FOUND` with the standard error envelope.

---

### Coordination notes for Agent 6

- Wire is byte-for-byte identical between `GET /api/v1/companies/:slug`
  and `GET /startups/:slug.json` — point the OpenAPI ref at the same
  schema.
- `sector` is **verbatim** from the seeded CSV (`FinTech`,
  `B2B Software`, `Aerospace and Defense`, `Bio/Medical Tech`, etc.).
  Don't normalize at the wire boundary; agents need parity with the
  underlying data.
- `stage` is lower-cased on seed (`"seed"`, `"series a"`, `"pre-seed"`,
  …); the GET filter handler also lower-cases incoming `stage`
  parameters defensively.
- `employee_count` is bucket-shaped text (`"2-10"`, `"11-50"`,
  `"51-200"`, `"201-500"`, `"501-1K"`, `"1K-5K"`, `"5K+"`).
  `lib/employee-bucket.ts` parses and intersects.
- `lat` / `lng` are city/county centroids (Agent 1's `centroids.ts`
  fallback) when the source doesn't provide explicit coordinates;
  expect stacked pins for cities with several seeded companies.
- The investor-brief endpoint is intentionally agent-native: an MCP
  tool wrapper around it would expose the structured `themes[]` /
  `notable_raises[]` shape directly, no parsing required.
- The `.md` and `.json` URLs at `/startups/:slug.{md,json}` rely on
  rewrites in `next.config.ts`. The native file-system path is
  `/startups/:slug/route.{md,json}` — both work in production, the
  rewrites just expose the cleaner URL the brief and product-plan
  reference.
