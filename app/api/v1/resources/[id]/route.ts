import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, hasMachineToken, isAdminRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const FIELDS: Record<string, string> = {
  title: "title",
  description: "description",
  source_url: "sourceUrl",
  kind: "kind",
  contact_email: "contactEmail",
};

// GET: public read. Used by CLI/MCP `get_resource` and the founder UI
// when linking out from a recommendation card.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [row] = await db()
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      kind: resources.kind,
      source_url: resources.sourceUrl,
      contact_email: resources.contactEmail,
    })
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);
  if (!row) return errorResponse("not_found", "Resource not found.", 404);
  return NextResponse.json({ resource: row });
}

async function adminOnly(req: Request) {
  const session = await getApiSession(req);
  const machine = hasMachineToken(req);
  if (!machine && !(session && isAdminRole(session.user.role))) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }
  return null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) return errorResponse("bad_request", "Body required.", 400);

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    const col = FIELDS[k];
    if (col) patch[col] = v;
  }
  if (Object.keys(patch).length === 0) {
    return errorResponse("bad_request", "No editable fields supplied.", 400);
  }
  patch.lastUpdatedAt = new Date();
  await db().update(resources).set(patch as never).where(eq(resources.id, id));
  return NextResponse.json({ id });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  await db().delete(resources).where(eq(resources.id, id));
  return new NextResponse(null, { status: 204 });
}
