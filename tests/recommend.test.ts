import { describe, expect, it } from "vitest";
import { bucketize, scoreResource } from "@/lib/recommend";
import type { ResourceRow } from "@/lib/recommend";
import type { FounderPassportInput } from "@/schemas/founder-passport";
import { RecommendRequest } from "@/schemas/recommend";

// ─── Resource fixtures ─────────────────────────────────────────────

const r = (overrides: Partial<ResourceRow> & { id: string }): ResourceRow => ({
  title: overrides.id,
  description: null,
  sourceUrl: null,
  contactEmail: null,
  kind: null,
  topics: [],
  industries: [],
  communities: [],
  locations: [],
  ...overrides,
});

const fundingSLC: ResourceRow = r({
  id: "r_funding_slc",
  title: "Salt Lake Angels",
  topics: ["funding", "investors"],
  industries: ["software and information technology"],
  communities: [],
  locations: [{ county: "Salt Lake", city: null, statewide: false }],
});

const educationSLC: ResourceRow = r({
  id: "r_edu_slc",
  title: "Founder 101",
  topics: ["education", "pre-seed"],
  industries: [],
  communities: ["student"],
  locations: [{ county: "Salt Lake", city: null, statewide: false }],
});

const ruralWomen: ResourceRow = r({
  id: "r_rural_women",
  title: "Rural Women's AgriBusiness Fund",
  topics: ["funding", "growth"],
  industries: ["agriculture"],
  communities: ["rural", "women"],
  locations: [{ county: null, city: null, statewide: true }],
});

const veteranMfg: ResourceRow = r({
  id: "r_vet_mfg",
  title: "Utah Veterans in Manufacturing",
  topics: ["early stage", "talent"],
  industries: ["manufacturing"],
  communities: ["veteran"],
  locations: [{ county: "Weber", city: null, statewide: false }],
});

const techTransfer: ResourceRow = r({
  id: "r_tech_transfer",
  title: "Univ Utah Tech Transfer Office",
  topics: ["tech transfer", "research", "pre-seed"],
  industries: ["software and information technology"],
  communities: ["researcher"],
  locations: [{ county: "Salt Lake", city: null, statewide: false }],
});

const exportPgm: ResourceRow = r({
  id: "r_export",
  title: "STEP Export Program",
  topics: ["exports", "international"],
  industries: ["life sciences and healthcare"],
  communities: [],
  locations: [{ county: null, city: null, statewide: true }],
});

const generic: ResourceRow = r({
  id: "r_generic",
  title: "Generic resource with no metadata",
});

// ─── Persona fixtures ──────────────────────────────────────────────

const jordan: FounderPassportInput = {
  county: "Salt Lake",
  city: "Salt Lake City",
  stage: "idea",
  industry: "general",
  communities: ["student"],
  goal: "start_business",
  needs: [],
  constraints: [],
};

const priya: FounderPassportInput = {
  county: "Salt Lake",
  city: "Salt Lake City",
  stage: "paying_customers",
  industry: "b2b_saas",
  communities: ["women"],
  goal: "raise_seed_round",
  needs: [],
  constraints: [],
};

const maria: FounderPassportInput = {
  county: "Washington",
  city: "St. George",
  stage: "growth",
  industry: "agriculture",
  communities: ["rural", "women"],
  goal: "scale_business",
  needs: [],
  constraints: [],
};

const marcus: FounderPassportInput = {
  county: "Weber",
  city: "Ogden",
  stage: "mvp",
  industry: "manufacturing",
  communities: ["veteran"],
  goal: "hire",
  needs: [],
  constraints: [],
};

const david: FounderPassportInput = {
  county: "Utah",
  city: "Provo",
  stage: "growth",
  industry: "medical_device",
  communities: [],
  goal: "export",
  needs: [],
  constraints: [],
};

const amir: FounderPassportInput = {
  county: "Salt Lake",
  city: "Salt Lake City",
  stage: "idea",
  industry: "deep_tech",
  communities: ["researcher"],
  goal: "commercialize_research",
  needs: [],
  constraints: [],
};

// ─── Helper ────────────────────────────────────────────────────────

