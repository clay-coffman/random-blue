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
