# Agent 2 — Recommendation engine

You build the API endpoint that powers the Founder Navigator's results
page. Deterministic scoring first, LLM explanations second. Aim for
~90 minutes.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 1).
- **Branch:** `feat/recommend`. First action:
  `git checkout -b feat/recommend`.

## Reads first

1. `docs/implementation-plan.md` — your phase + the coordination
   point with Agent 6 (`docs/agent-tasks/openapi-additions.md`).
2. `docs/agent-tasks/00-shared-context.md`.
3. `docs/architecture.md` — error shape, lib/ helpers,
   `lib/anthropic.ts`.
4. `docs/requirements.md` — Recommendation engine section.
5. `docs/hackathon-plan.md` lines 84–115 (the scoring formula and
   the source-bound LLM prompt).
6. **`docs/source_data/Resources List - Builder Day - Sheet1.csv`**
   — the actual resource taxonomy you'll be scoring against. Real
   columns: `Communities`, `Industries`, `Locations`, `Topics`. All
   pipe-separated. **Communities is empty for most rows.**
   **Industries vocabulary is GOED's** (`Aerospace and Defense`,
   `Software and Information Technology`, `Life Sciences and Healthcare`,
   etc.) — not the brief's "B2B SaaS / FinTech / AI" shorthand.
   **Topics carries lifecycle markers** like `Late Stage Growth`.
7. **`docs/source_data/page-2026-05-08-19-38-24.md`** — the canonical
   GOED brief; verbatim persona descriptions in § Test Cases.
8. `db/schema.ts` (after Agent 1 freezes it) — table shapes for
   joins.
9. `db/seed/personas.ts` — your test inputs.
10. The **`claude-api`** loaded skill — required reading for the
    Anthropic call. Use prompt caching.

## Depends on

- **Agent 1 done.** You need `resources`, `resource_*` join tables,
  `founder_passports`, and the persona fixtures in D1.
- **Agent 0 done.** You need `lib/anthropic.ts`, `lib/db.ts`,
  `lib/api-error.ts`, `lib/ids.ts`, `lib/cf.ts`.

## Owns (write surface)

- `app/api/v1/resources/recommend/route.ts` — the POST endpoint.
- `app/api/v1/founder-passports/route.ts` — POST (create passport).
- `app/api/v1/founder-passports/[id]/plan/route.ts` — GET (cached
  plan).
- `app/api/v1/founder-passports/enrich/route.ts` — POST. Takes a
  founder-supplied business website URL, calls Parallel.ai, returns
  a partial `FounderPassportInput` for Agent 3 to prefill the form
  with. **No persistence on this call** — persistence happens on
  the existing intake POST once the founder submits.
- `lib/recommend.ts` — scoring lib (pure, testable).
- `lib/parallel.ts` — Parallel.ai client (mirrors `lib/anthropic.ts`;
  reads `PARALLEL_API_KEY` from `env()`).
- `schemas/founder-passport.ts` — zod schema for the request (incl.
  optional `website_url`).
- `types/api.ts` additions for recommend request/response **and**
  enrich request/response.
- `tests/recommend.test.ts` (Vitest) — unit tests for scoring.

You do NOT touch:

- `db/schema.ts` (Agent 1).
- `app/api/v1/openapi.yaml` (Agent 6) — but **tell Agent 6** when
  your endpoint shapes are final.
- UI files (`app/founder/*`).

## Deliverables

### 1. `schemas/founder-passport.ts`

Zod schema validating the intake request:

```ts
import { z } from 'zod';

export const FounderPassportInput = z.object({
  county: z.string().optional(),
  city: z.string().optional(),
  stage: z.enum([
    'idea', 'pre_seed', 'mvp', 'paying_customers',
    'growth', 'mature',
  ]),
  industry: z.string(),
  communities: z.array(z.string()).default([]),
  goal: z.enum([
    'start_business', 'raise_seed_round', 'raise_growth_round',
    'find_customers', 'hire', 'export', 'commercialize_research',
    'find_workspace', 'find_mentors', 'scale_business',
  ]),
  urgency: z.enum(['this_week', 'this_month', 'next_quarter']).optional(),
  business_type: z.string().optional(),
  needs: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  website_url: z.string().url().optional(),    // optional URL the founder
                                                // pasted on the intake form
                                                // (see § Enrich endpoint).
});

export type FounderPassportInput = z.infer<typeof FounderPassportInput>;
```

### 2. `lib/recommend.ts` — deterministic scoring

Pure function. Easy to unit-test. Implements the formula from
`docs/hackathon-plan.md` lines 91–99:

```
resource_score =
    25 * stage_match
  + 20 * location_match
  + 20 * goal_topic_match
  + 15 * industry_match
  + 10 * community_match
  + 10 * semantic_similarity   // optional; default 0 in v1
```

