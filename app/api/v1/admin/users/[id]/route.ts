import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, isSuperadmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const FLIPPABLE = new Set(["owner", "goeo_admin", "founder", "investor"]);

// PATCH /api/v1/admin/users/:id — superadmin role flip.
// Defense-in-depth: middleware lets the user past /admin if they
// have an admin cookie; this handler re-checks for superadmin.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);
  if (!isSuperadmin(session.user.role)) {
    return errorResponse(
      "forbidden",
      "Superadmin role required to change user roles.",
      403,
    );
  }
  if (id === session.user.id) {
    return errorResponse(
      "conflict",
      "You can't change your own role from the UI. Use the bootstrap script.",
      409,
    );
  }
  const body = (await req.json().catch(() => null)) as {
    role?: string;
  } | null;
  if (!body || !body.role || !FLIPPABLE.has(body.role)) {
    return errorResponse(
      "bad_request",
      `role must be one of ${[...FLIPPABLE].join(", ")}.`,
      400,
    );
  }

  await db()
    .update(userTable)
    .set({ role: body.role, updatedAt: new Date() })
    .where(eq(userTable.id, id));
  return NextResponse.json({ id, role: body.role });
}
