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

// ─── Schema-keyed labels (for prose, not for the form) ───────────────
//
// The form-facing `STAGES` / `GOALS` lists above use a smaller, more
// approachable vocabulary. The schema enums in `schemas/founder-passport.ts`
// (and the persona seeds in `db/seed/personas.ts`) use a wider
// vocabulary — `paying_customers`, `raise_seed_round`, etc. The maps
// below give every schema value a human label so `recommend-explain` can
// build prose without leaking snake_case into the response.
import type {
  FounderGoal,
  FounderStage,
  FounderUrgency,
} from "@/schemas/founder-passport";

export const STAGE_LABELS: Record<FounderStage, string> = {
  idea: "Idea",
  pre_seed: "Pre-seed",
  mvp: "MVP / building",
  paying_customers: "Paying customers",
  growth: "Growth",
  mature: "Mature",
};

export const GOAL_LABELS: Record<FounderGoal, string> = {
  start_business: "Starting a business",
  raise_seed_round: "Seed round",
  raise_growth_round: "Growth round",
  find_customers: "Finding customers",
  hire: "Hiring",
  export: "Exporting",
  commercialize_research: "Commercializing research",
  find_workspace: "Finding workspace",
  find_mentors: "Finding mentors",
  scale_business: "Scaling",
};

export const URGENCY_LABELS: Record<FounderUrgency, string> = {
  this_week: "This week",
  this_month: "This month",
  this_quarter: "This quarter",
  next_quarter: "Next quarter",
  this_year: "This year",
};

const isStage = (v: string | undefined): v is FounderStage =>
  !!v && v in STAGE_LABELS;
const isGoal = (v: string | undefined): v is FounderGoal =>
  !!v && v in GOAL_LABELS;
const isUrgency = (v: string | undefined): v is FounderUrgency =>
  !!v && v in URGENCY_LABELS;

// Resolve a label across both the form vocabulary (e.g. form "early")
// and the schema vocabulary (e.g. seed "paying_customers"). Falls back
// to the raw value if neither knows it.
export const stageLabel = (v: string | undefined): string =>
  (isStage(v) ? STAGE_LABELS[v] : labelFor(STAGES, v)) ?? v ?? "";
export const goalLabel = (v: string | undefined): string =>
  (isGoal(v) ? GOAL_LABELS[v] : labelFor(GOALS, v)) ?? v ?? "";
export const urgencyLabel = (v: string | undefined): string =>
  (isUrgency(v) ? URGENCY_LABELS[v] : labelFor(URGENCIES, v)) ?? v ?? "";
export const industryLabel = (v: string | undefined): string =>
  labelFor(INDUSTRIES, v) ?? v ?? "";
export const communityLabel = (v: string): string =>
  labelFor(COMMUNITY_TAGS, v) ?? v;
export const needLabel = (v: string): string => labelFor(NEEDS, v) ?? v;

// ─── Form → schema vocabulary translation ─────────────────────────────
//
// The form uses a 4-stage / 10-goal founder-friendly vocabulary
// (Idea / Early / Raising / Growth, Raise capital / Hire talent / …);
// the API zod schema enums use 6 finer-grained stages and slightly
// different goal verbs (paying_customers, raise_seed_round, hire,
// export, …). Without translation, every IntakeForm submit 400s on
// the recommend endpoint and silently falls back to recommendMock.
// Applied at the wire boundary in `lib/api-codec.ts`.
//
// Schema values + unknown values pass through unchanged. Direct API
// consumers using the documented OpenAPI vocabulary still work; an
// unmapped form value would surface as a clear zod error on the
// server (better than silent acceptance of garbage).
export const FORM_TO_SCHEMA_STAGE: Record<string, FounderStage> = {
  idea: "idea",
  early: "mvp", // form copy: "Early — building"
  raising: "paying_customers", // form copy: "Raising — paying customers, ready for capital"
  growth: "growth",
};

export const FORM_TO_SCHEMA_GOAL: Record<string, FounderGoal> = {
  start_business: "start_business",
  // No perfect schema match for "Build / launch what I'm working on";
  // start_business is closest (the early phase of starting).
  build_business: "start_business",
  scale_business: "scale_business",
  // Defaults to seed; growth-stage callers can edit later. Branching
  // by stage adds complexity for ~zero scoring impact.
  raise_capital: "raise_seed_round",
  find_customers: "find_customers",
  hire_talent: "hire",
  expand_internationally: "export",
  commercialize_research: "commercialize_research",
  find_workspace: "find_workspace",
  find_mentors: "find_mentors",
};

export const toSchemaStage = (v: string | undefined): string | undefined =>
  v ? (FORM_TO_SCHEMA_STAGE[v] ?? v) : v;
export const toSchemaGoal = (v: string | undefined): string | undefined =>
  v ? (FORM_TO_SCHEMA_GOAL[v] ?? v) : v;