const score = (resource: ResourceRow, p: FounderPassportInput) =>
  scoreResource(resource, p).score;

// ─── Persona tests ─────────────────────────────────────────────────

describe("Priya (raising, B2B SaaS, SLC, women)", () => {
  it("ranks Funding above Education", () => {
    expect(score(fundingSLC, priya)).toBeGreaterThan(
      score(educationSLC, priya),
    );
  });
  it("at least one reason mentions Funding for Salt Lake Angels", () => {
    const result = scoreResource(fundingSLC, priya);
    expect(result.reasons.some((r) => /Funding/i.test(r))).toBe(true);
  });
  it("matches industry alias B2B SaaS → Software and Information Technology", () => {
    const result = scoreResource(fundingSLC, priya);
    expect(
      result.reasons.some((r) =>
        /software and information technology/i.test(r),
      ),
    ).toBe(true);
  });
});

describe("Maria (rural growth, agriculture, Washington county, women)", () => {
  it("ranks Rural Women's fund highest among fixtures", () => {
    const fixtures = [
      fundingSLC,
      educationSLC,
      ruralWomen,
      veteranMfg,
      techTransfer,
      exportPgm,
      generic,
    ];
    const ranked = fixtures
      .map((res) => ({ res, ...scoreResource(res, maria) }))
      .sort((a, b) => b.score - a.score);
    expect(ranked[0].res.id).toBe("r_rural_women");
  });
  it("statewide rural resource scores higher than county-mismatched local resource", () => {
    expect(score(ruralWomen, maria)).toBeGreaterThan(score(fundingSLC, maria));
  });
});

describe("Marcus (veteran, manufacturing, Weber, mvp, hire)", () => {
  it("ranks veteran manufacturing resource highest", () => {
    const fixtures = [fundingSLC, educationSLC, veteranMfg, exportPgm, generic];
    const ranked = fixtures
      .map((res) => ({ res, ...scoreResource(res, marcus) }))
      .sort((a, b) => b.score - a.score);
    expect(ranked[0].res.id).toBe("r_vet_mfg");
  });
  it("reasons cite veteran community", () => {
    const result = scoreResource(veteranMfg, marcus);
    expect(result.reasons.some((r) => /veteran/i.test(r))).toBe(true);
  });
});

describe("Jordan (idea, SLC, student, start_business)", () => {
  it("ranks Education+Pre-Seed resource highest", () => {
    const fixtures = [fundingSLC, educationSLC, ruralWomen, generic];
    const ranked = fixtures
      .map((res) => ({ res, ...scoreResource(res, jordan) }))
      .sort((a, b) => b.score - a.score);
    expect(ranked[0].res.id).toBe("r_edu_slc");
  });
});

describe("David (growth, medical device, Utah county, export)", () => {
  it("ranks export program highest", () => {
    const fixtures = [fundingSLC, educationSLC, exportPgm, generic];
    const ranked = fixtures
      .map((res) => ({ res, ...scoreResource(res, david) }))
      .sort((a, b) => b.score - a.score);
    expect(ranked[0].res.id).toBe("r_export");
  });
});

describe("Amir (idea, deep tech, SLC, researcher, commercialize_research)", () => {
  it("ranks tech transfer highest", () => {
    const fixtures = [
      fundingSLC,
      educationSLC,
      veteranMfg,
      techTransfer,
      generic,
    ];
    const ranked = fixtures
      .map((res) => ({ res, ...scoreResource(res, amir) }))
      .sort((a, b) => b.score - a.score);
    expect(ranked[0].res.id).toBe("r_tech_transfer");
  });
});

