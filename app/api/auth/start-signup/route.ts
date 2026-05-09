import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { getAuth } from "@/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { isSameOriginRequest } from "@/lib/csrf";
import { checkRateLimit, clientIpKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().transform((s) => s.toLowerCase()),
  role: z.enum(["founder", "owner", "investor"]),
});

// Better Auth's default user id is a 32-char alphanumeric string
// (createRandomStringGenerator a-zA-Z0-9). Match that shape so rows
// inserted here are indistinguishable from rows Better Auth creates
// internally for OAuth providers in the future.
const BETTER_AUTH_ID_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const newUserId = customAlphabet(BETTER_AUTH_ID_ALPHABET, 32);

// Mirrors auth.ts's customRules limit on /email-otp/send-verification-otp
// (3/min). Better Auth applies that to its own endpoint; this route lives
// outside Better Auth, so we replicate the limit here keyed on the same
// cf-connecting-ip header.
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX = 3;

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return errorResponse("forbidden", "Cross-origin request blocked.", 403);
  }

  const limit = await checkRateLimit({
    key: clientIpKey(req, "start-signup"),
    windowSeconds: RATE_WINDOW_SECONDS,
    max: RATE_MAX,
  });
  if (!limit.ok) {
    return new NextResponse(
      JSON.stringify({
        error: { code: "rate_limited", message: "Too many sign-up attempts. Try again shortly." },
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(limit.retryAfterSeconds),
        },
      },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid signup payload.",
      400,
      parsed.error.flatten(),
    );
  }
  const { name, email, role } = parsed.data;

  // Pre-create the user row so Better Auth's emailOTP plugin (which has
  // disableSignUp:true) will accept the subsequent sign-in OTP. The row
  // starts with emailVerified=false; the first successful signIn.emailOtp
  // — which proves OTP delivery to this address — flips it to true via
  // the databaseHooks.session.create hook in auth.ts. That keeps the
  // pre-creation pattern auditable: a row with emailVerified=false is
  // a pending signup that nobody has yet proven they own.
  try {
    await db().insert(userTable).values({
      id: newUserId(),
      name,
      email,
      emailVerified: false,
      role,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return errorResponse(
        "email_taken",
        "An account with that email already exists. Log in instead.",
        409,
      );
    }
    throw err;
  }

  const auth = await getAuth();
  await auth.api.sendVerificationOTP({
    body: { email, type: "sign-in" },
    headers: req.headers,
  });

  return NextResponse.json({ status: "sent" });
}

// D1 surfaces UNIQUE failures with SQLite's stock message, but
// Drizzle wraps the D1 error inside a top-level "Failed query: …"
// Error whose `.cause` (and sometimes `.cause.cause`) carries the
// UNIQUE-constraint string. Walk the cause chain so we recognise
// the violation regardless of how many wrappers it picks up.
function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth++) {
    const message = current instanceof Error ? current.message : String(current);
    if (/UNIQUE constraint failed/i.test(message)) return true;
    current = current instanceof Error ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}
