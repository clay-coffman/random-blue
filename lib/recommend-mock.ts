// Local fixture client for the recommend endpoint. Used while
// `app/api/v1/resources/recommend` (Agent 2) is not yet deployed —
// every call falls back to this so the navigator UI is fully testable.
//
// TODO(agent-2): delete this module and switch /founder + /plan to the
// real fetch when Agent 2's PR lands. The resource catalogue below
// uses real `r_*` IDs from `docs/source_data/Resources List - Builder
// Day - Sheet1.csv` so deep links survive the merge.

import type {
  FounderPassportInput,
  RecommendResponse,
  RecommendedResource,
} from "@/types/api";

type Catalogue = {
  resource_id: string;
  title: string;
  kind: string;
  source_url: string;
  contact_email?: string;
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

const catalogue: Catalogue[] = [
  {
    resource_id: "r_2606",
    title: "Pelion Ventures",
    kind: "Capital — venture capital",
    source_url: "https://pelionvp.com/",
    contact_email: "info@pelionvp.com",
    matches: {
      industries: ["b2b_saas", "fintech"],
      needs: ["capital"],
      goals: ["raise_capital"],
      stages: ["raising", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2614",
    title: "Salt Lake Angels",
    kind: "Capital — angel group",
    source_url: "https://slcangels.org/",
    contact_email: "support@slcangels.org",
    matches: {
      industries: ["b2b_saas", "consumer_tech", "general"],
      needs: ["capital"],
      goals: ["raise_capital"],
      stages: ["early", "raising"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2611",
    title: "Kickstart Fund",
    kind: "Capital — seed VC",
    source_url: "https://www.kickstartfund.com/",
    contact_email: "info@kickstartfund.com",
    matches: {
      industries: ["b2b_saas", "consumer_tech"],
      needs: ["capital"],
      goals: ["raise_capital", "scale_business"],
      stages: ["raising", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2596",
    title: "Mercato Partners",
    kind: "Capital — growth equity",
    source_url: "https://www.mercatopartners.com/",
    contact_email: "admin@mercatopartners.com",
    matches: {
      industries: ["b2b_saas", "consumer_packaged_goods", "hospitality"],
      needs: ["capital"],
      goals: ["scale_business", "raise_capital"],
      stages: ["growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2585",
    title: "Utah Microloan Fund (UMLF)",
    kind: "Capital — microloans + training",
    source_url: "https://www.utahmicroloanfund.org/",
    matches: {
      communities: ["women", "multicultural", "new_american", "rural"],
      needs: ["capital"],
      goals: ["start_business", "build_business", "scale_business"],
      stages: ["idea", "early", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2618",
    title: "Wildcat MicroFund",
    kind: "Capital — milestone grants",
    source_url: "https://www.weber.edu/wildcat-microfund/",
    contact_email: "wildcatmicrofund@weber.edu",
    matches: {
      needs: ["capital"],
      goals: ["start_business", "build_business"],
      stages: ["idea", "early"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2647",
    title: "Small Business Development Center (SBDC)",
    kind: "Mentorship — confidential consulting",
    source_url: "https://utahsbdc.org/",
    contact_email: "mike.finnerty@usu.edu",
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
    resource_id: "r_2582",
    title: "University of Utah Lassonde Entrepreneur Institute",
    kind: "Community — student programs + grants",
    source_url: "https://lassonde.utah.edu/",
    contact_email: "lassonde@utah.edu",
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
    resource_id: "r_2651",
    title: "A Bolder Way Forward",
    kind: "Community — women founders initiative",
    source_url: "https://www.usu.edu/uwlp/abwf/",
    contact_email: "uwlp@usu.edu",
    matches: {
      communities: ["women"],
      needs: ["mentorship", "operations"],
      goals: ["start_business", "build_business", "scale_business"],
      stages: ["idea", "early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2682",
    title: "Utah Center for Rural Development",
    kind: "Capital + community — rural grants",
    source_url: "https://business.utah.gov/rural/",
    contact_email: "business@utah.gov",
    matches: {
      communities: ["rural"],
      needs: ["capital", "operations"],
      goals: ["scale_business", "build_business"],
      stages: ["early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2590",
    title: "Utah Department of Agriculture & Food",
    kind: "Capital + regulatory — ag programs",
    source_url: "https://ag.utah.gov/",
    contact_email: "agriculture@utah.gov",
    matches: {
      industries: ["agriculture"],
      needs: ["capital", "regulatory"],
      goals: ["scale_business", "expand_internationally"],
      stages: ["early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2656",
    title: "STRIVE — Veteran Entrepreneur Training",
    kind: "Mentorship — 6-week program",
    source_url: "https://utahvbrc.org/strive",
    contact_email: "vbrc@slcc.edu",
    matches: {
      communities: ["veteran"],
      needs: ["mentorship", "capital"],
      goals: ["start_business", "build_business"],
      stages: ["idea", "early"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2642",
    title: "Veteran-Owned Business Registration Utah",
    kind: "Community — registry + visibility",
    source_url: "https://vbr.veterans.utah.gov/s/",
    contact_email: "vbrc@slcc.edu",
    matches: {
      communities: ["veteran"],
      needs: ["customers", "operations"],
      goals: ["build_business", "scale_business", "find_customers"],
      stages: ["early", "raising", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2612",
    title: "World Trade Center Utah",
    kind: "International — export support",
    source_url: "https://www.wtcutah.com/",
    contact_email: "info@wtcutah.com",
    matches: {
      needs: ["customers", "operations", "regulatory"],
      goals: ["expand_internationally"],
      stages: ["raising", "growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_3666",
    title: "U.S. Commercial Service",
    kind: "International — federal export",
    source_url: "https://www.trade.gov/utah-salt-lake-city",
    contact_email: "Daniel.Bruner@trade.gov",
    matches: {
      needs: ["regulatory", "customers"],
      goals: ["expand_internationally"],
      stages: ["growth"],
      statewide: true,
    },
  },
  {
    resource_id: "r_2675",
    title: "Utah Pacific Islander Chamber of Commerce",
    kind: "Community — multicultural founders",
    source_url: "https://www.upichamber.org/",
    contact_email: "admin@upichamber.org",
    matches: {
      communities: ["multicultural"],
      needs: ["mentorship", "capital", "customers"],
      goals: ["start_business", "build_business", "scale_business"],
      stages: ["idea", "early", "raising", "growth"],
      statewide: true,
    },
  },
];

const overlap = (a: string[] | undefined, b: string[] | undefined): number => {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(a);
  return b.filter((x) => set.has(x)).length;
};

function score(
  input: FounderPassportInput,
  candidate: Catalogue,
): { score: number; reasons: string[] } {
  let s = 0;
  const reasons: string[] = [];
  const m = candidate.matches;

  if (m.stages?.length && input.stage && m.stages.includes(input.stage)) {
    s += 25;
    reasons.push(`Matches stage: ${input.stage}`);
  }
  if (
    m.industries?.length &&
    input.industry &&
    m.industries.includes(input.industry)
  ) {
    s += 15;
    reasons.push(`Matches industry: ${input.industry}`);
  } else if (
    m.industries?.length &&
    m.industries.length <= 2 &&
    input.industry &&
    !m.industries.includes(input.industry)
  ) {
    // Industry-specific resource, founder is in a different sector.
    s -= 25;
    reasons.push(
      `Industry-specific to ${m.industries.join(" / ")}.`,
    );
  }
  const goalHits = m.goals?.length && input.goal && m.goals.includes(input.goal)
    ? 1
    : 0;
  if (goalHits) {
    s += 20;
    reasons.push(`Matches your goal: ${input.goal}`);
  }
  const needHits = overlap(m.needs, input.needs);
  if (needHits > 0) {
    s += 10 * needHits;
    reasons.push(
      `Covers ${needHits} need${needHits === 1 ? "" : "s"}: ${input.needs
        .filter((n) => m.needs?.includes(n))
        .join(", ")}`,
    );
  }
  const communityHits = overlap(m.communities, input.communities);
  if (communityHits > 0) {
    s += 10 * communityHits;
    reasons.push(
      `Built for: ${input.communities
        .filter((c) => m.communities?.includes(c))
        .join(", ")}`,
    );
  } else if (
    m.communities?.length &&
    m.communities.length <= 2
  ) {
    // Resource is explicitly community-gated (e.g. veteran-only,
    // women-only) and the founder isn't in that community.
    s -= 100;
    reasons.push(
      `Built for ${m.communities.join(" / ")} — that's not you.`,
    );
  }
  if (
    m.statewide ||
    (input.county && m.counties?.includes(input.county))
  ) {
    s += 10;
    reasons.push(
      m.statewide
        ? "Available statewide"
        : `Serves ${input.county} County`,
    );
  } else if (m.counties?.length && input.county) {
    // out-of-area
    s -= 15;
    reasons.push(
      `Limited to ${m.counties.join(", ")} (you're in ${input.county})`,
    );
  }

  return { score: s, reasons };
}

const because = (
  input: FounderPassportInput,
  candidate: Catalogue,
  reasons: string[],
): string => {
  const persona =
    input.communities[0] ||
    input.industry ||
    input.stage ||
    "Utah founder";
  return `Because you're a ${persona.replace(/_/g, " ")}${
    input.goal ? ` focused on ${input.goal.replace(/_/g, " ")}` : ""
  }, ${candidate.title} is one of the closest fits in the state's portfolio${
    reasons.length ? ` — ${reasons[0].toLowerCase()}.` : "."
  }`;
};

const actionFor = (
  candidate: Catalogue,
  input: FounderPassportInput,
): string => {
  const goal = input.goal;
  if (candidate.matches.needs?.includes("capital")) {
    return goal === "raise_capital"
      ? `Email ${candidate.contact_email ?? "the team"} with a one-page pitch.`
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
): RecommendResponse {
  const scored = catalogue.map((c) => {
    const { score: s, reasons } = score(input, c);
    return { c, score: s, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  const recommendations: RecommendedResource[] = scored.map((row, i) => {
    let bucket: RecommendedResource["bucket"];
    if (row.score >= 35 && i < 3) bucket = "now";
    else if (row.score >= 20 && i < 7) bucket = "next";
    else bucket = "ignore";

    return {
      resource_id: row.c.resource_id,
      title: row.c.title,
      score: Math.max(0, Math.min(100, Math.round(row.score))),
      bucket,
      reasons: row.reasons.length
        ? row.reasons
        : ["No strong field match — listed for completeness."],
      because: because(input, row.c, row.reasons),
      action_text: actionFor(row.c, input),
      kind: row.c.kind,
      source_url: row.c.source_url,
      contact_email: row.c.contact_email,
    };
  });

  return {
    passport_id: passportId,
    recommendations,
    generated_at: new Date().toISOString(),
  };
}
