// Option lists for the Founder Navigator intake form.
// Values intentionally match `db/seed/personas.ts` and the canonical
// GOED brief in `docs/source_data/page-2026-05-08-19-38-24.md`.
// Add a value here only if the persona seed or the brief uses it.

export type Option = { value: string; label: string };

export const COUNTIES: Option[] = [
  "Beaver",
  "Box Elder",
  "Cache",
  "Carbon",
  "Daggett",
  "Davis",
  "Duchesne",
  "Emery",
  "Garfield",
  "Grand",
  "Iron",
  "Juab",
  "Kane",
  "Millard",
  "Morgan",
  "Piute",
  "Rich",
  "Salt Lake",
  "San Juan",
  "Sanpete",
  "Sevier",
  "Summit",
  "Tooele",
  "Uintah",
  "Utah",
  "Wasatch",
  "Washington",
  "Wayne",
  "Weber",
].map((c) => ({ value: c, label: c }));

export const STAGES: Option[] = [
  { value: "idea", label: "Idea — exploring" },
  { value: "early", label: "Early — building" },
  { value: "raising", label: "Raising — paying customers, ready for capital" },
  { value: "growth", label: "Growth — scaling an established business" },
];

export const INDUSTRIES: Option[] = [
  { value: "general", label: "General / not yet sure" },
  { value: "b2b_saas", label: "B2B SaaS" },
  { value: "consumer_tech", label: "Consumer tech" },
  { value: "agriculture", label: "Agriculture / food" },
  { value: "manufacturing", label: "Manufacturing / fabrication" },
  { value: "medical_device", label: "Medical device / life sciences" },
  { value: "deep_tech", label: "Deep tech / research commercialization" },
  { value: "aerospace", label: "Aerospace and defense" },
  { value: "fintech", label: "Financial services" },
  { value: "energy", label: "Energy / cleantech" },
  { value: "consumer_packaged_goods", label: "Consumer packaged goods" },
  { value: "hospitality", label: "Hospitality / food services" },
  { value: "outdoor_recreation", label: "Outdoor recreation" },
  { value: "other", label: "Other" },
];

export const GOALS: Option[] = [
  { value: "start_business", label: "Start a business" },
  { value: "build_business", label: "Build / launch what I'm working on" },
  { value: "scale_business", label: "Scale my existing business" },
  { value: "raise_capital", label: "Raise capital (angel / VC)" },
  { value: "find_customers", label: "Find customers / pilots" },
  { value: "hire_talent", label: "Hire talent" },
  { value: "expand_internationally", label: "Expand internationally / export" },
  { value: "commercialize_research", label: "Commercialize my research" },
  { value: "find_workspace", label: "Find workspace / facility" },
  { value: "find_mentors", label: "Find mentors" },
];

export const URGENCIES: Option[] = [
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "this_quarter", label: "Next quarter" },
  { value: "this_year", label: "This year" },
];

export const BUSINESS_SIZES: Option[] = [
  { value: "solo", label: "Just me / pre-revenue" },
  { value: "small", label: "Small (1–10 employees)" },
  { value: "medium", label: "Mid-size (11–50)" },
  { value: "large", label: "Larger (50+)" },
];

export const COMMUNITY_TAGS: Option[] = [
  { value: "student", label: "Student" },
  { value: "veteran", label: "Veteran" },
  { value: "women", label: "Woman-owned" },
  { value: "rural", label: "Rural" },
  { value: "researcher", label: "University researcher" },
  { value: "multicultural", label: "Multicultural / minority-owned" },
  { value: "new_american", label: "New American / immigrant" },
];

// NEEDS covers both the form's coarse vocabulary (`capital`,
// `customers`, …) and the granular values seeded in
// `db/seed/personas.ts` (`angel_investors`, `growth_capital`,
// `pitch_events`, `working_capital`, `tech_transfer`, …). Both flow to
// the recommend matcher; coarse values are easier for free-form intake,
// granular values let persona quick-tests round-trip the seed exactly.
export const NEEDS: Option[] = [
  // Coarse, form-friendly buckets.
  { value: "capital", label: "Capital — angel, VC, grants" },
  { value: "customers", label: "Customers — intros, pilots, contracts" },
  { value: "talent", label: "Hiring / talent" },
  { value: "mentorship", label: "Mentors and advisors" },
  { value: "regulatory", label: "Regulatory help (FDA, export, compliance)" },
  { value: "operations", label: "Operating support (legal, bookkeeping, ops)" },
  { value: "facility", label: "Workspace / facility" },
  { value: "tech_transfer", label: "Tech transfer / commercialization" },
  // Granular values used by the seed personas. Hidden from the chip
  // multi-select but kept in the lookup so labels resolve.
  { value: "angel_investors", label: "Angel investors" },
  { value: "venture_capital", label: "Venture capital" },
  { value: "growth_capital", label: "Growth capital" },
  { value: "working_capital", label: "Working capital" },
  { value: "non_dilutive_capital", label: "Non-dilutive capital / grants" },
  { value: "pitch_events", label: "Pitch events" },
  { value: "pitch_prep", label: "Pitch prep" },
  { value: "community", label: "Founder community" },
  { value: "rural_resources", label: "Rural-focused resources" },
  { value: "veteran_resources", label: "Veteran-focused resources" },
  { value: "export_assistance", label: "Export assistance" },
  { value: "international_partners", label: "International partners" },
  { value: "ip_legal", label: "IP / legal counsel" },
];

// Subset of NEEDS shown as chips on the intake form. Values not in this
// list are still valid (the seed uses them), they just aren't exposed
// for free-form selection.
export const FORM_NEEDS: Option[] = NEEDS.slice(0, 8);

export const labelFor = (
  options: readonly Option[],
  value: string | undefined,
): string | undefined => options.find((o) => o.value === value)?.label;
