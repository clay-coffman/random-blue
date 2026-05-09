import { describe, expect, it } from "vitest";
import {
  companyToPassportInitial,
  type CompanyForPassport,
} from "@/lib/company-to-passport";

const empty: CompanyForPassport = {
  name: null,
  website: null,
  sector: null,
  stage: null,
  county: null,
  city: null,
  employeeCount: null,
};

describe("companyToPassportInitial", () => {
  it("returns an empty object when no fields are usable", () => {
    expect(companyToPassportInitial(empty)).toEqual({});
  });

  it("forwards a known county and trims a free-text city", () => {
    const out = companyToPassportInitial({
      ...empty,
      county: "Salt Lake",
      city: "  Salt Lake City  ",
    });
    expect(out.county).toBe("Salt Lake");
    expect(out.city).toBe("Salt Lake City");
  });

  it("drops an unknown county", () => {
    const out = companyToPassportInitial({
      ...empty,
      county: "Mordor",
    });
    expect(out.county).toBeUndefined();
  });

  it("maps free-text sector to a form INDUSTRY value, case-insensitively", () => {
    expect(
      companyToPassportInitial({ ...empty, sector: "B2B Software" }).industry,
    ).toBe("b2b_saas");
    expect(
      companyToPassportInitial({ ...empty, sector: "FinTech" }).industry,
    ).toBe("fintech");
  });

  it("passes through a sector value that already matches a form INDUSTRY", () => {
    expect(
      companyToPassportInitial({ ...empty, sector: "consumer_tech" }).industry,
    ).toBe("consumer_tech");
  });

  it("drops an unknown sector", () => {
    expect(
      companyToPassportInitial({ ...empty, sector: "vibes" }).industry,
    ).toBeUndefined();
  });

  it("maps Seed and Series A to the raising form stage", () => {
    expect(companyToPassportInitial({ ...empty, stage: "seed" }).stage).toBe(
      "raising",
    );
    expect(
      companyToPassportInitial({ ...empty, stage: "Series A" }).stage,
    ).toBe("raising");
  });

  it("drops an unknown stage", () => {
    expect(
      companyToPassportInitial({ ...empty, stage: "vibes-stage" }).stage,
    ).toBeUndefined();
  });

  it("derives businessSize from an employee bucket", () => {
    expect(
      companyToPassportInitial({ ...empty, employeeCount: "1" })
        .businessSize,
    ).toBe("solo");
    expect(
      companyToPassportInitial({ ...empty, employeeCount: "2-10" })
        .businessSize,
    ).toBe("small");
    expect(
      companyToPassportInitial({ ...empty, employeeCount: "11-50" })
        .businessSize,
    ).toBe("medium");
    expect(
      companyToPassportInitial({ ...empty, employeeCount: "51-200" })
        .businessSize,
    ).toBe("large");
  });

  it("returns undefined businessSize for unparseable buckets", () => {
    expect(
      companyToPassportInitial({ ...empty, employeeCount: "loads of folks" })
        .businessSize,
    ).toBeUndefined();
  });

  it("forwards a non-empty website verbatim", () => {
    expect(
      companyToPassportInitial({
        ...empty,
        website: "https://example.com",
      }).websiteUrl,
    ).toBe("https://example.com");
  });

  it("does not include keys for dropped fields", () => {
    const out = companyToPassportInitial({
      ...empty,
      county: "Mordor",
      sector: "vibes",
      stage: "vibes-stage",
    });
    expect(Object.keys(out)).toEqual([]);
  });
});
