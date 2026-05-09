// Local fixture client for the recommend endpoint. Used while
// `app/api/v1/resources/recommend` (Agent 2) is not yet deployed —
// every call falls back to this so the navigator UI is fully testable.
//
// TODO(agent-2): delete this module and switch /founder + /plan to the
// real fetch when Agent 2's PR lands. The resource catalogue below
// uses real `r_*` IDs from `docs/source_data/Resources List - Builder
// Day - Sheet1.csv` so deep links survive the merge.

import {
  COMMUNITY_TAGS,
  GOALS,
  INDUSTRIES,
  NEEDS,
  STAGES,
  labelFor,
} from "@/lib/intake-options";
import type {
  FounderPassportInput,
  RecommendResult,
  RecommendedResource,
} from "@/types/passport";
import { explainSkip } from "@/lib/recommend-explain";

type Catalogue = {
  resourceId: string;
  title: string;
  kind: string;
  sourceUrl: string;
  contactEmail?: string;
  matches: {
    industries?: string[];
    communities?: string[];
    needs?: string[];
    goals?: string[];
    stages?: string[];
    statewide?: boolean;
    counties?: string[];
  };
};

// Granular → coarse need synonyms so a fixture seeded with
// `["angel_investors", "venture_capital"]` still matches a resource
// tagged `["capital"]`. One-way: granular implies coarse, but coarse
// does NOT pull in unrelated granular needs (e.g. "mentorship" should
// not silently mean "wants to expand internationally").
const GRANULAR_TO_COARSE: Record<string, string> = {
  angel_investors: "capital",
  venture_capital: "capital",
  growth_capital: "capital",
  working_capital: "capital",
  non_dilutive_capital: "capital",
  pitch_prep: "mentorship",
  community: "mentorship",
  rural_resources: "operations",
  ip_legal: "operations",
  veteran_resources: "mentorship",
  international_partners: "customers",
  export_assistance: "regulatory",
};

const expandNeeds = (needs: string[]): Set<string> => {
  const out = new Set<string>(needs);
  for (const n of needs) {
    const coarse = GRANULAR_TO_COARSE[n];
    if (coarse) out.add(coarse);
  }
  return out;
};

