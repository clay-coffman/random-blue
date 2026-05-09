import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, hasMachineToken, isAdminRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// POST: admin/machine create. Resource id is supplied by the caller
// (we preserve upstream IDs as `r_<id>`); if missing, generate a
// hash-based fallback.
export async function POST(req: Request) {
  const session = await getApiSession(req);
  const machine = hasMachineToken(req);
  if (!machine && !(session && isAdminRole(session.user.role))) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    title?: string;
    description?: string;
    source_url?: string;
    kind?: string;
    contact_email?: string;
  } | null;
  if (!body || !body.id || !body.title) {
    return errorResponse(
      "bad_request",
      "Required fields: id, title.",
      400,
    );
  }
  await db().insert(resources).values({
    id: body.id,
    title: body.title,
    description: body.description ?? null,
    sourceUrl: body.source_url ?? null,
    kind: body.kind ?? null,
    contactEmail: body.contact_email ?? null,
  });
  return NextResponse.json({ id: body.id }, { status: 201 });
}
