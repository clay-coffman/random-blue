import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/csrf";

function req(
  url: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(url, { headers });
}

describe("isSameOriginRequest", () => {
  const TEST_URL = "https://startup.utah.gov/api/v1/companies/foo";

  it("accepts Sec-Fetch-Site=same-origin (page-script POST)", () => {
    expect(isSameOriginRequest(req(TEST_URL, { "sec-fetch-site": "same-origin" })))
      .toBe(true);
  });

  it("rejects Sec-Fetch-Site=cross-site (forged form POST from attacker)", () => {
    expect(isSameOriginRequest(req(TEST_URL, { "sec-fetch-site": "cross-site" })))
      .toBe(false);
  });

  it("rejects Sec-Fetch-Site=same-site (subdomain POST — outside our model)", () => {
    expect(isSameOriginRequest(req(TEST_URL, { "sec-fetch-site": "same-site" })))
      .toBe(false);
  });

  it("rejects Sec-Fetch-Site=none on POST (real browsers only emit this on top-level GETs)", () => {
    expect(isSameOriginRequest(req(TEST_URL, { "sec-fetch-site": "none" })))
      .toBe(false);
  });

  it("falls back to Origin match when Sec-Fetch-Site is absent", () => {
    expect(
      isSameOriginRequest(
        req(TEST_URL, { origin: "https://startup.utah.gov" }),
      ),
    ).toBe(true);
  });

  it("rejects mismatched Origin under the fallback path", () => {
    expect(
      isSameOriginRequest(
        req(TEST_URL, { origin: "https://evil.example" }),
      ),
    ).toBe(false);
  });

  it("rejects bare requests with no Origin and no Sec-Fetch-Site (server-to-server callers should use the admin token)", () => {
    expect(isSameOriginRequest(req(TEST_URL))).toBe(false);
  });

  it("rejects malformed Origin", () => {
    expect(isSameOriginRequest(req(TEST_URL, { origin: "not-a-url" })))
      .toBe(false);
  });
});
