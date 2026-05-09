import { describe, expect, it } from "vitest";
import {
  formatClaim,
  formatPassport,
  formatUpdate,
  mergeEvents,
  type ActivityEvent,
} from "@/lib/activity";

describe("Drizzle timestamp_ms coercion", () => {
  it("treats Date and number timestamps the same", () => {
    const epoch = Date.UTC(2026, 4, 8);
    const fromDate = formatClaim({
      reviewedAt: new Date(epoch),
      companyName: "Acme",
      companySector: null,
    });
    const fromNumber = formatClaim({
      reviewedAt: epoch,
      companyName: "Acme",
      companySector: null,
    });
    expect(fromDate?.ts).toBe(epoch);
    expect(fromNumber?.ts).toBe(epoch);
  });
});

describe("formatClaim", () => {
  it("renders company name + sector", () => {
    expect(
      formatClaim({
        reviewedAt: 100,
        companyName: "Crew",
        companySector: "FinTech",
      }),
    ).toEqual({
      kind: "claim",
      text: "Crew (FinTech) just claimed their profile",
      ts: 100,
    });
  });

  it("omits sector parens when sector is null", () => {
    const e = formatClaim({
      reviewedAt: 100,
      companyName: "Acme",
      companySector: null,
    });
    expect(e?.text).toBe("Acme just claimed their profile");
  });

  it("returns null when reviewedAt missing", () => {
    expect(
      formatClaim({
        reviewedAt: null,
        companyName: "Acme",
        companySector: null,
      }),
    ).toBeNull();
  });

  it("returns null when companyName missing", () => {
    expect(
      formatClaim({ reviewedAt: 100, companyName: null, companySector: null }),
    ).toBeNull();
  });
});

describe("formatPassport", () => {
  it("renders county + industry — never user identity", () => {
    expect(
      formatPassport({
        createdAt: 200,
        county: "Salt Lake",
        city: "Salt Lake City",
        industry: "Software and Information Technology",
      }),
    ).toEqual({
      kind: "passport",
      text: "New founder in Salt Lake working on Software and Information Technology",
      ts: 200,
    });
  });

  it("renders just county when industry is missing", () => {
    expect(
      formatPassport({
        createdAt: 200,
        county: "Washington",
        city: null,
        industry: null,
      })?.text,
    ).toBe("New founder in Washington");
  });

  it("returns null when both county and industry are missing — nothing meaningful to say", () => {
    expect(
      formatPassport({
        createdAt: 200,
        county: null,
        city: null,
        industry: null,
      }),
    ).toBeNull();
  });

  it("returns null when createdAt missing", () => {
    expect(
      formatPassport({
        createdAt: null,
        county: "Salt Lake",
        city: null,
        industry: "Tech",
      }),
    ).toBeNull();
  });
});

describe("formatUpdate", () => {
  it("renders sourceClient as natural label", () => {
    expect(
      formatUpdate({
        appliedAt: 300,
        companyName: "Crew",
        sourceClient: "claude.ai",
      })?.text,
    ).toBe("Crew updated their profile via Claude");
    expect(
      formatUpdate({
        appliedAt: 300,
        companyName: "Crew",
        sourceClient: "chatgpt.com",
      })?.text,
    ).toBe("Crew updated their profile via ChatGPT");
    expect(
      formatUpdate({
        appliedAt: 300,
        companyName: "Crew",
        sourceClient: "machine",
      })?.text,
    ).toBe("Crew updated their profile via API");
  });

  it("drops the via-suffix for owner / staff edits", () => {
    expect(
      formatUpdate({
        appliedAt: 300,
        companyName: "Crew",
        sourceClient: "owner",
      })?.text,
    ).toBe("Crew updated their profile");
    expect(
      formatUpdate({
        appliedAt: 300,
        companyName: "Crew",
        sourceClient: "staff",
      })?.text,
    ).toBe("Crew updated their profile");
    expect(
      formatUpdate({
        appliedAt: 300,
        companyName: "Crew",
        sourceClient: null,
      })?.text,
    ).toBe("Crew updated their profile");
  });

  it("returns null when companyName or appliedAt missing", () => {
    expect(
      formatUpdate({
        appliedAt: null,
        companyName: "Crew",
        sourceClient: null,
      }),
    ).toBeNull();
    expect(
      formatUpdate({
        appliedAt: 300,
        companyName: null,
        sourceClient: null,
      }),
    ).toBeNull();
  });
});

describe("mergeEvents", () => {
  const e = (kind: ActivityEvent["kind"], ts: number): ActivityEvent => ({
    kind,
    text: `${kind}@${ts}`,
    ts,
  });

  it("merges + sorts DESC + truncates", () => {
    const result = mergeEvents(
      [
        [e("claim", 5), e("claim", 1)],
        [e("passport", 4), e("passport", 2)],
        [e("update", 3)],
      ],
      4,
    );
    expect(result.map((r) => r.ts)).toEqual([5, 4, 3, 2]);
  });

  it("returns empty array when no events", () => {
    expect(mergeEvents([], 6)).toEqual([]);
    expect(mergeEvents([[], [], []], 6)).toEqual([]);
  });

  it("handles limit larger than total", () => {
    const result = mergeEvents([[e("claim", 1)]], 10);
    expect(result).toHaveLength(1);
  });
});
