import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminInvites } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, isSuperadmin } from "@/lib/auth-utils";
import { newId } from "@/lib/ids";
import { sendAdminInviteEmail } from "@/lib/email";
import { env } from "@/lib/cf";
import { sha256Hex } from "@/lib/hash";

const InviteRequest = z.object({
  email: z.string().email(),
});

export const dynamic = "force-dynamic";

// 32 random bytes → 64-char lowercase hex. Uniform distribution, no
// truncation, no UUID structure leak.
function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);
  if (!isSuperadmin(session.user.role)) {
    return errorResponse("forbidden", "Superadmin only.", 403);
  }
  const parsed = InviteRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Valid email required.",
      400,
      parsed.error.flatten(),
    );
  }
  const { email } = parsed.data;

  const id = newId("aiv");
  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await db().insert(adminInvites).values({
    id,
    email,
    role: "goeo_admin",
    tokenHash,
    invitedByUserId: session.user.id,
    expiresAt,
  });

  const baseUrl = env().BETTER_AUTH_URL ?? new URL(req.url).origin;
  // Invite redemption lives at /invite/[token] — outside /admin/* so
  // the layout's role gate doesn't bounce the (still non-admin) invitee.
  const link = `${baseUrl}/invite/${token}`;
  await sendAdminInviteEmail(email, link);

  return NextResponse.json(
    { id, email, expires_at: expiresAt },
    { status: 201 },
  );
}

export async function GET(req: Request) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);
  if (!isSuperadmin(session.user.role)) {
    return errorResponse("forbidden", "Superadmin only.", 403);
  }
  const rows = await db()
    .select({
      id: adminInvites.id,
      email: adminInvites.email,
      role: adminInvites.role,
      createdAt: adminInvites.createdAt,
      expiresAt: adminInvites.expiresAt,
      consumedAt: adminInvites.consumedAt,
    })
    .from(adminInvites)
    .orderBy(desc(adminInvites.createdAt));
  return NextResponse.json({ invites: rows });
}
