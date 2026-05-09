// Shared investor-profile enums + Zod schema. Lives in lib/ (no
// 'use client' directive) so both the form (browser) and the API
// route (server) import the same source of truth — without one
// pulling React into the other.

import { z } from "zod";

export const InvestorTypeEnum = z.enum([
  "vc",
  "angel",
  "family_office",
  "corp_dev",
  "scout",
  "lp",
]);
export const StageEnum = z.enum(["pre_seed", "seed", "series_a", "growth"]);
export const SectorEnum = z.enum([
  "b2b_saas",
  "fintech",
  "ai",
  "aerospace",
  "life_sciences",
  "energy",
  "consumer",
]);
export const GeoFocusEnum = z.enum(["wasatch_front", "statewide", "national"]);

export const InvestorPreferencesSchema = z.object({
  firm_name: z.string().min(2, "Enter your firm or affiliation"),
  investor_type: InvestorTypeEnum,
  stages: z.array(StageEnum).min(1, "Pick at least one stage"),
  sectors: z.array(SectorEnum).min(1, "Pick at least one sector"),
  check_size_min: z.coerce.number().int().min(0),
  check_size_max: z.coerce.number().int().min(0),
  geo_focus: z.array(GeoFocusEnum).min(1, "Pick at least one geo"),
});

export type InvestorPreferencesValues = z.infer<typeof InvestorPreferencesSchema>;

// Display labels for chips.
export const INVESTOR_TYPE_OPTIONS = [
  { id: "vc", label: "VC" },
  { id: "angel", label: "Angel" },
  { id: "family_office", label: "Family office" },
  { id: "corp_dev", label: "Corp dev" },
  { id: "scout", label: "Scout" },
  { id: "lp", label: "LP" },
] as const;

export const STAGE_OPTIONS = [
  { id: "pre_seed", label: "Pre-seed" },
  { id: "seed", label: "Seed" },
  { id: "series_a", label: "Series A" },
  { id: "growth", label: "Growth" },
] as const;

export const SECTOR_OPTIONS = [
  { id: "b2b_saas", label: "B2B SaaS" },
  { id: "fintech", label: "FinTech" },
  { id: "ai", label: "AI" },
  { id: "aerospace", label: "Aerospace" },
  { id: "life_sciences", label: "Life sciences" },
  { id: "energy", label: "Energy" },
  { id: "consumer", label: "Consumer" },
] as const;

export const GEO_FOCUS_OPTIONS = [
  { id: "wasatch_front", label: "Wasatch Front" },
  { id: "statewide", label: "Statewide" },
  { id: "national", label: "National" },
] as const;
