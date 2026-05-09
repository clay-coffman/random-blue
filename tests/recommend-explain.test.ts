import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import {
  bestPositiveBecause,
  deterministicNarrative,
  explainSkip,
  humanizeReason,
  resourceRowToSkipFacets,
  synthesizeNarrative,
  type SkipFacets,
  type SkipPassport,
} from "@/lib/recommend-explain";
import type { ResourceRow, Scored } from "@/lib/recommend";
import type { FounderPassportInput } from "@/schemas/founder-passport";

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
    // Pass stages the founder isn't in — basePassport.stage is "growth".
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

// ─── humanizeReason ────────────────────────────────────────────────────

const priyaPassport: FounderPassportInput = {
  county: "Salt Lake",
  city: "Salt Lake City",
  stage: "paying_customers",
  industry: "b2b_saas",
  communities: ["women"],
  goal: "raise_seed_round",
  urgency: "this_month",
  needs: ["angel_investors", "venture_capital", "pitch_prep"],
  constraints: ["paying_customers", "18_months_in"],
};

describe("humanizeReason", () => {
  it("translates exact-stage match using the schema-keyed label", () => {
    expect(
      humanizeReason("Matches stage: paying_customers", priyaPassport),
    ).toBe("Matches your Paying customers stage");
  });

  it("acknowledges adjacency for partial stage matches", () => {
    expect(
      humanizeReason("Adjacent stage tagged (growth)", priyaPassport),
    ).toBe("Built for Growth-stage founders (close to your Paying customers stage)");
  });

  it("translates the goal slot in a tagged-with-goal reason", () => {
    expect(
      humanizeReason(
        "Tagged customers (matches your goal: find_customers)",
        priyaPassport,
      ),
    ).toBe("Tagged customers — matches your Finding customers goal");
  });

  it("passes through 'Statewide resource' unchanged", () => {
    expect(humanizeReason("Statewide resource", priyaPassport)).toBe(
      "Statewide resource",
    );
  });

  it("uses the COMMUNITY_TAGS label for community reasons", () => {
    expect(humanizeReason("For women-focused founders", priyaPassport)).toBe(
      "For Woman-owned founders",
    );
  });

  it("never leaks snake_case to the user — fall-through gets titlecased", () => {
    // Hypothetical future reason format the regex doesn't match — the
    // belt-and-suspenders titlecaser must catch any `a_b` token.
    expect(humanizeReason("priority: raise_seed_round", priyaPassport)).not.toMatch(
      /[a-z]_[a-z]/,
    );
  });
});

// ─── deterministicNarrative ────────────────────────────────────────────

const baseResource = (
  id: string,
  title: string,
  reasons: string[],
): Scored => ({
  resource: {
    id,
    title,
    description: null,
    sourceUrl: null,
    contactEmail: null,
    kind: null,
    topics: [],
    industries: [],
    communities: [],
    locations: [],
  },
  score: 78,
  reasons,
});

describe("deterministicNarrative", () => {
  it("returns empty when no recommendations", () => {
    expect(deterministicNarrative(priyaPassport, [])).toBe("");
  });

  it("names specific orgs in the prose", () => {
    const recs = [
      baseResource("r_1", "Salt Lake Angels", ["Statewide resource"]),
      baseResource("r_2", "Kickstart Fund", ["Statewide resource"]),
    ];
    const out = deterministicNarrative(priyaPassport, recs);
    expect(out).toContain("Salt Lake Angels");
    expect(out).toContain("Kickstart Fund");
  });

  it("hedges when most recs are stage-adjacent", () => {
    const recs = [
      baseResource("r_1", "A", ["Adjacent stage tagged (growth)"]),
      baseResource("r_2", "B", ["Adjacent stage tagged (growth)"]),
      baseResource("r_3", "C", ["Adjacent stage tagged (growth)"]),
    ];
    const out = deterministicNarrative(priyaPassport, recs);
    expect(out.toLowerCase()).toContain("adjacent");
    expect(out.toLowerCase()).toContain("growth");
    expect(out).toContain("Paying customers".toLowerCase());
  });

  it("never contains snake_case enum values", () => {
    const recs = [
      baseResource("r_1", "Org A", ["Adjacent stage tagged (growth)"]),
    ];
    const out = deterministicNarrative(priyaPassport, recs);
    expect(out).not.toMatch(/\b(raise_seed_round|paying_customers|b2b_saas)\b/);
    expect(out).not.toMatch(/[a-z]+_[a-z]+/);
  });
});

// ─── bestPositiveBecause ───────────────────────────────────────────────

