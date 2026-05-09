import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { authorizeWrite, isAdminRole } from "@/lib/auth-utils";
import {
  loadResourceAffinities,
  replaceResourceAffinities,
  type ResourceAffinitiesPatch,
} from "@/lib/resource-affinities";

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
  const affinities = await loadResourceAffinities(id);
  return NextResponse.json({
    resource: {
      ...row,
      industries: affinities.industries,
      communities: affinities.communities,
      topics: affinities.topics,
      counties: affinities.counties,
      statewide: affinities.statewide,
    },
  });
}

async function adminOnly(req: Request) {
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
  return null;
}

// Pull only the affinity-shaped keys out of a freeform body. Each key is
// optional — a save touching only `title` should not nuke topics. Returns
// the trimmed patch (no normalization yet; the affinity helper handles it)
// plus a flag indicating whether any join-table replacement is requested.
function extractAffinityPatch(body: Record<string, unknown>): {
  patch: ResourceAffinitiesPatch;
  hasAny: boolean;
} {
  const patch: ResourceAffinitiesPatch = {};
  let hasAny = false;
  if (Array.isArray(body.industries)) {
    patch.industries = body.industries as string[];
    hasAny = true;
  }
  if (Array.isArray(body.communities)) {
    patch.communities = body.communities as string[];
    hasAny = true;
  }
  if (Array.isArray(body.topics)) {
    patch.topics = body.topics as string[];
    hasAny = true;
  }
  if (Array.isArray(body.counties)) {
    patch.counties = body.counties as string[];
    hasAny = true;
  }
  if (typeof body.statewide === "boolean") {
    patch.statewide = body.statewide;
    hasAny = true;
  }
  return { patch, hasAny };
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
  const { patch: affinityPatch, hasAny: hasAffinity } =
    extractAffinityPatch(body);

  if (Object.keys(patch).length === 0 && !hasAffinity) {
    return errorResponse("bad_request", "No editable fields supplied.", 400);
  }
  patch.lastUpdatedAt = new Date();
  await db().update(resources).set(patch as never).where(eq(resources.id, id));
  if (hasAffinity) {
    await replaceResourceAffinities(id, affinityPatch);
  }
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
