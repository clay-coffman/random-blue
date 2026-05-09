import { z } from "zod";

export const FounderStage = z.enum([
  "idea",
  "pre_seed",
  "mvp",
  "paying_customers",
  "growth",
  "mature",
]);
export type FounderStage = z.infer<typeof FounderStage>;

export const FounderGoal = z.enum([
  "start_business",
  "raise_seed_round",
  "raise_growth_round",
  "find_customers",
  "hire",
  "export",
  "commercialize_research",
  "find_workspace",
  "find_mentors",
  "scale_business",
]);
export type FounderGoal = z.infer<typeof FounderGoal>;

// Listed in chronological order (soonest → latest).
export const FounderUrgency = z.enum([
  "this_week",
  "this_month",
  "this_quarter",
  "next_quarter",
  "this_year",
]);
export type FounderUrgency = z.infer<typeof FounderUrgency>;

export const FounderPassportInput = z.object({
  county: z.string().optional(),
  city: z.string().optional(),
  stage: FounderStage,
  industry: z.string(),
  communities: z.array(z.string()).default([]),
  goal: FounderGoal,
  urgency: FounderUrgency.optional(),
  business_size: z.string().optional(),
  business_type: z.string().optional(),
  needs: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  // Same http(s) constraint as EnrichRequest — `javascript:`/`data:`/`file:`
  // URLs would persist into `founder_passports.website_url` and could be
  // rendered as `<a href={...}>` downstream (stored XSS surface).
  website_url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), {
      message: "website_url must use http or https.",
    })
    .optional(),
  // Front-end sets this to the provider id (e.g. "anthropic-fetch")
  // when the enrich path ran before submission. Server stamps
  // `enriched_at = now` on the persisted row when this is present.
  enrichment_source: z.string().min(1).max(64).optional(),
});
export type FounderPassportInput = z.infer<typeof FounderPassportInput>;
