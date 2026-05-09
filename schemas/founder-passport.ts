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

export const FounderUrgency = z.enum([
  "this_week",
  "this_month",
  "this_quarter",
  "this_year",
  "next_quarter",
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
  website_url: z.string().url().optional(),
});
export type FounderPassportInput = z.infer<typeof FounderPassportInput>;
