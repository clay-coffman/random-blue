import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Queue of D1 query results consumed by the fake `db()` in call order:
//   loadCachedPlan emits 2 selects (passport rows, then rec⨝resource rows)
//   generatePlanForPassport additionally emits delete / insert / update
const queue: unknown[] = [];

vi.mock("@/lib/db", () => ({
  db: () => makeFakeDb(),
}));

vi.mock("@/lib/cf", () => ({
  env: () => ({ ANTHROPIC_API_KEY: "test" }),
}));

vi.mock("@/lib/resources-loader", () => ({
  loadAllResourceRows: async () => [],
}));

vi.mock("@/lib/recommend-explain", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/recommend-explain")
  >("@/lib/recommend-explain");
  return {
    ...actual,
    synthesizeNarrative: vi.fn(async () => ({
      narrative: "Stubbed Claude paragraph.",
      degraded: false,
    })),
  };
});

import {
  loadCachedPlan,
  generatePlanForPassport,
  PassportCorruptError,
} from "@/lib/plan-loader";

// Drizzle query builders are chainable PromiseLike values. Every
// builder method returns the same chain; awaiting it resolves to the
// next queued result. Callers don't inspect the builder methods'
// arguments — we only test the data flowing in/out.
function makeFakeDb() {
  function chain(): unknown {
    const c = {
      then(
        resolve: ((value: unknown) => unknown) | null | undefined,
        reject?: ((reason: unknown) => unknown) | null,
      ): Promise<unknown> {
        const next = queue.shift();
        return Promise.resolve(next).then(
          resolve ?? undefined,
          reject ?? undefined,
        );
      },
      from: () => c,
      where: () => c,
      limit: () => c,
      innerJoin: () => c,
      orderBy: () => c,
      values: () => c,
      set: () => c,
    };
    return c;
  }
  return {
    select: () => chain(),
    insert: () => chain(),
    update: () => chain(),
    delete: () => chain(),
  } as unknown as ReturnType<typeof import("@/lib/db").db>;
}

const baseRow = {
  id: "fp_maria",
  county: "Washington",
  city: "St. George",
  stage: "growth",
  industry: "agriculture",
  communitiesJson: JSON.stringify(["rural", "women"]),
  goal: "scale_business",
  urgency: "this_quarter",
  businessSize: "small",
  businessType: null,
  needsJson: JSON.stringify(["growth_capital"]),
  constraintsJson: JSON.stringify(["rural_location"]),
  websiteUrl: null,
  enrichedAt: null,
  enrichmentSource: null,
  narrativeText: "Real Claude prose for Maria.",
  narrativeDegraded: null,
  createdAt: new Date(),
};

const recRow = {
  rec: {
    id: "rec_1",
    passportId: "fp_maria",
    resourceId: "r_42",
    score: 9.5,
    reasonsJson: JSON.stringify(["Geo match (Washington)"]),
    actionText: "Apply this week",
    bucket: "now",
    createdAt: new Date(),
  },
  res: {
    id: "r_42",
    title: "Rural Capital Fund",
    kind: "Capital — non-dilutive",
    sourceUrl: "https://example.com",
    contactEmail: null,
  },
};

beforeEach(() => {
  queue.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("loadCachedPlan", () => {
  it("returns null when the passport does not exist", async () => {
    queue.push([]); // passport select
    const out = await loadCachedPlan("fp_missing");
    expect(out).toBeNull();
  });

  it("returns a populated CachedPlan with degraded=false when narrativeDegraded is null", async () => {
    queue.push([{ ...baseRow }]);
    queue.push([recRow]);
    const out = await loadCachedPlan("fp_maria");
    expect(out).not.toBeNull();
    expect(out!.passport.stage).toBe("growth");
    expect(out!.passport.communities).toEqual(["rural", "women"]);
    expect(out!.result.narrative).toBe("Real Claude prose for Maria.");
    expect(out!.result.degraded).toBe(false);
    expect(out!.result.recommendations).toHaveLength(1);
    expect(out!.result.recommendations[0]).toMatchObject({
      resourceId: "r_42",
      title: "Rural Capital Fund",
      bucket: "now",
      because: "Apply this week",
    });
  });

  it("returns degraded=false when narrativeDegraded is 0", async () => {
    queue.push([{ ...baseRow, narrativeDegraded: 0 as unknown as boolean }]);
    queue.push([]);
    const out = await loadCachedPlan("fp_maria");
    expect(out!.result.degraded).toBe(false);
  });

  it("returns degraded=true when narrativeDegraded is truthy", async () => {
    queue.push([{ ...baseRow, narrativeDegraded: true }]);
    queue.push([]);
    const out = await loadCachedPlan("fp_maria");
    expect(out!.result.degraded).toBe(true);
  });

  it("throws PassportCorruptError when the stored stage is out of vocabulary", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    queue.push([{ ...baseRow, stage: "not_a_real_stage" }]);
    await expect(loadCachedPlan("fp_maria")).rejects.toBeInstanceOf(
      PassportCorruptError,
    );
    expect(err).toHaveBeenCalledWith(
      expect.stringContaining("invalid enum columns"),
    );
    err.mockRestore();
  });

  it("returns empty recommendations when the passport has never been scored", async () => {
    queue.push([{ ...baseRow, narrativeText: null, narrativeDegraded: null }]);
    queue.push([]); // no rec rows
    const out = await loadCachedPlan("fp_maria");
    expect(out!.result.recommendations).toEqual([]);
    expect(out!.result.narrative).toBe("");
    expect(out!.result.degraded).toBe(false);
  });
});

describe("generatePlanForPassport", () => {
  it("throws when the passport does not exist", async () => {
    queue.push([]);
    await expect(generatePlanForPassport("fp_nope")).rejects.toThrow(
      /not found/i,
    );
  });

  it("propagates PassportCorruptError from the loader", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    queue.push([{ ...baseRow, goal: "bogus_goal" }]);
    await expect(generatePlanForPassport("fp_maria")).rejects.toBeInstanceOf(
      PassportCorruptError,
    );
    err.mockRestore();
  });

  it("returns a CachedPlan with the stubbed narrative + degraded flag", async () => {
    // loadCachedPlan: passport row + (empty) rec rows
    queue.push([{ ...baseRow }]);
    queue.push([]);
    // generate path: delete + (no insert because labelled is empty since
    // loadAllResourceRows is stubbed []) + update
    queue.push(undefined);
    queue.push(undefined);
    const out = await generatePlanForPassport("fp_maria");
    expect(out.result.passportId).toBe("fp_maria");
    expect(out.result.narrative).toBe("Stubbed Claude paragraph.");
    expect(out.result.degraded).toBe(false);
    expect(out.result.recommendations).toEqual([]);
  });
});
