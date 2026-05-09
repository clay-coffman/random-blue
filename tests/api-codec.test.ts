import { describe, expect, it } from "vitest";
import { toWirePassportInput } from "@/lib/api-codec";
import { GOALS, STAGES } from "@/lib/intake-options";
import {
  FounderGoal,
  FounderStage,
} from "@/schemas/founder-passport";
import type { FounderPassportInput } from "@/types/passport";

// `toWirePassportInput` is a pure transform — no fetch, no DB, no LLM.
// The interesting behavior is the form-vocab → schema-vocab translation
// it applies to `stage` and `goal` so the IntakeForm submit doesn't
// 400 against the API's zod enum. Schema-vocab values pass through
// unchanged so direct API consumers (CLI, MCP, third-party agents)
// keep working.

const base: FounderPassportInput = {
  county: "Salt Lake",
  city: "Salt Lake City",
  industry: "b2b_saas",
  communities: ["women"],
  needs: ["capital"],
  constraints: [],
  // stage + goal vary per test
  stage: undefined,
  goal: undefined,
};

describe("toWirePassportInput — vocabulary translation", () => {
  it("maps form stage values to schema enums", () => {
    expect(toWirePassportInput({ ...base, stage: "raising" }).stage).toBe(
      "paying_customers",
    );
    expect(toWirePassportInput({ ...base, stage: "early" }).stage).toBe("mvp");
    expect(toWirePassportInput({ ...base, stage: "idea" }).stage).toBe("idea");
    expect(toWirePassportInput({ ...base, stage: "growth" }).stage).toBe(
      "growth",
    );
  });

  it("passes schema-vocab stages through unchanged", () => {
    expect(
      toWirePassportInput({ ...base, stage: "paying_customers" }).stage,
    ).toBe("paying_customers");
    expect(toWirePassportInput({ ...base, stage: "pre_seed" }).stage).toBe(
      "pre_seed",
    );
    expect(toWirePassportInput({ ...base, stage: "mature" }).stage).toBe(
      "mature",
    );
  });

  it("maps form goal values to schema enums", () => {
    expect(
      toWirePassportInput({ ...base, goal: "raise_capital" }).goal,
    ).toBe("raise_seed_round");
    expect(toWirePassportInput({ ...base, goal: "hire_talent" }).goal).toBe(
      "hire",
    );
    expect(
      toWirePassportInput({ ...base, goal: "expand_internationally" }).goal,
    ).toBe("export");
    expect(
      toWirePassportInput({ ...base, goal: "build_business" }).goal,
    ).toBe("start_business");
  });

  it("passes schema-vocab goals through unchanged", () => {
    expect(
      toWirePassportInput({ ...base, goal: "raise_seed_round" }).goal,
    ).toBe("raise_seed_round");
    expect(
      toWirePassportInput({ ...base, goal: "find_mentors" }).goal,
    ).toBe("find_mentors");
  });

  it("passes unknown values through for both stage and goal (lets server zod fail loudly)", () => {
    // An unrecognized value shouldn't be silently coerced — the server's
    // zod validation will reject it with a clear error, which is more
    // useful than mapping to some default. Asserted on both axes so an
    // asymmetric refactor of toSchemaStage / toSchemaGoal would be
    // caught by tests.
    expect(toWirePassportInput({ ...base, stage: "fictional" }).stage).toBe(
      "fictional",
    );
    expect(
      toWirePassportInput({ ...base, goal: "fictional_goal" }).goal,
    ).toBe("fictional_goal");
  });

  it("preserves undefined stage / goal", () => {
    expect(toWirePassportInput(base).stage).toBeUndefined();
    expect(toWirePassportInput(base).goal).toBeUndefined();
  });

  it("does not touch other fields", () => {
    const out = toWirePassportInput({ ...base, stage: "raising" });
    expect(out.county).toBe("Salt Lake");
    expect(out.city).toBe("Salt Lake City");
    expect(out.industry).toBe("b2b_saas");
    expect(out.communities).toEqual(["women"]);
    expect(out.needs).toEqual(["capital"]);
  });
});

// Drift guards — every form-facing dropdown value must translate to a
// valid schema enum. If anyone adds a new value to STAGES or GOALS in
// `lib/intake-options.ts` without updating FORM_TO_SCHEMA_*, these
// fail loudly at test time instead of silently 400ing in prod (the
// exact bug this PR fixes). Symmetric coverage to the renamed-goal
// assertions above; protects identity mappings (start_business →
// start_business, etc.) too.
describe("toWirePassportInput — drift guards", () => {
  for (const opt of STAGES) {
    it(`form stage "${opt.value}" maps to a valid FounderStage`, () => {
      const wire = toWirePassportInput({ ...base, stage: opt.value });
      expect(FounderStage.options).toContain(wire.stage);
    });
  }

  for (const opt of GOALS) {
    it(`form goal "${opt.value}" maps to a valid FounderGoal`, () => {
      const wire = toWirePassportInput({ ...base, goal: opt.value });
      expect(FounderGoal.options).toContain(wire.goal);
    });
  }
});
