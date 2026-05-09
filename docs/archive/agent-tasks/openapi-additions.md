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

## Agent 4 — companies + agent cards

**Owner:** Agent 4 (`feat/map`).
**Status:** shipping.
**Source of truth:** `lib/company-card.ts` (shared formatter for
`/startups/{slug}` HTML, the markdown / JSON agent cards, and the
JSON payload from `/api/v1/companies/{slug}`).

### `GET /api/v1/companies`

List + filter companies. Backs the `/map` view AND the
`/onboarding/owner` company-search step (which needs `q`, `limit`,
and the `status` field to surface claimed-vs-pending badges).

**Query params (all optional):**

| name | type | notes |
| --- | --- | --- |
| `sector` | string | exact match against `companies.sector` |
| `stage` | string | exact match against `companies.stage` |
| `county` | string | matches `company_locations.county` |
| `city` | string | matches `company_locations.city` |
| `min_employees` | int | min lower bound of the band |
| `max_employees` | int | max upper bound of the band |
| `hiring_status` | `"true" \| "false"` | |
| `q` | string | LIKE `%term%` on name / slug / website / description / sector |
| `limit` | int | default 500, max 500 |

**Response 200:**

```json
{
  "companies": [
    {
      "id": "co_…",
      "slug": "crew",
      "name": "Crew",
      "sector": "FinTech",
      "stage": "seed",
      "employee_count": "2-10",
      "hiring_status": false,
      "lat": 40.39,
      "lng": -111.85,
      "logo_url": null,
      "website": "https://www.trycrew.com",
      "summary": "Crew is a neobank for families…",
      "county": "Utah",
      "city": "Lehi",
      "claimed_by_user_id": null,
      "status": "unclaimed"
    }
  ],
  "total": 1
}
```

`status` is `"claimed" | "pending" | "unclaimed"` derived from
`claimed_by_user_id` plus a join to `business_ownership_submissions`
(status='pending'). Map UI ignores it; owner onboarding uses it.

### `POST /api/v1/companies`

Admin / machine-token-only company create. Used by `/admin/companies`
and CLI/MCP tooling. Owned by **Agent 5** (auth/admin).

**Request:**

```json
{ "slug": "acme", "name": "Acme", "website": "https://acme.test", … }
```

**Response 201:** `{ "id": "co_…", "slug": "acme" }`.

### `GET /api/v1/companies/{slug}`

Single company. Same shape as `GET /startups/{slug}/route.json`.
See "Company card shape" below.

### `PATCH /api/v1/companies/{slug}`

Owned by **Agent 5** (`feat/auth-claim-admin`). Three auth modes:
owner session (whitelist), admin session (no whitelist), machine
token (no whitelist). Writes a `profile_updates` audit row on every
successful PATCH, capturing `source_client` (`owner` / `staff` /
`machine` / custom via `X-Source-Client` header).

### `DELETE /api/v1/companies/{slug}`

Owned by **Agent 5**. Admin / machine token only. Returns `204`.

### `POST /api/v1/companies/brief`

Source-bound LLM cluster summary for an investor. Always returns
200 with `degraded: true` on Anthropic upstream failure.

**Request:**

```json
{
  "filter": {
    "sector": "FinTech",
    "stage": "seed",
    "county": "Salt Lake",
    "hiring": "true",
    "q": ""
  },
  "slugs": ["crew", "swyf", "elements"]
}
```

`slugs` is required and capped at 80 server-side. `filter` is
descriptive only — used to compose `filter_summary`; the cluster
reasoning runs against the slugs.

**Response 200:**

```json
{
  "filter_summary": "Utah seed-stage FinTech, Salt Lake County, hiring.",
  "total_in_view": 3,
  "clusters": [
    {
      "title": "Consumer & family banking",
      "count": 2,
      "slugs": ["crew", "swyf"],
      "summary": "Neobanks targeting families and underserved consumers."
    }
  ],
  "hiring_summary": "All three are actively hiring.",
  "degraded": false
}
```

### `GET /startups/{slug}/route.md`

Markdown agent card. `Content-Type: text/markdown; charset=utf-8`,
`Cache-Control: public, max-age=60`. Body is whatever
`formatCompanyCardMarkdown()` produces — hero, facts, links,
location, team, open roles, plus a footer that lists the four
canonical URLs (HTML, .md, .json, /api/v1).

### `GET /startups/{slug}/route.json`

JSON agent card. Same shape as `/api/v1/companies/{slug}` plus an
`agent_card` object pointing to the canonical URLs.

### Company card shape

`lib/company-card.ts` `toWireCompanyCard()` emits:

```json
{
  "id": "co_…",
  "slug": "crew",
  "name": "Crew",
  "website": "https://www.trycrew.com",
  "description": "…",
  "sector": "FinTech",
  "stage": "seed",
  "employee_count": "2-10",
  "hiring_status": false,
  "founding_year": null,
  "linkedin": "https://www.linkedin.com/company/trycrew",
  "logo_url": null,
  "founder_team": [{ "name": "…", "title": "…", "linkedin": "…" }],
  "address_text": "2000 Ashton Boulevard, Lehi, UT",
  "lat": 40.39,
  "lng": -111.85,
  "locations": [{ "county": "Utah", "city": "Lehi" }],
  "jobs": [
    { "id": 1, "title": "Engineer", "url": "…", "posted_at": "2026-01-…" }
  ],
  "verified_at": null,
  "claimed_at": null,
  "claimed": false,
  "last_updated_by": null,
  "last_updated_at": null,
  "agent_card": {
    "markdown_url": "/startups/crew/route.md",
    "json_url": "/startups/crew/route.json",
    "api_url": "/api/v1/companies/crew"
  }
}
```
