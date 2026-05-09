// Founder-passport fixtures used by the persona quick-test buttons and
// the local recommend mock. Field values intentionally mirror
// `db/seed/personas.ts` so the round-trip from button click → form
// → mock recommend is consistent with the seeded data Agent 2's real
// scoring will see.

import type { FounderPassportInput } from "@/types/api";
import { personas } from "@/lib/personas";

export type PersonaId = (typeof personas)[number]["id"];

export const personaFixtures: Record<PersonaId, FounderPassportInput> = {
  jordan: {
    county: "Salt Lake",
    city: "Salt Lake City",
    stage: "idea",
    industry: "general",
    communities: ["student"],
    goal: "start_business",
    urgency: "this_month",
    business_size: "solo",
    needs: ["mentorship", "capital", "customers"],
    constraints: ["first_time_founder"],
  },
  maria: {
    county: "Washington",
    city: "St. George",
    stage: "growth",
    industry: "agriculture",
    communities: ["rural", "women"],
    goal: "scale_business",
    urgency: "this_quarter",
    business_size: "small",
    needs: ["capital", "operations"],
    constraints: ["rural_location"],
  },
  marcus: {
    county: "Weber",
    city: "Ogden",
    stage: "early",
    industry: "manufacturing",
    communities: ["veteran"],
    goal: "build_business",
    urgency: "this_quarter",
    business_size: "small",
    needs: ["capital", "facility", "mentorship"],
    constraints: ["capex_intensive"],
  },
  priya: {
    county: "Salt Lake",
    city: "Salt Lake City",
    stage: "raising",
    industry: "b2b_saas",
    communities: ["women"],
    goal: "raise_capital",
    urgency: "this_month",
    business_size: "small",
    needs: ["capital", "mentorship"],
    constraints: ["paying_customers"],
  },
  david: {
    county: "Utah",
    city: "Provo",
    stage: "growth",
    industry: "medical_device",
    communities: [],
    goal: "expand_internationally",
    urgency: "this_year",
    business_size: "medium",
    needs: ["regulatory", "customers", "operations"],
    constraints: ["fda_cleared", "regulated_industry"],
  },
  amir: {
    county: "Salt Lake",
    city: "Salt Lake City",
    stage: "idea",
    industry: "deep_tech",
    communities: ["researcher"],
    goal: "commercialize_research",
    urgency: "this_quarter",
    business_size: "solo",
    needs: ["tech_transfer", "capital", "mentorship"],
    constraints: ["first_time_founder", "phd_research"],
  },
};

export const isPersonaId = (id: string): id is PersonaId =>
  personas.some((p) => p.id === id);

export const passportIdFor = (personaId: PersonaId): string =>
  `fp_${personaId}`;

export const personaIdFromPassport = (
  passportId: string,
): PersonaId | undefined => {
  if (!passportId.startsWith("fp_")) return undefined;
  const candidate = passportId.slice(3);
  return isPersonaId(candidate) ? candidate : undefined;
};
