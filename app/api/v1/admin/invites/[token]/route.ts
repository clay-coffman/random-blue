import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminInvites } from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { getApiSession } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// GET — consume the invite. Caller must be signed in with the
// invited email; flips role to goeo_admin and marks the invite
// consumed. One-shot.
export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in to accept.", 401);
  const { token } = await ctx.params;
  const tokenHash = await sha256Hex(token);
  const [invite] = await db()
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.tokenHash, tokenHash))
    .limit(1);
  if (!invite) return errorResponse("not_found", "Invite invalid.", 404);
  if (invite.consumedAt) {
    return errorResponse("conflict", "Invite already used.", 409);
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return errorResponse("gone", "Invite expired.", 410);
  }
  if (
    invite.email.toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return errorResponse(
      "forbidden",
      `Invite is for ${invite.email}. Sign in with that account.`,
      403,
    );
  }

  await db()
    .update(userTable)
    .set({ role: invite.role, updatedAt: new Date() })
    .where(eq(userTable.id, session.user.id));
  await db()
    .update(adminInvites)
    .set({ consumedAt: new Date() })
    .where(eq(adminInvites.id, invite.id));

  return NextResponse.json({ status: "accepted", role: invite.role });
}
