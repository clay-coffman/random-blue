import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the CF + Better Auth boundaries so the route handlers can run
// without the Cloudflare context. Per-case fixtures override these.
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
  IntroRequestCreateSchema,
  IntroRequestPatchSchema,
} from "@/schemas/intro-request";

beforeEach(() => {
  sessionResult.user = null;
  envResult.ATLAS_ADMIN_TOKEN = undefined;
});

afterEach(() => {
  vi.clearAllMocks();
});

const TEST_URL = "https://startup.utah.gov/api/v1/intro-requests";

function req(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(TEST_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// ─── Schema validation ─────────────────────────────────────────────

describe("IntroRequestCreateSchema", () => {
  it("accepts a valid investor-targeted request", () => {
    const r = IntroRequestCreateSchema.safeParse({
      target: { type: "investor", id: "inv_abc123def456ghij" },
      message_text: "Hi — I'm building an X for Utah founders.",
    });
    expect(r.success).toBe(true);
  });

  it("accepts a valid company-targeted request", () => {
    const r = IntroRequestCreateSchema.safeParse({
      target: { type: "company", id: "co_abc123def456ghij" },
      message_text: "Hi — I'd love to chat about your roadmap and possible angle.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects message shorter than 20 chars", () => {
    const r = IntroRequestCreateSchema.safeParse({
      target: { type: "investor", id: "inv_abc" },
      message_text: "too short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects message longer than 2000 chars", () => {
    const r = IntroRequestCreateSchema.safeParse({
      target: { type: "investor", id: "inv_abc123def456ghij" },
      message_text: "x".repeat(2001),
    });
    expect(r.success).toBe(false);
  });

  it("rejects an investor target with a co_ id", () => {
    const r = IntroRequestCreateSchema.safeParse({
      target: { type: "investor", id: "co_wrong-prefix" },
      message_text: "Twenty characters at least.",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a company target with an inv_ id", () => {
    const r = IntroRequestCreateSchema.safeParse({
      target: { type: "company", id: "inv_wrong-prefix" },
      message_text: "Twenty characters at least.",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown target.type", () => {
    const r = IntroRequestCreateSchema.safeParse({
      target: { type: "user", id: "u_abc" },
      message_text: "Twenty characters at least.",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a missing target", () => {
    const r = IntroRequestCreateSchema.safeParse({
      message_text: "Twenty characters at least.",
    });
    expect(r.success).toBe(false);
  });
});

describe("IntroRequestPatchSchema", () => {
  it("accepts accepted/declined/introduced", () => {
    for (const status of ["accepted", "declined", "introduced"] as const) {
      const r = IntroRequestPatchSchema.safeParse({ status });
      expect(r.success).toBe(true);
    }
  });

  it("accepts an optional admin_notes", () => {
    const r = IntroRequestPatchSchema.safeParse({
      status: "accepted",
      admin_notes: "Connected — both teams fit.",
    });
    expect(r.success).toBe(true);
  });

  it("accepts admin_notes: null", () => {
    const r = IntroRequestPatchSchema.safeParse({
      status: "declined",
      admin_notes: null,
    });
    expect(r.success).toBe(true);
  });

  it("rejects status=pending (admin can't write back to pending)", () => {
    const r = IntroRequestPatchSchema.safeParse({ status: "pending" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const r = IntroRequestPatchSchema.safeParse({ status: "withdrawn" });
    expect(r.success).toBe(false);
  });

  it("rejects admin_notes longer than 2000 chars", () => {
    const r = IntroRequestPatchSchema.safeParse({
      status: "accepted",
      admin_notes: "x".repeat(2001),
    });
    expect(r.success).toBe(false);
  });
});

// ─── Auth gate (route-level, via the shared helper) ────────────────
//
// The actual route handlers compose `authorizeSessionWrite` (already
// covered in detail in tests/auth-utils.test.ts) and the schemas above.
// Spot-check the wiring by exercising the handler's auth-denial paths,
// where DB is never reached.

import { POST as createIntroRequest } from "@/app/api/v1/intro-requests/route";

describe("POST /api/v1/intro-requests — auth gate", () => {
  it("returns 401 for an unauthenticated caller", async () => {
    const res = await createIntroRequest(req({ ignored: true }));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("unauthorized");
  });

  it("returns 403 (csrf) for a cross-origin session", async () => {
    sessionResult.user = {
      id: "u_a",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    const res = await createIntroRequest(
      req(
        {
          target: { type: "investor", id: "inv_aaa111bbb222ccc3" },
          message_text: "Twenty characters at least to be valid here.",
        },
        { "sec-fetch-site": "cross-site" },
      ),
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });

  it("rejects an invalid body before DB lookup (schema gate runs after auth gate)", async () => {
    sessionResult.user = {
      id: "u_a",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    const res = await createIntroRequest(
      req(
        { message_text: "x" },
        { "sec-fetch-site": "same-origin" },
      ),
    );
    // Auth passed (would otherwise be 401/403), schema rejects with 400.
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
  });
});

// ─── PATCH auth gate ───────────────────────────────────────────────

import { PATCH as patchIntroRequest } from "@/app/api/v1/intro-requests/[id]/route";

const FAKE_INTRO_ID = "irq_abc123def456ghij";

function patchReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${TEST_URL}/${FAKE_INTRO_ID}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v1/intro-requests/[id] — auth gate", () => {
  it("returns 401 for an unauthenticated caller", async () => {
    const res = await patchIntroRequest(patchReq({ status: "accepted" }), {
      params: Promise.resolve({ id: FAKE_INTRO_ID }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin session", async () => {
    sessionResult.user = {
      id: "u_a",
      email: "a@b.com",
      name: "A",
      role: "founder",
    };
    const res = await patchIntroRequest(
      patchReq(
        { status: "accepted" },
        { "sec-fetch-site": "same-origin" },
      ),
      { params: Promise.resolve({ id: FAKE_INTRO_ID }) },
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });

  it("returns 403 (csrf) for a cross-origin admin session", async () => {
    sessionResult.user = {
      id: "u_admin",
      email: "admin@goeo.utah.gov",
      name: "Admin",
      role: "goeo_admin",
    };
    const res = await patchIntroRequest(
      patchReq(
        { status: "accepted" },
        { "sec-fetch-site": "cross-site" },
      ),
      { params: Promise.resolve({ id: FAKE_INTRO_ID }) },
    );
    expect(res.status).toBe(403);
  });
});
