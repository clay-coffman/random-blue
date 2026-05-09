import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { authorizeSessionWrite, isSuperadmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const FlippableRole = z.enum(["owner", "goeo_admin", "founder", "investor"]);
const PatchRequest = z.object({ role: FlippableRole });

// PATCH /api/v1/admin/users/:id — superadmin role flip.
// Defense-in-depth: middleware lets the user past /admin if they
// have an admin cookie; this handler re-checks for superadmin.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const session = { user: auth.user };
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
  const parsed = PatchRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      `role must be one of ${FlippableRole.options.join(", ")}.`,
      400,
    );
  }

  // Don't let a superadmin demote another superadmin from the UI. The
  // bootstrap script is the only way to mint or remove superadmins —
  // keeps the UI from being an emergency-lockout vector.
  const [target] = await db()
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, id))
    .limit(1);
  if (!target) return errorResponse("not_found", "User not found.", 404);
  if (target.role === "superadmin") {
    return errorResponse(
      "conflict",
      "Superadmin role can only be changed via the bootstrap script.",
      409,
    );
  }

  await db()
    .update(userTable)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(userTable.id, id));
  return NextResponse.json({ id, role: parsed.data.role });
}
