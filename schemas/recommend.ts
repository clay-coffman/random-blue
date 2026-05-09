// Zod schemas for the recommend + plan + enrich endpoints. The shapes
// match the wire-format `*Wire` types declared in `types/api.ts` so a
// single contract flows from runtime validation → TS types → front-end
// codec (`lib/api-codec.ts`).

import { z } from "zod";
import { FounderPassportInput } from "./founder-passport";

// ─── Recommend ─────────────────────────────────────────────────────

// Discriminated by the presence of `passport_id`. Both branches are
// `.strict()` so a payload that mixes `passport_id` with body fields
// fails the id-only branch (extra fields) AND the body branch
// (`passport_id` is unknown). Net effect:
// `RecommendRequest.safeParse({ passport_id, stage, ... })` returns
// `success: false`, which the route's existing safeParse path turns
// into a 400 with the standard `{ error: { code: "bad_request", ... } }`
// envelope. Route logic narrows on `"passport_id" in input`.
const RecommendRequestById = z
  .object({
    passport_id: z.string().startsWith("fp_"),
  })
  .strict();

export const RecommendRequest = z.union([
  RecommendRequestById,
  FounderPassportInput.strict(),
]);
export type RecommendRequest = z.infer<typeof RecommendRequest>;

export const Bucket = z.enum(["now", "next", "ignore"]);
export type Bucket = z.infer<typeof Bucket>;

export const RecommendedResource = z.object({
  resource_id: z.string(),
  title: z.string(),
  score: z.number(),
  bucket: Bucket,
  reasons: z.array(z.string()),
  // Humanized one-liner — for now/next this is the strongest scoring
  // reason translated to natural language; for ignore it's the negative
  // explainSkip output. Always non-empty for actionable rows. Never
  // contains snake_case enums.
  because: z.string(),
  // Suggested next action; empty string when none.
  action_text: z.string(),
  kind: z.string().optional(),
  // URLs and emails come from upstream CSV data; format-validate here so
  // malformed values can't round-trip into a clickable link / mailto.
  source_url: z.string().url().optional(),
  contact_email: z.string().email().optional(),
});
export type RecommendedResource = z.infer<typeof RecommendedResource>;

export const RecommendResponse = z.object({
  passport_id: z.string(),
  // Plan-scoped synthesis paragraph (60–100 words) from
  // `synthesizeNarrative`. Hedges adjacency in plain English, names
  // specific orgs, uses founder-chosen labels. Falls back to a
  // deterministic templated paragraph when Anthropic fails so this is
  // always non-empty when there are positive recs; "" only when there
  // are no recommendations at all.
  narrative: z.string(),
  recommendations: z.array(RecommendedResource),
  // ISO 8601 — used by the front-end for cache-staleness display.
  generated_at: z.string(),
  // True when synthesizeNarrative fell back to the deterministic
  // template (Anthropic call failed, timed out, or returned bad JSON).
  // The front-end surfaces this as a small badge.
  degraded: z.boolean().optional(),
});
export type RecommendResponse = z.infer<typeof RecommendResponse>;

// ─── Plan (cached) ─────────────────────────────────────────────────

export const PlanResponse = RecommendResponse;
export type PlanResponse = z.infer<typeof PlanResponse>;

// ─── Enrich ────────────────────────────────────────────────────────

export const EnrichRequest = z.object({
  website_url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), {
      message: "URL must use http or https.",
    }),
});
export type EnrichRequest = z.infer<typeof EnrichRequest>;

export const EnrichField = z.object({
  name: z.string(),
  value: z.unknown(),
  confidence: z.number().min(0).max(1),
});
export type EnrichField = z.infer<typeof EnrichField>;

export const EnrichResponse = z.object({
  fields: z.array(EnrichField),
  degraded: z.boolean().optional(),
});
export type EnrichResponse = z.infer<typeof EnrichResponse>;
