# OpenAPI additions

A staging file for endpoint shapes that Agent 6 folds into
`app/api/v1/openapi.yaml`. Each agent appends a section when their
endpoints are final; Agent 6 reconciles.

## Conventions

- Path prefix `/api/v1`.
- Error shape (frozen): `{ "error": { "code": string, "message": string, "details"?: unknown } }`.
- `Content-Type: application/json` on every request and response.
- Status codes used: `200`, `201`, `400` (`BAD_REQUEST`), `404` (`NOT_FOUND`), `500` (`INTERNAL`).

---

## Agent 2 — Recommendation engine

**Owner:** Agent 2 (`feat/recommend`).
**Status:** shipped (PR pending).

### Shared types

```ts
type FounderStage =
  | "idea" | "pre_seed" | "mvp"
  | "paying_customers" | "growth" | "mature";

type FounderGoal =
  | "start_business"
  | "raise_seed_round" | "raise_growth_round"
  | "find_customers" | "hire" | "export"
  | "commercialize_research" | "find_workspace"
  | "find_mentors" | "scale_business";

type FounderUrgency =
  | "this_week" | "this_month"
  | "this_quarter" | "this_year" | "next_quarter";

type FounderPassportInput = {
  county?: string;
  city?: string;
  stage: FounderStage;
  industry: string;
  communities: string[];   // default []
  goal: FounderGoal;
  urgency?: FounderUrgency;
  business_size?: string;
  business_type?: string;
  needs: string[];         // default []
  constraints: string[];   // default []
  website_url?: string;    // RFC 3986 URL
};

type Bucket = "now" | "next" | "ignore";

type RecommendedResource = {
  resource_id: string;            // "r_<csv_id>"
  title: string;
  source_url: string | null;
  score: number;                  // 0–100
  bucket: Bucket;
  reasons: string[];              // deterministic, e.g. "Tagged Funding"
  why: string | null;             // LLM "Because…" sentence
  action: string | null;          // null in v1
};
```

### `POST /api/v1/resources/recommend`

Score and bucket Utah resources for a founder's profile. Pass
either `passport_id` (re-uses an existing passport row) or a full
`FounderPassportInput` (creates one). LLM "Because…" enabled by
default; on Anthropic error/timeout the response degrades gracefully
(`why: null`, `llm_used: false`) — the endpoint never 5xxs on the LLM.

**Request:** `FounderPassportInput & { passport_id?: string }`

```json
{
  "passport_id": "fp_priya"
}
```

or

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
  "llm_used": true,
  "recommendations": [
    {
      "resource_id": "r_2543",
      "title": "Salt Lake Angels",
      "source_url": "https://saltlakeangels.com",
      "score": 87,
      "bucket": "now",
      "reasons": [
        "Matches stage: paying_customers",
        "Applies in Salt Lake County",
        "Tagged funding (matches your goal: raise_seed_round)",
        "Tagged software and information technology"
      ],
      "why": "Because you have paying customers and are raising your seed round in Salt Lake County, this angel group invests in B2B SaaS at exactly your stage.",
      "action": null
    }
  ]
}
```

**Errors:**

- `400 BAD_REQUEST` — invalid request body (zod details in `details`).
- `404 NOT_FOUND` — `passport_id` provided but doesn't exist.
- `500 INTERNAL` — DB or unexpected error.

**Side effects:**

- If no `passport_id` is provided, a `founder_passports` row is created.
- The full result set is persisted to `recommendations` (idempotent;
  any prior recs for the passport are deleted first).

---

### `POST /api/v1/founder-passports`

Create a founder passport without computing recommendations.

**Request:** `FounderPassportInput`

**Response 201:**

```json
{ "passport_id": "fp_x9p2…" }
```

**Errors:**

- `400 BAD_REQUEST` — invalid input.
- `500 INTERNAL` — DB error.

---

### `GET /api/v1/founder-passports/{id}/plan`

Return the cached recommendations for a passport. Used by the
shareable plan URL the front-end exposes at `/plan/{id}`.

**Path params:** `id` — `fp_…`.

**Response 200:**

Same shape as the recommend endpoint (`passport_id`,
`recommendations[]`, `llm_used`). Empty `recommendations[]` if no
plan has been computed yet — front-end can call POST `/resources/recommend`
to populate.

**Errors:**

- `404 NOT_FOUND` — passport doesn't exist.
- `500 INTERNAL` — DB error.

---

### `POST /api/v1/founder-passports/enrich`

Founder pastes a website URL on the intake form; this endpoint
calls Parallel.ai and returns a partial `FounderPassportInput` with
per-field confidences so the front-end can prefill chips. **No
persistence** — the founder reviews + edits, then submits via
`POST /founder-passports`.

**Request:**

```json
{ "website_url": "https://example.com" }
```

Rejects social / profile hosts (`linkedin.com`, `facebook.com`,
`instagram.com`, `x.com`, `twitter.com`, `youtube.com`, `tiktok.com`,
`github.com`) with `400 BAD_REQUEST`.

**Response 200:**

```json
{
  "fields": {
    "industry": { "value": "Software and Information Technology", "confidence": 0.85 },
    "stage":    { "value": "mvp",                                  "confidence": 0.6 },
    "city":     { "value": "Lehi",                                 "confidence": 0.9 },
    "county":   { "value": "Utah",                                 "confidence": 0.9 },
    "business_type": { "value": "B2B SaaS",                        "confidence": 0.7 },
    "needs":    { "value": ["customers", "talent"],                "confidence": 0.5 }
  },
  "source_url": "https://example.com",
  "fetched_at": 1715199900000
}
```

**Degraded mode** (Parallel timeout / 5xx / API key missing in dev):

```json
{
  "fields": {},
  "source_url": "https://example.com",
  "fetched_at": 1715199900000,
  "degraded": true
}
```

The endpoint **never returns 5xx** for upstream provider failures —
the front-end can quietly fall back to manual fill.

**Errors:**

- `400 BAD_REQUEST` — invalid URL or denylisted host.
- `500 INTERNAL` — only on bugs in this handler, not upstream.

---

### Coordination notes for Agent 6

- Endpoints are stable; expect no shape changes.
- Reasons are localized at the API layer (English-only for now).
- `llm_used` toggles per-request (true when Anthropic returned ≥1
  parseable explanation, false on full fallback).
- The OpenAPI generator should mark `passport_id` with the regex
  `^fp_[a-zA-Z0-9_-]+$` and `resource_id` with `^r_[0-9]+$`.