const catalogue: Catalogue[] = [
  {
    resourceId: "r_2606",
    title: "Pelion Ventures",
    kind: "Capital — venture capital",
    sourceUrl: "https://pelionvp.com/",
    contactEmail: "info@pelionvp.com",
    matches: {
      industries: ["b2b_saas", "fintech"],
      needs: ["capital"],
      goals: ["raise_capital"],
      stages: ["raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2614",
    title: "Salt Lake Angels",
    kind: "Capital — angel group",
    sourceUrl: "https://slcangels.org/",
    contactEmail: "support@slcangels.org",
    matches: {
      industries: ["b2b_saas", "consumer_tech", "general"],
      needs: ["capital"],
      goals: ["raise_capital"],
      stages: ["early", "raising"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2611",
    title: "Kickstart Fund",
    kind: "Capital — seed VC",
    sourceUrl: "https://www.kickstartfund.com/",
    contactEmail: "info@kickstartfund.com",
    matches: {
      industries: ["b2b_saas", "consumer_tech"],
      needs: ["capital"],
      goals: ["raise_capital", "scale_business"],
      stages: ["raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2596",
    title: "Mercato Partners",
    kind: "Capital — growth equity",
    sourceUrl: "https://www.mercatopartners.com/",
    contactEmail: "admin@mercatopartners.com",
    matches: {
      industries: ["b2b_saas", "consumer_packaged_goods", "hospitality"],
      needs: ["capital"],
      goals: ["scale_business", "raise_capital"],
      stages: ["growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2585",
    title: "Utah Microloan Fund (UMLF)",
    kind: "Capital — microloans + training",
    sourceUrl: "https://www.utahmicroloanfund.org/",
    matches: {
      communities: ["women", "multicultural", "new_american", "rural"],
      needs: ["capital"],
      goals: ["start_business", "build_business", "scale_business"],
      stages: ["idea", "early", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2618",
    title: "Wildcat MicroFund",
    kind: "Capital — milestone grants",
    sourceUrl: "https://www.weber.edu/wildcat-microfund/",
    contactEmail: "wildcatmicrofund@weber.edu",
    matches: {
      needs: ["capital"],
      goals: ["start_business", "build_business"],
      stages: ["idea", "early"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2647",
    title: "Small Business Development Center (SBDC)",
    kind: "Mentorship — confidential consulting",
    sourceUrl: "https://utahsbdc.org/",
    contactEmail: "mike.finnerty@usu.edu",
    matches: {
      communities: [
        "women",
        "veteran",
        "student",
        "rural",
        "multicultural",
        "new_american",
      ],
      needs: ["mentorship", "operations"],
      goals: [
        "start_business",
        "build_business",
        "scale_business",
        "find_mentors",
      ],
      stages: ["idea", "early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2582",
    title: "University of Utah Lassonde Entrepreneur Institute",
    kind: "Community — student programs + grants",
    sourceUrl: "https://lassonde.utah.edu/",
    contactEmail: "lassonde@utah.edu",
    matches: {
      communities: ["student", "researcher"],
      needs: ["mentorship", "capital", "facility"],
      goals: [
        "start_business",
        "build_business",
        "commercialize_research",
        "find_mentors",
      ],
      stages: ["idea", "early"],
      counties: ["Salt Lake", "Davis", "Morgan", "Tooele", "Weber"],
    },
  },
  {
    resourceId: "r_2651",
    title: "A Bolder Way Forward",
    kind: "Community — women founders initiative",
    sourceUrl: "https://www.usu.edu/uwlp/abwf/",
    contactEmail: "uwlp@usu.edu",
    matches: {
      communities: ["women"],
      needs: ["mentorship", "operations"],
      goals: ["start_business", "build_business", "scale_business"],
      stages: ["idea", "early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2682",
    title: "Utah Center for Rural Development",
    kind: "Capital + community — rural grants",
    sourceUrl: "https://business.utah.gov/rural/",
    contactEmail: "business@utah.gov",
    matches: {
      communities: ["rural"],
      needs: ["capital", "operations"],
      goals: ["scale_business", "build_business"],
      stages: ["early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2590",
    title: "Utah Department of Agriculture & Food",
    kind: "Capital + regulatory — ag programs",
    sourceUrl: "https://ag.utah.gov/",
    contactEmail: "agriculture@utah.gov",
    matches: {
      industries: ["agriculture"],
      needs: ["capital", "regulatory"],
      goals: ["scale_business", "expand_internationally"],
      stages: ["early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2656",
    title: "STRIVE — Veteran Entrepreneur Training",
    kind: "Mentorship — 6-week program",
    sourceUrl: "https://utahvbrc.org/strive",
    contactEmail: "vbrc@slcc.edu",
    matches: {
      communities: ["veteran"],
      needs: ["mentorship", "capital"],
      goals: ["start_business", "build_business"],
      stages: ["idea", "early"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2642",
    title: "Veteran-Owned Business Registration Utah",
    kind: "Community — registry + visibility",
    sourceUrl: "https://vbr.veterans.utah.gov/s/",
    contactEmail: "vbrc@slcc.edu",
    matches: {
      communities: ["veteran"],
      needs: ["customers", "operations"],
      goals: ["build_business", "scale_business", "find_customers"],
      stages: ["early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2612",
    title: "World Trade Center Utah",
    kind: "International — export support",
    sourceUrl: "https://www.wtcutah.com/",
    contactEmail: "info@wtcutah.com",
    matches: {
      needs: ["customers", "operations", "regulatory"],
      goals: ["expand_internationally"],
      stages: ["raising", "growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_3666",
    title: "U.S. Commercial Service",
    kind: "International — federal export",
    sourceUrl: "https://www.trade.gov/utah-salt-lake-city",
    contactEmail: "Daniel.Bruner@trade.gov",
    matches: {
      needs: ["regulatory", "customers"],
      goals: ["expand_internationally"],
      stages: ["growth"],
      statewide: true,
    },
  },
  {
    resourceId: "r_2675",
    title: "Utah Pacific Islander Chamber of Commerce",
    kind: "Community — multicultural founders",
    sourceUrl: "https://www.upichamber.org/",
    contactEmail: "admin@upichamber.org",
    matches: {
      communities: ["multicultural"],
      needs: ["mentorship", "capital", "customers"],
      goals: ["start_business", "build_business", "scale_business"],
      stages: ["idea", "early", "raising", "growth"],
      statewide: true,
    },
  },
];

const overlap = (a: string[] | undefined, b: Iterable<string>): string[] => {
  if (!a?.length) return [];
  const set = new Set(a);
  const hits: string[] = [];
  for (const x of b) {
    if (set.has(x)) hits.push(x);
  }
  return hits;
};

function score(
  input: FounderPassportInput,
  candidate: Catalogue,
): { score: number; reasons: string[] } {
  let s = 0;
  const reasons: string[] = [];
  const m = candidate.matches;
  const needsSet = expandNeeds(input.needs);

  if (m.stages?.length && input.stage && m.stages.includes(input.stage)) {
    s += 25;
    reasons.push(`Matches your stage: ${labelFor(STAGES, input.stage)}`);
  }
  if (
    m.industries?.length &&
    input.industry &&
    m.industries.includes(input.industry)
  ) {
    s += 15;
    reasons.push(
      `Industry fit: ${labelFor(INDUSTRIES, input.industry) ?? input.industry}`,
    );
  } else if (
    m.industries?.length &&
    m.industries.length <= 2 &&
    input.industry &&
    !m.industries.includes(input.industry)
  ) {
    s -= 25;
    const labels = m.industries
      .map((i) => labelFor(INDUSTRIES, i) ?? i)
      .join(" / ");
    reasons.push(`Industry-specific to ${labels}.`);
  }

  if (m.goals?.length && input.goal && m.goals.includes(input.goal)) {
    s += 20;
    reasons.push(
      `Aligned with your goal: ${labelFor(GOALS, input.goal) ?? input.goal}`,
    );
  }

  const needHits = overlap(m.needs, needsSet);
  if (needHits.length > 0) {
    s += 10 * needHits.length;
    const needLabels = needHits
      .map((n) => labelFor(NEEDS, n) ?? n)
      .join(", ");
    reasons.push(
      `Covers what you need: ${needLabels.toLowerCase()}.`,
    );
  }

  const communityHits = overlap(m.communities, input.communities);
  if (communityHits.length > 0) {
    s += 10 * communityHits.length;
    const labels = communityHits
      .map((c) => labelFor(COMMUNITY_TAGS, c) ?? c)
      .join(", ");
    reasons.push(`Built for: ${labels} founders.`);
  } else if (m.communities?.length && m.communities.length <= 2) {
    s -= 100;
    const labels = m.communities
      .map((c) => labelFor(COMMUNITY_TAGS, c) ?? c)
      .join(" / ");
    reasons.push(
      `Built for ${labels} founders — that's not your profile.`,
    );
  }

  if (m.statewide || (input.county && m.counties?.includes(input.county))) {
    s += 10;
    reasons.push(
      m.statewide
        ? "Available statewide."
        : `Serves ${input.county} County.`,
    );
  } else if (m.counties?.length && input.county) {
    s -= 15;
    reasons.push(
      `Limited to ${m.counties.join(", ")} (you're in ${input.county}).`,
    );
  }

  return { score: s, reasons };
}

const because = (
  input: FounderPassportInput,
  candidate: Catalogue,
  reasons: string[],
): string => {
  const focus =
    labelFor(GOALS, input.goal)?.toLowerCase() ?? "what you're building";
  const stage =
    labelFor(STAGES, input.stage)?.toLowerCase() ?? "where you are";
  return `Because you're focused on ${focus} at the "${stage}" stage, ${candidate.title} is one of the closest fits in the state's portfolio${
    reasons.length ? ` — ${reasons[0].toLowerCase()}` : "."
  }`;
};

const actionFor = (
  candidate: Catalogue,
  input: FounderPassportInput,
): string => {
  const goal = input.goal;
  if (candidate.matches.needs?.includes("capital")) {
    return goal === "raise_capital"
      ? `Email ${candidate.contactEmail ?? "the team"} with a one-page pitch.`
      : "Apply or check current open programs.";
  }
  if (candidate.matches.needs?.includes("mentorship")) {
    return "Book a free intake call this week.";
  }
  if (candidate.matches.goals?.includes("expand_internationally")) {
    return "Schedule an export readiness consultation.";
  }
  return "Open the program page and start the application.";
};

export function recommendMock(
  input: FounderPassportInput,
  passportId: string,
): RecommendResult {
  const scored = catalogue.map((c) => {
    const { score: s, reasons } = score(input, c);
    return { c, score: s, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  // Track needs already claimed by higher-ranked (now/next) resources so the
  // ignore-bucket explainer can fall back to "already covered by higher-
  // ranked options" when no clearer mismatch is present.
  const alreadyCoveredNeeds = new Set<string>();
  scored.forEach((row, i) => {
    const inActionable = row.score >= 35 && i < 3;
    const inNext = row.score >= 20 && i < 7 && !inActionable;
    if (!inActionable && !inNext) return;
    for (const n of row.c.matches.needs ?? []) alreadyCoveredNeeds.add(n);
  });

  const recommendations: RecommendedResource[] = scored.map((row, i) => {
    let bucket: RecommendedResource["bucket"];
    if (row.score >= 35 && i < 3) bucket = "now";
    else if (row.score >= 20 && i < 7) bucket = "next";
    else bucket = "ignore";

    return {
      resourceId: row.c.resourceId,
      title: row.c.title,
      score: Math.max(0, Math.min(100, Math.round(row.score))),
      bucket,
      reasons: row.reasons.length
        ? row.reasons
        : ["No strong field match — listed for completeness."],
      because:
        bucket === "ignore"
          ? explainSkip(row.c.matches, input, { alreadyCoveredNeeds })
          : because(input, row.c, row.reasons),
      actionText: actionFor(row.c, input),
      kind: row.c.kind,
      sourceUrl: row.c.sourceUrl,
      contactEmail: row.c.contactEmail,
    };
  });

  return {
    passportId,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
