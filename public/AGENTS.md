# Startup State Atlas — agent instructions

You are helping founders, investors, and business owners navigate
Utah's startup ecosystem through the Startup State Atlas API. This
document defines the contract: required intake fields, the
endpoints you should reach for, how to authenticate writes, and
the response shapes you'll get back.

For machine-readable details, fetch
[`/api/v1/openapi.json`](/api/v1/openapi.json). For more agent rules
(including citation discipline) see [`/llms.txt`](/llms.txt).

## Before recommending

Always collect these fields first. Without them, the scoring engine
returns weak recommendations:

- **`county`** or **`city`** — Utah county (e.g. `Salt Lake`,
  `Washington`, `Weber`, `Utah`)
- **`stage`** — one of `idea`, `pre_seed`, `mvp`,
  `paying_customers`, `growth`, `mature`
- **`industry`** — free-text but consistent (e.g. `B2B SaaS`,
  `agriculture`, `manufacturing`, `medical_device`, `deep_tech`)
- **`goal`** — one of `start_business`, `raise_seed_round`,
  `raise_growth_round`, `find_customers`, `hire`, `export`,
  `commercialize_research`, `find_workspace`, `find_mentors`,
  `scale_business`
- **`communities`** (optional but high-signal) — e.g. `women`,
  `veteran`, `student`, `rural`, `researcher`

## Endpoints you will use most

| Goal | Endpoint |
| --- | --- |
| Score Utah resources for a founder | `POST /api/v1/resources/recommend` |
| Re-read a saved plan | `GET /api/v1/founder-passports/{id}/plan` |
| Search the resource library | `GET /api/v1/resources?q=…` |
| Search companies | `GET /api/v1/companies?q=…` |
| Read a single company | `GET /api/v1/companies/{slug}` |
| Generic search across both | `GET /api/v1/search?q=…&type=all` |
| Start an intake from a website | `POST /api/v1/founder-passports/enrich` |
| Update a company profile (machine) | `PATCH /api/v1/companies/{slug}` |

## Authentication

Two authentication modes:

- **Better Auth session cookie** — human users only. Set by
  `/sign-up` or `/sign-in`. Roles: `owner`, `goeo_admin`,
  `superadmin`. Owner-edit on `PATCH /companies/{slug}` requires
  the session user id to match `companies.claimed_by_user_id`.
- **`X-Atlas-Admin-Token`** header — machine clients. Validated
  against the Worker's `ATLAS_ADMIN_TOKEN` secret. Set this header
  on every write request you make. Read endpoints don't require
  it. **Never impersonate a human session.**

```bash
curl -H "X-Atlas-Admin-Token: $ATLAS_ADMIN_TOKEN" \
  -X PATCH https://startupstateatlas.dev/api/v1/companies/crew \
  -H 'Content-Type: application/json' \
  -d '{"description":"Updated bio."}'
```

## Sample request — recommend

```bash
curl -X POST https://startupstateatlas.dev/api/v1/resources/recommend \
  -H 'Content-Type: application/json' \
  -d '{
    "county": "Salt Lake",
    "stage": "paying_customers",
    "industry": "B2B SaaS",
    "communities": ["women"],
    "goal": "raise_seed_round",
    "needs": [],
    "constraints": []
  }'
```

Response:

```json
{
  "passport_id": "fp_…",
  "narrative": "You're at paying-customers stage, but most Utah women-focused funding pipelines are tagged for growth-stage — that's adjacent enough to apply, not a perfect fit. The SBA and SBDC are statewide and used to B2B SaaS founders; Women's Business Center of Utah and LiaLaunch are network plays for warm intros, not capital sources.",
  "generated_at": "2026-05-09T00:00:00Z",
  "recommendations": [
    {
      "resource_id": "r_2628",
      "title": "Small Business Administration (SBA)",
      "score": 78,
      "bucket": "now",
      "reasons": ["Tagged funding (matches your goal: raise_seed_round)"],
      "because": "Tagged funding — matches your Seed round goal",
      "action_text": "",
      "kind": "funding",
      "source_url": "https://www.sba.gov",
      "contact_email": "info@sba.gov"
    }
  ]
}
```

`narrative` is plan-scoped synthesis (60–100 words). `because` is a
humanized one-liner per rec — the strongest scoring reason translated
to natural language, never snake_case.

## MCP — Streamable HTTP endpoint

`/api/mcp` exposes the read-only tool surface to MCP clients without
an install or local checkout. It speaks the [MCP Streamable HTTP
transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http)
in **stateless** mode — every request is independent, no session id,
no resume.

- **URL**: `https://startupstateatlas.dev/api/mcp`
- **Methods**: `GET`, `POST`, `DELETE`
- **Auth**: none — public, read-only.
- **Content-Type**: `application/json`. Set
  `Accept: application/json, text/event-stream` if your client wants
  SSE; otherwise plain JSON responses are returned.
- **Payload**: standard JSON-RPC 2.0 envelope.

```bash
curl -N https://startupstateatlas.dev/api/mcp \
  -X POST \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Read tools (`recommend_resources`, `search_resources`, `get_resource`,
`search_companies`, `get_company`, `generate_founder_plan`,
`generate_investor_tour`) and `startupstate://…` resources are
exposed. **Write tools are not.** `update_company_profile` is local-
stdio only — run `npm run mcp` from a checkout with
`ATLAS_ADMIN_TOKEN` in env. See [`/agents`](/agents) for the full
tool / resource / prompt listing.

## Error envelope

Every non-2xx response uses the same shape:

```json
{ "error": { "code": "bad_request", "message": "…", "details": {} } }
```

| Code | Meaning |
| --- | --- |
| `bad_request` | Validation error or malformed request |
| `not_found` | The id / slug does not exist |
| `forbidden` | Authenticated but not authorized |
| `unauthorized` | Missing or invalid authentication |
| `conflict` | The request collides with existing state |
| `internal` | Unexpected server error |

If `bad_request` carries `details`, it's the zod issue list — read
it before retrying.

## What you must not do

- Do not recommend a resource that does not appear in
  `GET /api/v1/resources` or in a `recommend` response.
- Do not invent company facts. Always read
  `GET /api/v1/companies/{slug}`.
- Do not try to claim a company on a user's behalf. Ownership
  verification requires a logged-in browser session and a document
  upload to R2. Send users to `/sign-up` and the
  `/onboarding/owner` flow instead.
- Do not include `passport_id` together with a full passport body
  on `POST /resources/recommend` — the endpoint will return 400.
  Send one or the other.
- Do not call write endpoints without `X-Atlas-Admin-Token`.

## Test fixtures

Six personas are seeded with canonical IDs. Pass them to
`POST /resources/recommend` as `{ "passport_id": "fp_<name>" }`:

- `fp_jordan` — Salt Lake, idea-stage, student, starting a business
- `fp_maria` — Washington county, growth-stage, rural agriculture
- `fp_marcus` — Weber, manufacturing, veteran founder
- `fp_priya` — Salt Lake, paying customers, B2B SaaS, raising seed
- `fp_david` — Utah county, growth-stage medical device, exporting
- `fp_amir` — Salt Lake, idea-stage deep tech, commercializing research
