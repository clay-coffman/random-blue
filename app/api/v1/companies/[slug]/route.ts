import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, profileUpdates } from "@/db/schema";
import { ApiError, errorResponse } from "@/lib/api-error";
import { getCompanyCard, toWireCompanyCard } from "@/lib/company-card";
import {
  getApiSession,
  hasMachineToken,
  isAdminRole,
} from "@/lib/auth-utils";

// Mixed-runtime file: GET (Agent 4) reads via Drizzle; PATCH/DELETE
// (Agent 5) call Better Auth which needs Node APIs, so we keep the
// default Node runtime here rather than `runtime = "edge"`.
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

// GET — full company agent card (Agent 4). Same shape as
// `/startups/{slug}/route.json`. Used by /startups/{slug} (server),
// `lib/company-card.ts` consumers, and CLI/MCP tooling.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const card = await getCompanyCard(slug);
    if (!card) {
      throw new ApiError({
        code: "company_not_found",
        message: `No company with slug ${slug}`,
        status: 404,
      });
    }
    return NextResponse.json(toWireCompanyCard(card));
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("companies/[slug] GET error", err);
    return errorResponse("internal_error", "Failed to load company", 500);
  }
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

  // Auth precedence: session (admin or owner) wins over the machine
  // token if both are present, so an admin's user id is preserved in
  // the audit row instead of being recorded as 'machine'.
  const session = await getApiSession(req);
  const isAdmin = !!session && isAdminRole(session.user.role);
  const isOwner =
    !!session &&
    !!company.claimedByUserId &&
    company.claimedByUserId === session.user.id;
  const machine = !session && hasMachineToken(req);

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
