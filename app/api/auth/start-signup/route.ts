import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { getAuth } from "@/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { isSameOriginRequest } from "@/lib/csrf";

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

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return errorResponse("forbidden", "Cross-origin request blocked.", 403);
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

  const [existing] = await db()
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  if (existing) {
    return errorResponse(
      "email_taken",
      "An account with that email already exists. Log in instead.",
      409,
    );
  }

  // emailVerified=true: the OTP that gates the next step (signIn.emailOtp)
  // is itself proof of email control, so we don't need a separate
  // "verify your email" state on the user row.
  await db().insert(userTable).values({
    id: newUserId(),
    name,
    email,
    emailVerified: true,
    role,
  });

  const auth = await getAuth();
  await auth.api.sendVerificationOTP({
    body: { email, type: "sign-in" },
    headers: req.headers,
  });

  return NextResponse.json({ status: "sent" });
}
