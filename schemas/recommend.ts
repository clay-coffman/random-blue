import { z } from "zod";
import { FounderPassportInput } from "./founder-passport";

// ─── Recommend ─────────────────────────────────────────────────────

export const RecommendRequest = FounderPassportInput.extend({
  passport_id: z.string().startsWith("fp_").optional(),
}).partial({
  // Allow callers to pass just `{ passport_id }` and skip the full body
  // (we'll load the passport from D1).
  stage: true,
  industry: true,
  goal: true,
});
export type RecommendRequest = z.infer<typeof RecommendRequest>;

export const Bucket = z.enum(["now", "next", "ignore"]);
export type Bucket = z.infer<typeof Bucket>;

export const RecommendedResource = z.object({
  resource_id: z.string(),
  title: z.string(),
  source_url: z.string().nullable(),
  score: z.number(),
  bucket: Bucket,
  reasons: z.array(z.string()),
  why: z.string().nullable(), // LLM "Because…" sentence; null if fallback
  action: z.string().nullable(),
});
export type RecommendedResource = z.infer<typeof RecommendedResource>;

export const RecommendResponse = z.object({
  passport_id: z.string(),
  recommendations: z.array(RecommendedResource),
  llm_used: z.boolean(),
});
export type RecommendResponse = z.infer<typeof RecommendResponse>;

// ─── Plan (cached) ─────────────────────────────────────────────────

export const PlanResponse = RecommendResponse;
export type PlanResponse = z.infer<typeof PlanResponse>;

// ─── Enrich ────────────────────────────────────────────────────────

export const EnrichRequest = z.object({
  website_url: z.string().url(),
});
export type EnrichRequest = z.infer<typeof EnrichRequest>;

export const EnrichField = z.object({
  value: z.unknown(),
  confidence: z.number().min(0).max(1),
});
export type EnrichField = z.infer<typeof EnrichField>;

export const EnrichResponse = z.object({
  fields: z.record(z.string(), EnrichField),
  source_url: z.string(),
  fetched_at: z.number(),
  degraded: z.boolean().optional(),
});
export type EnrichResponse = z.infer<typeof EnrichResponse>;
