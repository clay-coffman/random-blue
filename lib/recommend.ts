// Deterministic resource scoring.
// Pure functions — no DB, no IO. Tested in isolation by tests/recommend.test.ts.

import type { Bucket } from "@/types/api";
import type {
  FounderGoal,
  FounderPassportInput,
  FounderStage,
} from "@/schemas/founder-passport";

export type ResourceLocation = {
  county: string | null;
  city: string | null;
  statewide: boolean;
};

export type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  kind: string | null;
  topics: string[]; // pre-joined; lowercased recommended
  industries: string[]; // GOED canonical vocabulary
  communities: string[];
  locations: ResourceLocation[];
};

export type Scored = {
  resource: ResourceRow;
  score: number;
  reasons: string[];
};

// ─── Vocabulary maps ────────────────────────────────────────────────

const ci = (s: string) => s.toLowerCase().trim();

const STAGE_ORDER: FounderStage[] = [
  "idea",
  "pre_seed",
  "mvp",
  "paying_customers",
  "growth",
  "mature",
];

// Maps founder structured stage → upstream CSV `Topics` lifecycle markers.
const STAGE_TO_TOPICS: Record<FounderStage, string[]> = {
  idea: ["pre-seed", "pre seed", "education", "idea"],
  pre_seed: ["pre-seed", "pre seed", "seed"],
  mvp: ["seed", "early stage"],
  paying_customers: ["early stage", "series a"],
  growth: ["late stage growth", "series a", "series b"],
  mature: ["late stage growth", "mature"],
};

// Founder colloquial → GOED canonical industry. Lowercased on both sides.
// Source CSV uses GOED's "Industries" vocabulary
// (e.g. "Software and Information Technology", "Aerospace and Defense").
const INDUSTRY_ALIASES: Record<string, string[]> = {
  // Software / SaaS / AI
  "b2b saas": ["software and information technology"],
  "saas": ["software and information technology"],
  "software": ["software and information technology"],
  "b2b_saas": ["software and information technology"],
  "ai": ["software and information technology"],
  "artificial intelligence": ["software and information technology"],
  "deep_tech": [
    "software and information technology",
    "aerospace and defense",
  ],
  "deep tech": [
    "software and information technology",
    "aerospace and defense",
  ],
  // Finance
  "fintech": ["financial services"],
  "financial services": ["financial services"],
  // Health / med
  "medical_device": ["life sciences and healthcare"],
  "medical device": ["life sciences and healthcare"],
  "biotech": ["life sciences and healthcare"],
  "healthcare": ["life sciences and healthcare"],
  // Industry verticals
  "agriculture": ["agriculture"],
  "ag": ["agriculture"],
  "manufacturing": ["manufacturing"],
  "aerospace": ["aerospace and defense"],
  "defense": ["aerospace and defense"],
  "energy": ["energy and natural resources"],
  "outdoor": ["outdoor recreation"],
  "tourism": ["tourism"],
  "education": ["education"],
};

// Founder structured goal → upstream `Topics` we expect to overlap.
const GOAL_TO_TOPICS: Record<FounderGoal, string[]> = {
  start_business: ["education", "starting a business", "pre-seed"],
  raise_seed_round: ["funding", "capital", "investors"],
  raise_growth_round: ["funding", "capital", "investors", "late stage growth"],
  find_customers: ["customers", "sales", "marketing"],
  hire: ["talent", "workforce", "hiring"],
  export: ["exports", "export", "international"],
  commercialize_research: [
    "tech transfer",
    "technology transfer",
    "research",
    "commercialization",
  ],
  find_workspace: ["workspace", "incubator", "coworking"],
  find_mentors: ["mentorship", "advisors", "mentors"],
  scale_business: ["late stage growth", "scaling", "growth"],
};

// ─── Helpers ────────────────────────────────────────────────────────

function aliasIndustry(industry: string | undefined): string[] {
  if (!industry) return [];
  const key = ci(industry);
  if (INDUSTRY_ALIASES[key]) return INDUSTRY_ALIASES[key];
  // Pass through if it already looks like a GOED string.
  return [key];
}

function overlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const aSet = new Set(a.map(ci));
  return b.some((x) => aSet.has(ci(x)));
}

function adjacentStage(a: FounderStage, b: FounderStage): boolean {
  const ai = STAGE_ORDER.indexOf(a);
  const bi = STAGE_ORDER.indexOf(b);
  if (ai < 0 || bi < 0) return false;
  return Math.abs(ai - bi) === 1;
}

// ─── Component scorers ─────────────────────────────────────────────

function scoreStage(
  resource: ResourceRow,
  passport: FounderPassportInput,
): { score: number; reason: string | null } {
  if (resource.topics.length === 0) {
    // Resource doesn't carry stage info → don't penalize.
    return { score: 0.5, reason: null };
  }
  const wanted = STAGE_TO_TOPICS[passport.stage] ?? [];
  if (overlap(wanted, resource.topics)) {
    return {
      score: 1,
      reason: `Matches stage: ${passport.stage}`,
    };
  }
  // Try adjacent stages for partial credit.
  for (const other of STAGE_ORDER) {
    if (other === passport.stage) continue;
    if (!adjacentStage(passport.stage, other)) continue;
    if (overlap(STAGE_TO_TOPICS[other] ?? [], resource.topics)) {
      return {
        score: 0.5,
        reason: `Adjacent stage tagged (${other})`,
      };
    }
  }
  return { score: 0, reason: null };
}

