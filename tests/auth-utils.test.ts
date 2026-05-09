import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the CF + Better Auth boundaries so the auth-utils helpers can
// run without the Cloudflare context. Test fixtures set these per case.
const sessionResult: { user: Record<string, unknown> | null } = { user: null };
const envResult: { ATLAS_ADMIN_TOKEN: string | undefined } = {
  ATLAS_ADMIN_TOKEN: undefined,
};

vi.mock("@/auth", () => ({
  getAuth: () => ({
    api: { getSession: async () => sessionResult },
  }),
}));

vi.mock("@/lib/cf", () => ({
  env: () => envResult,
}));

import {
  authorizeSessionWrite,
  authorizeWrite,
} from "@/lib/auth-utils";

const TEST_URL = "https://startup.utah.gov/api/v1/companies/foo";

function req(headers: Record<string, string> = {}): Request {
  return new Request(TEST_URL, { headers });
}

beforeEach(() => {
  sessionResult.user = null;
  envResult.ATLAS_ADMIN_TOKEN = undefined;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("authorizeWrite", () => {
  it("returns kind=session when same-origin session is present", async () => {
    sessionResult.user = {
      id: "u1",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    const r = await authorizeWrite(
      req({ "sec-fetch-site": "same-origin" }),
    );
    expect(r.kind).toBe("session");
    if (r.kind === "session") expect(r.user.id).toBe("u1");
  });

  it("returns denied(csrf) when session is present but request is cross-origin", async () => {
    sessionResult.user = {
      id: "u1",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    const r = await authorizeWrite(
      req({ "sec-fetch-site": "cross-site" }),
    );
    expect(r).toEqual({ kind: "denied", reason: "csrf" });
  });

  it("returns kind=machine when admin token matches and no session", async () => {
    envResult.ATLAS_ADMIN_TOKEN = "secret-token";
    const r = await authorizeWrite(req({ "x-atlas-admin-token": "secret-token" }));
    expect(r).toEqual({ kind: "machine" });
  });

  it("returns denied(unauth) when neither session nor token", async () => {
    const r = await authorizeWrite(req());
    expect(r).toEqual({ kind: "denied", reason: "unauth" });
  });

  it("rejects machine token when ATLAS_ADMIN_TOKEN is unset", async () => {
    envResult.ATLAS_ADMIN_TOKEN = undefined;
    const r = await authorizeWrite(req({ "x-atlas-admin-token": "anything" }));
    expect(r).toEqual({ kind: "denied", reason: "unauth" });
  });

  it("rejects machine token mismatch (constant-time comparison still rejects)", async () => {
    envResult.ATLAS_ADMIN_TOKEN = "secret-token";
    const r = await authorizeWrite(
      req({ "x-atlas-admin-token": "wrong-token" }),
    );
    expect(r).toEqual({ kind: "denied", reason: "unauth" });
  });

  it("session takes precedence over machine token (audit trail records the user)", async () => {
    sessionResult.user = {
      id: "u1",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    envResult.ATLAS_ADMIN_TOKEN = "secret-token";
    const r = await authorizeWrite(
      req({
        "sec-fetch-site": "same-origin",
        "x-atlas-admin-token": "secret-token",
      }),
    );
    expect(r.kind).toBe("session");
  });

  it("locks in session-first ordering: cross-origin session + valid machine token still denies as csrf", async () => {
    // Defends against a future refactor that swaps the auth order.
    // If machine-token check ran first, this would return kind=machine
    // and bypass the same-origin gate — bad.
    sessionResult.user = {
      id: "u1",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    envResult.ATLAS_ADMIN_TOKEN = "secret-token";
    const r = await authorizeWrite(
      req({
        "sec-fetch-site": "cross-site",
        "x-atlas-admin-token": "secret-token",
      }),
    );
    expect(r).toEqual({ kind: "denied", reason: "csrf" });
  });
});

describe("authorizeSessionWrite", () => {
  it("returns kind=session for same-origin session", async () => {
    sessionResult.user = {
      id: "u1",
      email: "a@b.com",
      name: "A",
      role: "goeo_admin",
    };
    const r = await authorizeSessionWrite(
      req({ "sec-fetch-site": "same-origin" }),
    );
    expect(r.kind).toBe("session");
    if (r.kind === "session") expect(r.user.role).toBe("goeo_admin");
  });

  it("returns denied(unauth) when no session", async () => {
    const r = await authorizeSessionWrite(req());
    expect(r).toEqual({ kind: "denied", reason: "unauth" });
  });

  it("returns denied(csrf) when session is cross-origin", async () => {
    sessionResult.user = {
      id: "u1",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    const r = await authorizeSessionWrite(
      req({ "sec-fetch-site": "cross-site" }),
    );
    expect(r).toEqual({ kind: "denied", reason: "csrf" });
  });

  it("ignores machine token (session-only routes don't accept it)", async () => {
    envResult.ATLAS_ADMIN_TOKEN = "secret-token";
    const r = await authorizeSessionWrite(
      req({ "x-atlas-admin-token": "secret-token" }),
    );
    expect(r).toEqual({ kind: "denied", reason: "unauth" });
  });
});
