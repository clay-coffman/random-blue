import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminInvites } from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { authorizeSessionWrite } from "@/lib/auth-utils";
import { sha256Hex } from "@/lib/hash";

export const dynamic = "force-dynamic";

// POST — consume the invite. Caller must be signed in with the
// invited email; flips role to goeo_admin and marks the invite
// consumed. One-shot.
//
// POST (not GET) so that Slack/Gmail/Outlook unfurlers + image-preview
// crawlers + browser prefetchers can't trigger a state change just
// because the URL was mentioned somewhere.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in to accept.", 401);
  }
  const session = { user: auth.user };
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
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
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