function scoreLocation(
  resource: ResourceRow,
  passport: FounderPassportInput,
): { score: number; reason: string | null } {
  if (resource.locations.length === 0) {
    return { score: 0.5, reason: null }; // no location data → neutral
  }
  if (resource.locations.some((l) => l.statewide)) {
    return { score: 1, reason: "Statewide resource" };
  }
  const founderCounty = passport.county ? ci(passport.county) : null;
  if (!founderCounty) return { score: 0.5, reason: null };
  const match = resource.locations.find(
    (l) => l.county && ci(l.county) === founderCounty,
  );
  if (match) {
    return { score: 1, reason: `Applies in ${match.county} County` };
  }
  return { score: 0, reason: null };
}

function scoreGoal(
  resource: ResourceRow,
  passport: FounderPassportInput,
): { score: number; reason: string | null } {
  // Empty topics returns 0 (NOT the 0.5 neutral fallback used by stage /
  // location / industry). Reasoning: ~99% of resources DO carry topics, so
  // missing topics is a real "this resource is unclassified for goal" signal
  // rather than missing data. Combined with stage, location, industry, and
  // community all giving partial neutrals, raising goal to 0.5 here would
  // push every fully-empty resource over the actionable bucket floor and
  // bury real matches. Same intent as scoreCommunity's special-case below.
  const wanted = GOAL_TO_TOPICS[passport.goal] ?? [];
  if (overlap(wanted, resource.topics)) {
    const matched = resource.topics.find((t) =>
      wanted.some((w) => ci(w) === ci(t)),
    );
    return {
      score: 1,
      reason: `Tagged ${matched} (matches your goal: ${passport.goal})`,
    };
  }
  return { score: 0, reason: null };
}

function scoreIndustry(
  resource: ResourceRow,
  passport: FounderPassportInput,
): { score: number; reason: string | null } {
  if (!passport.industry || ci(passport.industry) === "general") {
    return { score: 0.5, reason: null }; // founder didn't specify → neutral
  }
  if (resource.industries.length === 0) {
    return { score: 0.5, reason: null }; // resource industry-agnostic
  }
  const wanted = aliasIndustry(passport.industry);
  if (overlap(wanted, resource.industries)) {
    const matched = resource.industries.find((i) =>
      wanted.some((w) => ci(w) === ci(i)),
    );
    return {
      score: 1,
      reason: `Tagged ${matched}`,
    };
  }
  return { score: 0, reason: null };
}

function scoreCommunity(
  resource: ResourceRow,
  passport: FounderPassportInput,
): { score: number; reason: string | null } {
  // Community is intentionally NOT given the 0.5 neutral fallback that the
  // other scorers use. ~95% of resources in the dataset have empty
  // `Communities`, so a 0.5 baseline would mean every founder gets a 5-pt
  // floor on this component for almost every resource — flattening the
  // distribution and amplifying community-tagged resources by less than
  // intended. Empty either side returns 0 (zero contribution, no penalty);
  // a real overlap returns 1 and adds the full 10 points.
  if (
    resource.communities.length === 0 ||
    passport.communities.length === 0
  ) {
    return { score: 0, reason: null };
  }
  if (overlap(passport.communities, resource.communities)) {
    const matched = resource.communities.find((c) =>
      passport.communities.some((p) => ci(p) === ci(c)),
    );
    return { score: 1, reason: `For ${matched}-focused founders` };
  }
  return { score: 0, reason: null };
}

// ─── Public API ────────────────────────────────────────────────────

export function scoreResource(
  resource: ResourceRow,
  passport: FounderPassportInput,
): { score: number; reasons: string[] } {
  const stage = scoreStage(resource, passport);
  const location = scoreLocation(resource, passport);
  const goal = scoreGoal(resource, passport);
  const industry = scoreIndustry(resource, passport);
  const community = scoreCommunity(resource, passport);

  // Round to integer for display + persistence. The weighted sum can land
  // on .5 when neutral fallbacks (0.5) hit non-divisible weights, but at
  // hackathon-grade resolution a 1-point ranking gap from rounding is
  // immaterial; downstream code (`bucketize`, the cached plan response)
  // expects an integer score.
  const score = Math.round(
    25 * stage.score +
      20 * location.score +
      20 * goal.score +
      15 * industry.score +
      10 * community.score,
  );

  const reasons = [
    stage.reason,
    location.reason,
    goal.reason,
    industry.reason,
    community.reason,
  ].filter((r): r is string => r !== null);

  return { score, reasons };
}

// Minimum score required to enter `now` or `next`. Items below this floor
// don't get presented as actionable recommendations — a founder with
// little signal in their passport sees a smaller list rather than 6
// generic "do this now" cards.
const ACTIONABLE_FLOOR = 25;

export function bucketize(scored: Scored[]): {
  now: Scored[];
  next: Scored[];
  ignore: Scored[];
} {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const actionable = sorted.filter((s) => s.score >= ACTIONABLE_FLOOR);
  const now = actionable.slice(0, 3);
  const next = actionable.slice(3, 6);
  // "Ignore for now" = anything below the actionable floor with at least
  // one reason (i.e. nearly matched). Cap at 6 for response size.
  const ignore = sorted
    .filter((s) => s.score < ACTIONABLE_FLOOR && s.reasons.length > 0)
    .slice(0, 6);
  return { now, next, ignore };
}

export function attachBucket(
  scored: Scored,
  bucket: Bucket,
): Scored & { bucket: Bucket } {
  return Object.assign(scored, { bucket });
}