Each `_match` is 0 or 1 (or partial 0..1 for fuzzy matches like
"adjacent county"). Skip semantic_similarity for v1.

**Scoring notes for the real source data:**

- **`stage_match`** uses `resource_topics` rows (the source CSV's
  `Topics` column carries values like `Late Stage Growth`,
  `Pre-Seed`, etc.). Map the founder's structured `stage` enum
  (`idea` / `pre_seed` / `mvp` / `paying_customers` / `growth` /
  `mature`) to the source labels with a small lookup. Don't reject a
  resource just because the topic vocabulary differs — partial-match
  if the lookup is fuzzy.
- **`location_match`** must respect `resource_locations.statewide`.
  A `statewide=true` row matches any Utah county (score full 20).
  Otherwise compare by county; partial credit for adjacent counties
  if you have time.
- **`industry_match`** compares against `resource_industries.industry`,
  which uses GOED vocabulary (`Aerospace and Defense`,
  `Software and Information Technology`, …). The founder's
  `industry` field is more colloquial (`B2B SaaS`, `FinTech`).
  Build a small alias map (`B2B SaaS → Software and Information Technology`,
  `FinTech → Financial Services`, …) so the match resolves. Empty
  industry on the founder side → skip the component (don't penalize).
- **`community_match`** is empty for most resources (only ~10 of the
  226 have any value). Treat empty as "doesn't matter" — full credit
  if the founder has no community tags either; zero contribution
  otherwise (don't penalize).
- **`goal_topic_match`** is the most important after stage. Map
  founder `goal` enum to topics: `raise_seed_round` → `Funding`,
  `find_mentors` → `Mentorship`, `start_business` → `Education`, etc.
  When in doubt, lean on the resource's title and description.
- A passing reasonable score for our data is ~50–80; perfect 100s
  will be rare. Don't tune the weights to hit 90+.

```ts
export function scoreResource(
  resource: ResourceRow,
  passport: FounderPassportInput,
): { score: number; reasons: string[] } {
  // Compute each component, accumulate score, push human-readable
  // reasons for each non-zero component:
  // "Matches stage: paying_customers"
  // "Applies in Salt Lake County"
  // "Tagged Funding (matches your goal: raise_seed_round)"
  // …
}
```

Return reasons in plain English for direct display in the UI.

### 3. `app/api/v1/resources/recommend/route.ts`

POST endpoint that:

1. Validates the request body with `FounderPassportInput`.
2. Optionally creates a `founder_passports` row (if no `passport_id`
   in body). Returns the passport ID.
3. Loads candidate resources (all of them — D1 holds <500 — or
   pre-filtered by county/industry to limit the candidate set).
4. Calls `scoreResource` for each. Sorts desc.
5. Buckets into:
   - **Do this now** — top 3.
   - **Do this next** — next 3.
   - **Ignore for now** — anything below score 25 that nearly
     matched (1–2 components only).
6. Calls Anthropic with a **source-bound prompt** that returns
   one-sentence "why this matched" explanations citing only resource
   IDs from the retrieved set. Use prompt caching (per
   `claude-api` skill).
7. Persists the recommendations to the `recommendations` table for
   later GET.
8. Returns:
   ```json
   {
     "passport_id": "fp_…",
     "recommendations": [
       {
         "resource_id": "r_…",
         "title": "USU Remote Online Initiative",
         "score": 87,
         "bucket": "now",
         "why": ["Applies in Washington County", "Tagged Rural"],
         "action": "Review e-commerce and remote-work training support"
       }
     ]
   }
   ```

### 4. The Anthropic call (source-bound)

Per `docs/hackathon-plan.md` lines 100–109. Prompt skeleton:

```
You are explaining why retrieved resources match a Utah founder's
profile. Use ONLY the resources I provide. Cite each by its
resource_id. Do not invent eligibility. Do not recommend anything
outside the retrieved set.

<founder>
{passport JSON}
</founder>

<retrieved>
{ for each resource: id, title, key fields, bullet matches }
</retrieved>

For each resource, output one sentence (≤25 words) starting with
"Because…" that cites the matching fields.
```

Use prompt caching on the system prompt + the founder profile (the
retrieved set varies). Default model: `claude-opus-4-7`. Use the
`lib/anthropic.ts` client.

### 5. Cached plan endpoint

`GET /api/v1/founder-passports/:id/plan` — returns the cached
`recommendations` rows for a passport, formatted the same way. Used
by the front-end's shareable plan URL.

### 5b. Enrich endpoint — `POST /api/v1/founder-passports/enrich`

The Founder Navigator's intake form has an optional URL field. When
the founder pastes a website, the front-end calls this endpoint and
uses the response to prefill the form. The founder reviews + edits
before submitting, so this is a UX-quality endpoint (not a
correctness-critical one) — it can return partial / lower-confidence
results.

- **Request:** `{ website_url: string }`. Validate the URL; reject
  obviously-non-business hosts (e.g. linkedin.com, facebook.com,
  x.com) with a `BAD_REQUEST` error in the standard error shape.
  See `requirements.md` § Out of scope — LinkedIn enrichment is
  deferred. Business websites only.
- **Response:** a partial `FounderPassportInput` plus a per-field
  confidence so Agent 3 can render "filled from your site" chips:
  ```json
  {
    "fields": {
      "industry":      { "value": "Software and Information Technology", "confidence": 0.85 },
      "stage":         { "value": "mvp",                                  "confidence": 0.6  },
      "city":          { "value": "Lehi",                                 "confidence": 0.9  },
      "county":        { "value": "Utah",                                 "confidence": 0.9  },
      "business_type": { "value": "B2B SaaS",                             "confidence": 0.7  },
      "needs":         { "value": ["customers", "talent"],                "confidence": 0.5  }
    },
    "source_url": "https://example.com",
    "fetched_at": 1715199900000
  }
  ```
- **No persistence.** This endpoint doesn't insert a
  `founder_passports` row. Persistence happens later on the intake
  POST when the founder submits — that POST already accepts
  `website_url` (added in § 1) and the route handler stamps
  `enriched_at` + `enrichment_source` if the front-end indicates the
  enrich path ran.
- **Implementation calls `lib/parallel.ts`.** The Parallel.ai
  endpoint choice (Task vs Search vs Extract) is implementation's
  call — for sub-30s form UX, Search or Extract is more likely the
  right pick than Task. See Parallel.ai docs.
- **Hard timeout** of 15s on the upstream call; on timeout or 5xx,
  return an empty `fields: {}` response with a `degraded: true`
  flag so the front-end can quietly fall back to manual fill. The
  endpoint must never 5xx the form into a dead end.
- **Cost / cache hint:** keying a small in-memory or D1 cache by
  normalized URL is a good idea for cost (re-submits, bot traffic,
  etc.). Decide at implementation.

Tell Agent 6 about the enrich endpoint shape via
`docs/agent-tasks/openapi-additions.md`.

### 6. Persona test fixtures

In `tests/recommend.test.ts` (Vitest), feed each persona through
`scoreResource` against a small handcrafted resource fixture set and
assert that the expected resources rank highly. Catches regressions
when you tune scoring.

### 7. Update `types/api.ts`

Export `RecommendRequest`, `RecommendResponse`, `RecommendedResource`
types from zod schemas. Front-end and CLI import from here.

### 8. Tell Agent 6

Drop a note in `docs/agent-tasks/openapi-additions.md` (create if
missing) listing your endpoints + their request/response shapes so
Agent 6 can fold them into `app/api/v1/openapi.yaml`.

## DONE when

1. `curl -X POST http://localhost:3000/api/v1/resources/recommend
   -H 'Content-Type: application/json' -d @fixtures/priya.json`
   returns at least 3 scored recommendations.
2. The reasons array on each recommendation cites real fields
   ("Applies in Salt Lake County", "Tagged Software and Information
   Technology").
3. The Anthropic explanations cite only resource IDs from the
   retrieved set (no hallucinated IDs).
4. Each persona produces a meaningfully different top-3 (Jordan vs
   Priya should not overlap on most resources).
5. `tests/recommend.test.ts` passes (`npm test`).
6. `GET /api/v1/founder-passports/:id/plan` returns the cached
   recommendations.
7. PR open.

## Demo path

Enables **Scene 1 (Jordan)** and **Scene 2 (Priya)** of the demo
script. The "Try Priya" button on the Founder Navigator UI calls
your endpoint.

## Cuts allowed if time-pressed

- **Skip the enrich endpoint and `lib/parallel.ts`.** Coordinate
  with Agent 3 — they fall back to manual fill (the always-works
  path). The URL field can stay in the form and just submit
  alongside the intake; we still capture `website_url` for future
  enrichment.
- **Skip persistence** to `recommendations` table — recompute on
  every GET. Simpler.
- **Skip the LLM explanation** — just return `reasons[]` from
  `scoreResource`. Less polish but works.
- **Skip prompt caching** — fewer tokens, but easier code.
- **Skip "Ignore for now" bucket** — only return the top-6.

## Common pitfalls

- **D1 is async + remote.** Always `await` queries. Don't pile up
  N+1s — load all resources once, then score in memory.
- **Cloudflare Workers don't support `node:fs`** at runtime.
  CSV-style work must happen at seed time or be precomputed.
- **The `lib/db.ts` client is request-scoped** (per `lib/cf.ts`).
  Don't cache it at module top-level.
- **Anthropic timeouts.** Workers have a 30s CPU budget per request.
  Keep the LLM call lean (top-N items only).