describe("bestPositiveBecause", () => {
  it("picks the first humanizable reason in scorer order", () => {
    const s = baseResource("r_1", "X", [
      "Matches stage: paying_customers",
      "Statewide resource",
      "For women-focused founders",
    ]);
    expect(bestPositiveBecause(s, priyaPassport)).toBe(
      "Matches your Paying customers stage",
    );
  });

  it("falls back to a strong-match line when reasons are empty", () => {
    const s = baseResource("r_1", "Mystery Org", []);
    expect(bestPositiveBecause(s, priyaPassport)).toBe(
      "Strong match for Mystery Org",
    );
  });
});

// ─── synthesizeNarrative ───────────────────────────────────────────────

// Hand-written fake of the bits of the Anthropic SDK we touch. Per
// CLAUDE.md § Testing — "no mocking lib for external services; stub
// with hand-written fakes". The factory returns a stub satisfying just
// the `messages.create` shape used by `synthesizeNarrative`.
function fakeAnthropic(opts: {
  text?: string;
  throwError?: Error;
}): { client: Anthropic; calls: { systemFirstChars: string; userBody: string }[] } {
  const calls: { systemFirstChars: string; userBody: string }[] = [];
  const client = {
    messages: {
      create: async (body: unknown) => {
        const b = body as {
          system: Array<{ text: string }>;
          messages: Array<{ content: string }>;
        };
        calls.push({
          systemFirstChars: b.system?.[0]?.text?.slice(0, 80) ?? "",
          userBody: b.messages?.[0]?.content ?? "",
        });
        if (opts.throwError) throw opts.throwError;
        return {
          content: [{ type: "text", text: opts.text ?? "" }],
        };
      },
    },
  } as unknown as Anthropic;
  return { client, calls };
}

const priyaScored: Scored[] = [
  baseResource("r_2628", "Small Business Administration (SBA)", [
    "Adjacent stage tagged (growth)",
    "Statewide resource",
    "Tagged funding (matches your goal: raise_seed_round)",
    "For women-focused founders",
  ]),
  baseResource("r_2647", "Small Business Development Center (SBDC)", [
    "Adjacent stage tagged (growth)",
    "Statewide resource",
    "For women-focused founders",
  ]),
];

describe("synthesizeNarrative", () => {
  it("returns empty for an empty retrieval set without calling the LLM", async () => {
    const { client, calls } = fakeAnthropic({ text: "" });
    const out = await synthesizeNarrative(priyaPassport, [], client);
    expect(out).toBe("");
    expect(calls).toHaveLength(0);
  });

  it("ships human-readable labels in the user content (no snake_case)", async () => {
    const { client, calls } = fakeAnthropic({
      text: '{"narrative":"ok"}',
    });
    await synthesizeNarrative(priyaPassport, priyaScored, client);
    expect(calls).toHaveLength(1);
    const body = calls[0].userBody;
    // The schema-keyed labels must appear in the prompt.
    expect(body).toContain("B2B SaaS");
    expect(body).toContain("Paying customers");
    expect(body).toContain("Seed round");
    expect(body).toContain("Woman-owned");
    // And the LLM must see the per-resource adjacency signal.
    expect(body).toContain('"stage": "adjacent"');
  });

  it("returns the LLM's narrative when the response is valid JSON", async () => {
    const { client } = fakeAnthropic({
      text: '```json\n{"narrative":"Pretend strategic paragraph."}\n```',
    });
    const out = await synthesizeNarrative(priyaPassport, priyaScored, client);
    expect(out).toBe("Pretend strategic paragraph.");
  });

  it("falls back to deterministic prose on Anthropic error and logs", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = fakeAnthropic({ throwError: new Error("boom") });
    const out = await synthesizeNarrative(priyaPassport, priyaScored, client);
    expect(out).not.toBe("");
    expect(out).toContain("Small Business Administration (SBA)");
    expect(warn).toHaveBeenCalledWith(
      "[recommend-explain] generation failed",
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it("falls back to deterministic prose when the LLM JSON fails the schema", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = fakeAnthropic({
      text: '{"narrative":""}', // empty narrative — fails min(1)
    });
    const out = await synthesizeNarrative(priyaPassport, priyaScored, client);
    expect(out).not.toBe("");
    expect(out).toContain("Small Business Administration (SBA)");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("falls back when the LLM returns no JSON object at all", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = fakeAnthropic({ text: "no JSON here, sorry" });
    const out = await synthesizeNarrative(priyaPassport, priyaScored, client);
    expect(out).not.toBe("");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