// ─── Edge cases ────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("statewide resource beats county-mismatched local resource", () => {
    const generalFounder: FounderPassportInput = {
      county: "Box Elder",
      stage: "growth",
      industry: "agriculture",
      communities: [],
      goal: "scale_business",
      needs: [],
      constraints: [],
    };
    expect(score(ruralWomen, generalFounder)).toBeGreaterThan(
      score(fundingSLC, generalFounder),
    );
  });

  it("empty founder industry doesn't penalize", () => {
    const noIndustry: FounderPassportInput = {
      county: "Salt Lake",
      stage: "paying_customers",
      industry: "",
      communities: [],
      goal: "raise_seed_round",
      needs: [],
      constraints: [],
    };
    // Should still score on stage + location + goal.
    expect(score(fundingSLC, noIndustry)).toBeGreaterThan(0);
  });

  it("empty resource community doesn't penalize", () => {
    // exportPgm has empty communities but high goal/location match for david.
    expect(score(exportPgm, david)).toBeGreaterThan(0);
  });

  it("resource with no metadata returns a low score", () => {
    expect(score(generic, priya)).toBeLessThan(40);
  });

  it("bucketize hides weak-signal rows from now/next", () => {
    // A passport that won't match any of the fixtures well: agriculture in
    // Box Elder county, no goal-tagged topics. Top scores should all be
    // below the actionable floor → empty now / next, populated ignore.
    const lonelyFounder: FounderPassportInput = {
      county: "Box Elder",
      stage: "mature",
      industry: "tourism",
      communities: [],
      goal: "find_workspace",
      needs: [],
      constraints: [],
    };
    const fixtures = [fundingSLC, educationSLC, generic];
    const scored = fixtures.map((resource) => ({
      resource,
      ...scoreResource(resource, lonelyFounder),
    }));
    const buckets = bucketize(scored);
    // No item should reach the actionable floor for this founder.
    for (const b of [...buckets.now, ...buckets.next]) {
      expect(b.score).toBeGreaterThanOrEqual(25);
    }
    // Weak matches with at least one reason should still appear in ignore
    // (ranking-as-coaching).
    expect(Array.isArray(buckets.ignore)).toBe(true);
  });

  it("bucketize splits top 3 / next 3 / ignore", () => {
    // Use only resources without community tags (or with matching tags),
    // so the identity gate doesn't shuffle them into ignore. Six unrestricted
    // resources plus one ignore-tier item proves the top-3/next-3 split.
    const fundingSLC2: ResourceRow = {
      ...fundingSLC,
      id: "r_funding_slc_2",
      title: "Park City Angels",
    };
    const fundingSLC3: ResourceRow = {
      ...fundingSLC,
      id: "r_funding_slc_3",
      title: "Wasatch Capital",
    };
    const generic2: ResourceRow = {
      ...generic,
      id: "r_generic_2",
      title: "Another generic",
    };
    const generic3: ResourceRow = {
      ...generic,
      id: "r_generic_3",
      title: "Yet another generic",
    };
    const fixtures = [
      fundingSLC,
      fundingSLC2,
      fundingSLC3,
      generic,
      generic2,
      generic3,
      exportPgm,
    ];
    const scored = fixtures.map((resource) => ({
      resource,
      ...scoreResource(resource, priya),
    }));
    const buckets = bucketize(scored);
    expect(buckets.now.length).toBe(3);
    expect(buckets.next.length).toBe(3);
    expect(Array.isArray(buckets.ignore)).toBe(true);
  });

  it("community-restricted resources don't enter now/next", () => {
    // Demo-case regression: an MVP / B2B SaaS / University researcher
    // passport must not see a student-only program in the actionable
    // buckets, even when other signals (location/goal/industry) align.
    const teenShaped: ResourceRow = r({
      id: "r_teen_shaped",
      title: "Teen Entrepreneur Support Center",
      topics: ["funding", "entrepreneurship communities", "start a business"],
      industries: ["software and information technology"],
      communities: ["student"],
      locations: [{ county: null, city: null, statewide: true }],
    });
    const researcherFounder: FounderPassportInput = {
      county: "Salt Lake",
      city: "Salt Lake City",
      stage: "mvp",
      industry: "b2b_saas",
      communities: ["researcher"],
      goal: "raise_seed_round",
      needs: [],
      constraints: [],
    };
    const result = scoreResource(teenShaped, researcherFounder);
    expect(result.communityRestricted).toBe(true);
    // Score still high enough to clear the actionable floor on signal alone —
    // the gate, not the score, is what keeps Teen out of the top buckets.
    expect(result.score).toBeGreaterThanOrEqual(25);

    const fundingMatch: ResourceRow = r({
      id: "r_funding_clean",
      title: "Salt Lake Seed Capital",
      topics: ["funding", "investors", "seed"],
      industries: ["software and information technology"],
      communities: [],
      locations: [{ county: "Salt Lake", city: null, statewide: false }],
    });
    const fixtures = [teenShaped, fundingMatch];
    const scored = fixtures.map((resource) => ({
      resource,
      ...scoreResource(resource, researcherFounder),
    }));
    const buckets = bucketize(scored);
    const inNowOrNext = [...buckets.now, ...buckets.next].map(
      (s) => s.resource.id,
    );
    expect(inNowOrNext).not.toContain("r_teen_shaped");
    expect(inNowOrNext).toContain("r_funding_clean");
    expect(buckets.ignore.map((s) => s.resource.id)).toContain("r_teen_shaped");
  });

  it("empty-community founder is gated out of community-tagged resources", () => {
    // A founder who didn't pick any identity tags is also outside any
    // identity-targeted program — those are not generic fallbacks.
    const womenOnly: ResourceRow = r({
      id: "r_women_only",
      title: "Women's Business Center",
      topics: ["funding", "mentorship"],
      industries: [],
      communities: ["women"],
      locations: [{ county: null, city: null, statewide: true }],
    });
    const noIdentity: FounderPassportInput = {
      county: "Salt Lake",
      city: "Salt Lake City",
      stage: "mvp",
      industry: "b2b_saas",
      communities: [],
      goal: "raise_seed_round",
      needs: [],
      constraints: [],
    };
    const result = scoreResource(womenOnly, noIdentity);
    expect(result.communityRestricted).toBe(true);
  });

  it("matching community is not restricted", () => {
    // Sanity check the gate: when identity matches, the resource is
    // unrestricted and should be eligible for now/next.
    const result = scoreResource(ruralWomen, maria);
    expect(result.communityRestricted).toBe(false);
  });

  it("empty-community resource is not restricted", () => {
    // Generic resources with no community tag don't trip the gate for
    // anyone, regardless of founder identity.
    const result = scoreResource(fundingSLC, marcus);
    expect(result.communityRestricted).toBe(false);
  });

  it("'any' sentinel in resource communities bypasses the gate", () => {
    // GOEO source data uses `any` alongside specific communities to mean
    // "we serve everyone, especially these groups." Resources with `any`
    // (SBDC, SBA, StartUp State, …) must remain eligible for now/next
    // even when the founder's identity isn't in the listed groups.
    const broadServing: ResourceRow = r({
      id: "r_broad_serving",
      title: "Small Business Development Center (SBDC)",
      topics: ["funding", "early stage"],
      industries: [],
      communities: ["any", "women", "veteran", "rural", "student"],
      locations: [{ county: null, city: null, statewide: true }],
    });
    const researcherFounder: FounderPassportInput = {
      county: "Salt Lake",
      stage: "mvp",
      industry: "b2b_saas",
      communities: ["researcher"],
      goal: "raise_seed_round",
      needs: [],
      constraints: [],
    };
    const result = scoreResource(broadServing, researcherFounder);
    expect(result.communityRestricted).toBe(false);
  });
});

// ─── RecommendRequest schema (XOR contract) ────────────────────────

describe("RecommendRequest schema", () => {
  const fullBody = {
    stage: "mvp",
    industry: "B2B SaaS",
    goal: "raise_seed_round",
    communities: [],
    needs: [],
    constraints: [],
  };

  it("accepts a passport_id only", () => {
    const r = RecommendRequest.safeParse({ passport_id: "fp_priya" });
    expect(r.success).toBe(true);
  });

  it("accepts a full body without passport_id", () => {
    const r = RecommendRequest.safeParse(fullBody);
    expect(r.success).toBe(true);
  });

  it("rejects passport_id together with body fields", () => {
    const r = RecommendRequest.safeParse({
      passport_id: "fp_priya",
      ...fullBody,
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty payload", () => {
    expect(RecommendRequest.safeParse({}).success).toBe(false);
  });

  it("rejects a passport_id without the fp_ prefix", () => {
    expect(
      RecommendRequest.safeParse({ passport_id: "priya" }).success,
    ).toBe(false);
  });
});
