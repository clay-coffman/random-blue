import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import middleware from "@/middleware";

const ORIGIN = "https://startup.utah.gov";

function build(
  path: string,
  opts: { cookie?: string; proto?: "http" | "https" } = {},
): NextRequest {
  const headers = new Headers();
  if (opts.cookie) headers.set("cookie", opts.cookie);
  if (opts.proto) headers.set("x-forwarded-proto", opts.proto);
  // NextRequest in node needs an absolute URL; the host doesn't
  // matter for this test, only the pathname/search.
  return new NextRequest(new URL(path, ORIGIN), { headers });
}

describe("middleware session cookie detection", () => {
  it("passes through when the dev-prefixed cookie is present (http)", () => {
    const res = middleware(
      build("/settings", {
        cookie: "atlas.session_token=abc",
        proto: "http",
      }),
    );
    // NextResponse.next() returns 200 with no Location header.
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("passes through when the prod-prefixed cookie is present (https)", () => {
    const res = middleware(
      build("/settings", {
        cookie: "__Host-atlas.session_token=abc",
        proto: "https",
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects to /sign-in when no cookie is present", () => {
    const res = middleware(build("/settings", { proto: "http" }));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    const target = new URL(location!);
    expect(target.pathname).toBe("/sign-in");
    expect(target.searchParams.get("next")).toBe("/settings");
  });

  it("redirects when only the better-auth default cookie name is set — locks in the prefix fix from #49", () => {
    const res = middleware(
      build("/settings", {
        cookie: "better-auth.session_token=abc",
        proto: "http",
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/sign-in");
  });
});
