import { NextResponse } from "next/server";
import { like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, hasMachineToken, isAdminRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// GET: public list of resources, optionally filtered by free-text. Used
// by /agents-side clients (CLI `map`/`recommend`, MCP `search_resources`).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    100,
    Number(url.searchParams.get("limit") ?? "50") || 50,
  );

  const baseQuery = db()
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      kind: resources.kind,
      source_url: resources.sourceUrl,
      contact_email: resources.contactEmail,
    })
    .from(resources);

  const rows = q
    ? await baseQuery
        .where(
          or(
            like(resources.title, `%${q}%`),
            like(resources.description, `%${q}%`),
          ),
        )
        .limit(limit)
    : await baseQuery.limit(limit);

  return NextResponse.json({ resources: rows });
}

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
