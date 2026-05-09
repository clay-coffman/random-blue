// Map a company record to a partial FounderPassportInput so a
// signed-in business owner can deep-link from the claim waiting room
// into the Navigator with the form already partially filled. The
// mapping is intentionally lossy: a company column passes through only
// when it lands cleanly on a known form option. Anything ambiguous
// stays empty so the user fills it in.

import { parseBucket } from "./employee-bucket";
import {
  BUSINESS_SIZES,
  COUNTIES,
  INDUSTRIES,
  STAGES,
} from "./intake-options";
import type { FounderPassportInput } from "@/types/passport";

export type CompanyForPassport = {
  name: string | null | undefined;
  website: string | null | undefined;
  sector: string | null | undefined;
  stage: string | null | undefined;
  county: string | null | undefined;
  city: string | null | undefined;
  employeeCount: string | null | undefined;
};

const COUNTY_VALUES = new Set(COUNTIES.map((c) => c.value));
const INDUSTRY_VALUES = new Set(INDUSTRIES.map((i) => i.value));
const STAGE_VALUES = new Set(STAGES.map((s) => s.value));
const BUSINESS_SIZE_VALUES = new Set(BUSINESS_SIZES.map((b) => b.value));

// Free-text sector strings observed in the seeded `companies.sector`
// (Map Data CSV, "Section" column) → form INDUSTRY values. Keys are
// lowercased for case-insensitive lookup. Anything not listed drops
// rather than guessing.
const SECTOR_TO_INDUSTRY: Record<string, string> = {
  "b2b software": "b2b_saas",
  "b2b saas": "b2b_saas",
  saas: "b2b_saas",
  software: "b2b_saas",
  "consumer software": "consumer_tech",
  "consumer tech": "consumer_tech",
  consumer: "consumer_tech",
  fintech: "fintech",
  "financial services": "fintech",
  finance: "fintech",
  agriculture: "agriculture",
  agtech: "agriculture",
  "ag tech": "agriculture",
  food: "agriculture",
  manufacturing: "manufacturing",
  fabrication: "manufacturing",
  "medical device": "medical_device",
  medtech: "medical_device",
  "life sciences": "medical_device",
  biotech: "medical_device",
  "deep tech": "deep_tech",
  research: "deep_tech",
  aerospace: "aerospace",
  defense: "aerospace",
  "aerospace and defense": "aerospace",
  energy: "energy",
  cleantech: "energy",
  climate: "energy",
  cpg: "consumer_packaged_goods",
  "consumer packaged goods": "consumer_packaged_goods",
  hospitality: "hospitality",
  "food services": "hospitality",
  "outdoor recreation": "outdoor_recreation",
  outdoor: "outdoor_recreation",
};

// Lowercased `companies.stage` value → form STAGE value. The CSV has
// values like "Seed", "Series A", "Pre-Seed". Any company that has
// raised counts as `raising` in form vocabulary. Earlier-stage
// "ideation"/"concept" maps to `idea`.
const STAGE_TO_FORM_STAGE: Record<string, string> = {
  idea: "idea",
  ideation: "idea",
  concept: "idea",
  prototype: "early",
  mvp: "early",
  "pre-seed": "raising",
  preseed: "raising",
  seed: "raising",
  "series a": "raising",
  "series b": "growth",
  "series c": "growth",
  growth: "growth",
  late: "growth",
};

function pickIndustry(sector: string | null | undefined): string | undefined {
  if (!sector) return undefined;
  const key = sector.trim().toLowerCase();
  if (!key) return undefined;
  if (INDUSTRY_VALUES.has(key)) return key;
  return SECTOR_TO_INDUSTRY[key];
}

function pickStage(stage: string | null | undefined): string | undefined {
  if (!stage) return undefined;
  const key = stage.trim().toLowerCase();
  if (!key) return undefined;
  if (STAGE_VALUES.has(key)) return key;
  return STAGE_TO_FORM_STAGE[key];
}

function pickCounty(county: string | null | undefined): string | undefined {
  if (!county) return undefined;
  const trimmed = county.trim();
  return COUNTY_VALUES.has(trimmed) ? trimmed : undefined;
}

function pickBusinessSize(
  employeeCount: string | null | undefined,
): string | undefined {
  const range = parseBucket(employeeCount);
  if (!range) return undefined;
  const candidate =
    range.max <= 1
      ? "solo"
      : range.max <= 10
        ? "small"
        : range.max <= 50
          ? "medium"
          : "large";
  return BUSINESS_SIZE_VALUES.has(candidate) ? candidate : undefined;
}

function pickWebsite(website: string | null | undefined): string | undefined {
  if (!website) return undefined;
  const trimmed = website.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pickCity(city: string | null | undefined): string | undefined {
  if (!city) return undefined;
  const trimmed = city.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Build a partial FounderPassportInput from a company record. Every
 * field is optional and drops on any ambiguity, so the form falls
 * through to the empty defaults wherever the company data doesn't fit.
 */
export function companyToPassportInitial(
  c: CompanyForPassport,
): Partial<FounderPassportInput> {
  const out: Partial<FounderPassportInput> = {};
  const websiteUrl = pickWebsite(c.website);
  if (websiteUrl) out.websiteUrl = websiteUrl;
  const county = pickCounty(c.county);
  if (county) out.county = county;
  const city = pickCity(c.city);
  if (city) out.city = city;
  const industry = pickIndustry(c.sector);
  if (industry) out.industry = industry;
  const stage = pickStage(c.stage);
  if (stage) out.stage = stage;
  const businessSize = pickBusinessSize(c.employeeCount);
  if (businessSize) out.businessSize = businessSize;
  return out;
}
