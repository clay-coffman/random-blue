import { NextResponse } from "next/server";
import { or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { authorizeWrite, isAdminRole } from "@/lib/auth-utils";
import { escapeLikeWildcards } from "@/lib/sql";
import {
  replaceResourceAffinities,
  type ResourceAffinitiesPatch,
} from "@/lib/resource-affinities";

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

  // Escape `%` / `_` / `\` so user input matches literally — same
  // pattern as the search and companies routes.
  const term = q ? `%${escapeLikeWildcards(q)}%` : "";

  const rows = q
    ? await baseQuery
        .where(
          or(
            sql`${resources.title} LIKE ${term} ESCAPE '\\'`,
            sql`${resources.description} LIKE ${term} ESCAPE '\\'`,
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
  const auth = await authorizeWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const isAdmin = auth.kind === "session" && isAdminRole(auth.user.role);
  if (auth.kind !== "machine" && !isAdmin) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    title?: string;
    description?: string;
    source_url?: string;
    kind?: string;
    contact_email?: string;
    industries?: string[];
    communities?: string[];
    topics?: string[];
    counties?: string[];
    statewide?: boolean;
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
  // Affinity arrays / statewide are optional on create. Only invoke the
  // helper if at least one field was sent — otherwise a brand-new
  // resource just gets the scalar row, no join inserts.
  const affinityPatch: ResourceAffinitiesPatch = {};
  if (Array.isArray(body.industries)) affinityPatch.industries = body.industries;
  if (Array.isArray(body.communities))
    affinityPatch.communities = body.communities;
  if (Array.isArray(body.topics)) affinityPatch.topics = body.topics;
  if (Array.isArray(body.counties)) affinityPatch.counties = body.counties;
  if (typeof body.statewide === "boolean")
    affinityPatch.statewide = body.statewide;
  if (Object.keys(affinityPatch).length > 0) {
    await replaceResourceAffinities(body.id, affinityPatch);
  }
  return NextResponse.json({ id: body.id }, { status: 201 });
}
