import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the boundaries so the route handler runs without Cloudflare
// or D1. Each case overrides the per-test fixtures defined below.

let insertImpl: () => Promise<unknown> = async () => undefined;
let sendOtpCalls: Array<{ email: string; type: string }> = [];
let rateLimitResult:
  | { ok: true }
  | { ok: false; retryAfterSeconds: number } = { ok: true };

vi.mock("@/lib/db", () => ({
  db: () => ({
    insert: () => ({
      values: () => insertImpl(),
    }),
  }),
}));

vi.mock("@/auth", () => ({
  getAuth: async () => ({
    api: {
      sendVerificationOTP: async ({
        body,
      }: {
        body: { email: string; type: string };
      }) => {
        sendOtpCalls.push(body);
        return { success: true };
      },
    },
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => rateLimitResult,
  clientIpKey: (_req: Request, route: string) => `${route}:test-ip`,
}));

import { POST } from "@/app/api/auth/start-signup/route";

const TEST_URL = "https://startup.utah.gov/api/auth/start-signup";

function req(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request(TEST_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  insertImpl = async () => undefined;
  sendOtpCalls = [];
  rateLimitResult = { ok: true };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/start-signup", () => {
  it("rejects cross-origin requests with 403", async () => {
    const r = await POST(
      req(
        { name: "Alice", email: "alice@test.example", role: "founder" },
        { "sec-fetch-site": "cross-site" },
      ),
    );
    expect(r.status).toBe(403);
    const body = (await r.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
    expect(sendOtpCalls).toHaveLength(0);
  });

  it("rejects malformed payload with 400", async () => {
    const r = await POST(
      req({ name: "x", email: "not-an-email", role: "wrong" }),
    );
    expect(r.status).toBe(400);
    const body = (await r.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
    expect(sendOtpCalls).toHaveLength(0);
  });

  it("rejects role outside the self-serve enum with 400", async () => {
    const r = await POST(
      req({
        name: "Alice",
        email: "alice@test.example",
        role: "goeo_admin",
      }),
    );
    expect(r.status).toBe(400);
    expect(sendOtpCalls).toHaveLength(0);
  });

  it("returns 409 email_taken when the insert hits a UNIQUE violation (Drizzle-wrapped)", async () => {
    // Mirror the real D1 error shape: Drizzle wraps a "Failed query: …"
    // outer Error whose `.cause` carries the UNIQUE-constraint string.
    insertImpl = async () => {
      const inner = new Error(
        "D1_ERROR: UNIQUE constraint failed: user.email: SQLITE_CONSTRAINT",
      );
      const outer = new Error("Failed query: insert into …");
      (outer as { cause?: unknown }).cause = inner;
      throw outer;
    };
    const r = await POST(
      req({
        name: "Alice",
        email: "taken@test.example",
        role: "founder",
      }),
    );
    expect(r.status).toBe(409);
    const body = (await r.json()) as { error: { code: string } };
    expect(body.error.code).toBe("email_taken");
    // OTP must NOT be sent when the user creation failed.
    expect(sendOtpCalls).toHaveLength(0);
  });

  it("returns 429 with retry-after when the IP is rate-limited", async () => {
    rateLimitResult = { ok: false, retryAfterSeconds: 42 };
    const r = await POST(
      req({
        name: "Alice",
        email: "alice@test.example",
        role: "founder",
      }),
    );
    expect(r.status).toBe(429);
    expect(r.headers.get("retry-after")).toBe("42");
    expect(sendOtpCalls).toHaveLength(0);
  });

  it("creates the user and sends a sign-in OTP on success", async () => {
    let inserted = false;
    insertImpl = async () => {
      inserted = true;
    };
    const r = await POST(
      req({
        name: "Alice Newuser",
        email: "Alice@Test.Example",
        role: "investor",
      }),
    );
    expect(r.status).toBe(200);
    const body = (await r.json()) as { status: string };
    expect(body).toEqual({ status: "sent" });
    expect(inserted).toBe(true);
    expect(sendOtpCalls).toEqual([
      { email: "alice@test.example", type: "sign-in" },
    ]);
  });
});
