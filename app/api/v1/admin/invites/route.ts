import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminInvites } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, isSuperadmin } from "@/lib/auth-utils";
import { newId } from "@/lib/ids";
import { sendAdminInviteEmail } from "@/lib/email";
import { env } from "@/lib/cf";

export const dynamic = "force-dynamic";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  // 32 random bytes → base32-like string. Crypto.randomUUID() also fine
  // but uuid syntax leaks structure. Use base64url of random bytes.
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 48);
}

export async function POST(req: Request) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);
  if (!isSuperadmin(session.user.role)) {
    return errorResponse("forbidden", "Superadmin only.", 403);
  }
  const body = (await req.json().catch(() => null)) as {
    email?: string;
  } | null;
  if (!body || !body.email) {
    return errorResponse("bad_request", "email is required.", 400);
  }

  const id = newId("aiv");
  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await db().insert(adminInvites).values({
    id,
    email: body.email,
    role: "goeo_admin",
    tokenHash,
    invitedByUserId: session.user.id,
    expiresAt,
  });

  const baseUrl =
    env().BETTER_AUTH_URL ?? new URL(req.url).origin;
  const link = `${baseUrl}/admin/invite/${token}`;
  await sendAdminInviteEmail(body.email, link);

  return NextResponse.json(
    { id, email: body.email, expires_at: expiresAt },
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
