# Agent 2 — Recommendation engine

You build the API endpoint that powers the Founder Navigator's results
page. Deterministic scoring first, LLM explanations second. Aim for
~90 minutes.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free in batch 1).
- **Branch:** `feat/recommend`. First action:
  `git checkout -b feat/recommend`.

## Reads first

1. `docs/agent-tasks/00-shared-context.md`
2. `docs/architecture.md` — error shape, lib/ helpers,
   `lib/anthropic.ts`.
3. `docs/requirements.md` — Recommendation engine section.
4. `docs/hackathon-plan.md` lines 84–115 (the scoring formula and
   the source-bound LLM prompt).
5. `db/schema.ts` (after Agent 1 freezes it) — table shapes for
   joins.
6. `db/seed/personas.ts` — your test inputs.
7. The **`claude-api`** loaded skill — required reading for the
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
- `lib/recommend.ts` — scoring lib (pure, testable).
- `schemas/founder-passport.ts` — zod schema for the request.
- `types/api.ts` additions for recommend request/response.
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
