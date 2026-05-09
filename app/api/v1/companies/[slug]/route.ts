import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, profileUpdates } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import {
  getApiSession,
  hasMachineToken,
  isAdminRole,
} from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// Owner-edit whitelist. Excludes (per brief): slug, linkedin,
// address_text, verified_at, claimed_at, claimed_by_user_id.
const OWNER_WHITELIST = new Set([
  "name",
  "website",
  "description",
  "sector",
  "stage",
  "employee_count",
  "hiring_status",
  "founding_year",
  "logo_url",
  "founder_team_json",
  "lat",
  "lng",
]);

// Translate snake_case wire keys → camelCase Drizzle columns.
const WIRE_TO_DB: Record<string, string> = {
  name: "name",
  website: "website",
  description: "description",
  sector: "sector",
  stage: "stage",
  employee_count: "employeeCount",
  hiring_status: "hiringStatus",
  founding_year: "foundingYear",
  logo_url: "logoUrl",
  founder_team_json: "founderTeamJson",
  lat: "lat",
  lng: "lng",
  // Admin / machine paths can also touch these:
  slug: "slug",
  linkedin: "linkedin",
  address_text: "addressText",
};

// Stub GET for Agent 4 to replace. Minimal company row + locations
// are out of scope here; just enough for /companies/[slug]/claim and
// /edit pages to read.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const [row] = await db()
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!row) return errorResponse("not_found", "Company not found.", 404);
  return NextResponse.json({ company: row });
}

// PATCH with three auth modes: owner edit (whitelist), admin edit
// (no whitelist), machine token (no whitelist). All successful PATCHes
// write a profile_updates row.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const [company] = await db()
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) return errorResponse("not_found", "Company not found.", 404);

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) return errorResponse("bad_request", "Body required.", 400);

  // Auth precedence: machine token → admin session → owner session.
  const machine = hasMachineToken(req);
  const session = machine ? null : await getApiSession(req);
  const isAdmin = !!session && isAdminRole(session.user.role);
  const isOwner =
    !!session &&
    !!company.claimedByUserId &&
    company.claimedByUserId === session.user.id;

  if (!machine && !isAdmin && !isOwner) {
    return errorResponse(
      "forbidden",
      "Sign in with the owner account, an admin role, or use X-Atlas-Admin-Token.",
      403,
    );
  }

  // Apply field filtering.
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (isOwner && !isAdmin && !machine && !OWNER_WHITELIST.has(k)) continue;
    const col = WIRE_TO_DB[k];
    if (!col) continue;
    patch[col] = v;
  }
  if (Object.keys(patch).length === 0) {
    return errorResponse(
      "bad_request",
      "No editable fields supplied.",
      400,
    );
  }

  const sourceClient = machine
    ? (req.headers.get("x-source-client") ?? "machine")
    : isAdmin && !isOwner
      ? "staff"
      : "owner";
  const editorUserId = session?.user.id ?? null;

  // Update + audit row.
  patch.lastUpdatedBy = editorUserId ?? "machine";
  patch.lastUpdatedAt = new Date();
  await db()
    .update(companies)
    .set(patch as never)
    .where(eq(companies.id, company.id));

  await db()
    .insert(profileUpdates)
    .values({
      companyId: company.id,
      submissionId: null,
      patchJson: JSON.stringify(body),
      reviewedByUserId: isAdmin ? editorUserId : null,
      sourceClient,
    });

  const [updated] = await db()
    .select()
    .from(companies)
    .where(eq(companies.id, company.id))
    .limit(1);
  return NextResponse.json({ company: updated });
}

// DELETE: admin-only.
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const machine = hasMachineToken(req);
  const session = machine ? null : await getApiSession(req);
  const isAdmin = !!session && isAdminRole(session.user.role);
  if (!machine && !isAdmin) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }
  const [company] = await db()
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) return errorResponse("not_found", "Company not found.", 404);
  await db().delete(companies).where(eq(companies.id, company.id));
  return new NextResponse(null, { status: 204 });
}
