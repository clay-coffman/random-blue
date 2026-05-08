// Six required personas as `founder_passports` rows.
// Verbatim from docs/source_data/page-2026-05-08-19-38-24.md § Test Cases.
// Canonical IDs (`fp_jordan`, …) so the front-end can pass them as
// passport_id directly without a fresh intake.

export type PersonaSeed = {
  id: string;
  userId: string;
  county: string;
  city: string;
  stage: string;
  industry: string;
  communities: string[];
  goal: string;
  urgency: string;
  businessSize: string | null;
  needs: string[];
  constraints: string[];
};

export const personas: PersonaSeed[] = [
  {
    id: "fp_jordan",
    userId: "u_jordan",
    county: "Salt Lake",
    city: "Salt Lake City",
    stage: "idea",
    industry: "general",
    communities: ["student"],
    goal: "start_business",
    urgency: "this_month",
    businessSize: "solo",
    needs: ["mentorship", "pitch_events", "community"],
    constraints: ["first_time_founder"],
  },
  {
    id: "fp_maria",
    userId: "u_maria",
    county: "Washington",
    city: "St. George",
    stage: "growth",
    industry: "agriculture",
    communities: ["rural", "women"],
    goal: "scale_business",
    urgency: "this_quarter",
    businessSize: "small",
    needs: ["growth_capital", "operations", "rural_resources"],
    constraints: ["rural_location"],
  },
  {
    id: "fp_marcus",
    userId: "u_marcus",
    county: "Weber",
    city: "Ogden",
    stage: "early",
    industry: "manufacturing",
    communities: ["veteran"],
    goal: "build_business",
    urgency: "this_quarter",
    businessSize: "small",
    needs: ["working_capital", "facility", "veteran_resources"],
    constraints: ["capex_intensive"],
  },
  {
    id: "fp_priya",
    userId: "u_priya",
    county: "Salt Lake",
    city: "Salt Lake City",
    stage: "raising",
    industry: "b2b_saas",
    communities: ["women"],
    goal: "raise_capital",
    urgency: "this_month",
    businessSize: "small",
    needs: ["angel_investors", "venture_capital", "pitch_prep"],
    constraints: ["paying_customers", "18_months_in"],
  },
  {
    id: "fp_david",
    userId: "u_david",
    county: "Utah",
    city: "Provo",
    stage: "growth",
    industry: "medical_device",
    communities: [],
    goal: "expand_internationally",
    urgency: "this_year",
    businessSize: "medium",
    needs: ["export_assistance", "international_partners", "regulatory"],
    constraints: ["fda_cleared", "regulated_industry"],
  },
  {
    id: "fp_amir",
    userId: "u_amir",
    county: "Salt Lake",
    city: "Salt Lake City",
    stage: "idea",
    industry: "deep_tech",
    communities: ["researcher"],
    goal: "commercialize_research",
    urgency: "this_quarter",
    businessSize: "solo",
    needs: ["tech_transfer", "ip_legal", "non_dilutive_capital"],
    constraints: ["first_time_founder", "phd_research"],
  },
];
