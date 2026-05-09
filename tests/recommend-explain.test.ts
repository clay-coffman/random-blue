import { describe, expect, it } from "vitest";
import {
  explainSkip,
  resourceRowToSkipFacets,
  type SkipFacets,
  type SkipPassport,
} from "@/lib/recommend-explain";
import type { ResourceRow } from "@/lib/recommend";

// Stay within a single stage vocabulary — `growth` exists in both the
// `FounderStage` enum and the intake-options `STAGES` table, which keeps
// the mismatch test honest if either side ever normalises.
const basePassport: SkipPassport = {
  county: "Salt Lake",
  stage: "growth",
  industry: "b2b_saas",
  communities: ["women"],
};

describe("explainSkip", () => {
  it("flags community mismatch as the strongest signal", () => {
    const facets: SkipFacets = {
      // founder is in `women`, this resource is for other communities
      communities: ["multicultural", "new_american", "rural"],
      // industry/geo also mismatch — community should still win
      industries: ["agriculture"],
      counties: ["Beaver"],
    };
    expect(explainSkip(facets, basePassport)).toBe(
      "Built for Multicultural / minority-owned / New American / immigrant / Rural founders — that's not your profile.",
    );
  });

  it("does not flag community when founder is in one of the resource's communities", () => {
    const facets: SkipFacets = {
      communities: ["women", "rural"],
      industries: ["agriculture"], // narrow + mismatch → industry should fire
    };
    expect(explainSkip(facets, basePassport)).toBe(
      "Industry-specific to Agriculture / food.",
    );
  });

  it("flags industry mismatch only when narrow (≤ 2 industries)", () => {
    const wide: SkipFacets = {
      industries: ["agriculture", "manufacturing", "energy", "general"],
    };
    // 4 industries → not narrow, no industry mismatch fires; falls through.
    expect(explainSkip(wide, basePassport)).toBe(
      "Low fit on your passport — only a partial match.",
    );

    const narrow: SkipFacets = { industries: ["fintech"] };
    expect(explainSkip(narrow, basePassport)).toBe(
      "Industry-specific to Financial services.",
    );
  });

  it("flags geo mismatch when county-restricted and founder is elsewhere", () => {
    const facets: SkipFacets = {
      industries: ["b2b_saas"], // matches founder's industry
      counties: ["Washington"],
      statewide: false,
    };
    expect(explainSkip(facets, basePassport)).toBe(
      "Limited to Washington (you're in Salt Lake).",
    );
  });

  it("does not flag geo when statewide is true", () => {
    const facets: SkipFacets = {
      industries: ["b2b_saas"],
      counties: ["Washington"],
      statewide: true,
    };
    // Falls through past geo to fallback.
    expect(explainSkip(facets, basePassport)).toBe(
      "Low fit on your passport — only a partial match.",
    );
  });

  it("flags stage mismatch when other signals are clean", () => {
    // Pass stages the founder isn't in — STAGES options include "idea" and
    // "early"; the basePassport stage is "paying_customers".
    const facets: SkipFacets = {
      stages: ["idea", "early"],
    };
    expect(explainSkip(facets, basePassport)).toBe(
      "Built for idea — exploring / early — building stage founders.",
    );
  });

  it("falls back to 'already covered' when a higher-ranked option claims the same need", () => {
    const facets: SkipFacets = {
      // No mismatch on community/industry/geo/stage.
      needs: ["capital"],
    };
    const opts = { alreadyCoveredNeeds: new Set(["capital"]) };
    expect(explainSkip(facets, basePassport, opts)).toBe(
      "Already covered by higher-ranked options.",
    );
  });

  it("falls back to generic low-fit when nothing else fires", () => {
    const facets: SkipFacets = {};
    expect(explainSkip(facets, basePassport)).toBe(
      "Low fit on your passport — only a partial match.",
    );
  });

  it("priority: community > industry > geo > stage > already-covered", () => {
    // All five conditions tripped at once — community wins.
    const facets: SkipFacets = {
      communities: ["multicultural"],
      industries: ["agriculture"],
      counties: ["Washington"],
      statewide: false,
      stages: ["idea"],
      needs: ["capital"],
    };
    const opts = { alreadyCoveredNeeds: new Set(["capital"]) };
    expect(explainSkip(facets, basePassport, opts)).toMatch(
      /Built for Multicultural \/ minority-owned founders/,
    );
  });
});

describe("resourceRowToSkipFacets", () => {
  const baseRow: ResourceRow = {
    id: "r_test",
    title: "Test Resource",
    description: null,
    sourceUrl: null,
    contactEmail: null,
    kind: null,
    topics: [],
    industries: ["b2b_saas"],
    communities: ["veteran"],
    locations: [],
  };

  it("flattens locations into counties + statewide", () => {
    const row: ResourceRow = {
      ...baseRow,
      locations: [
        { county: "Salt Lake", city: null, statewide: false },
        { county: "Utah", city: null, statewide: false },
      ],
    };
    expect(resourceRowToSkipFacets(row)).toEqual({
      industries: ["b2b_saas"],
      communities: ["veteran"],
      counties: ["Salt Lake", "Utah"],
      statewide: false,
    });
  });

  it("filters out null counties so explainSkip's geo branch only sees real ones", () => {
    const row: ResourceRow = {
      ...baseRow,
      // Statewide rows often have null county — including null in counties
      // would break explainSkip's `!includes(passport.county)` check.
      locations: [{ county: null, city: null, statewide: true }],
    };
    const facets = resourceRowToSkipFacets(row);
    expect(facets.counties).toBeUndefined();
    expect(facets.statewide).toBe(true);
  });

  it("derives statewide from any location with statewide=true", () => {
    const row: ResourceRow = {
      ...baseRow,
      locations: [
        { county: "Salt Lake", city: null, statewide: false },
        { county: null, city: null, statewide: true },
      ],
    };
    expect(resourceRowToSkipFacets(row).statewide).toBe(true);
  });

  it("end-to-end: a county-restricted row with industry match yields a geo skip reason", () => {
    const row: ResourceRow = {
      ...baseRow,
      industries: ["b2b_saas"], // matches base passport
      communities: [], // no community filter
      locations: [{ county: "Washington", city: null, statewide: false }],
    };
    expect(explainSkip(resourceRowToSkipFacets(row), basePassport)).toBe(
      "Limited to Washington (you're in Salt Lake).",
    );
  });
});
