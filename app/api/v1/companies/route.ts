import { NextResponse } from "next/server";
import { eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, businessOwnershipSubmissions } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import {
  getApiSession,
  hasMachineToken,
  isAdminRole,
} from "@/lib/auth-utils";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

// Stub GET for /onboarding/owner search until Agent 4 ships the
// proper list endpoint with sector/stage filters. Status is computed
// from claimed_by_user_id + presence of a pending submission row.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    50,
    Number(url.searchParams.get("limit") ?? "20") || 20,
  );

  const baseQuery = db()
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      website: companies.website,
      sector: companies.sector,
      stage: companies.stage,
      employee_count: companies.employeeCount,
      claimed_by_user_id: companies.claimedByUserId,
    })
    .from(companies);

  const rows = q
    ? await baseQuery
        .where(
          or(
            like(companies.name, `%${q}%`),
            like(companies.slug, `%${q}%`),
            like(companies.website, `%${q}%`),
          ),
        )
        .limit(limit)
    : await baseQuery.limit(limit);

  // Find any pending submissions for these companies in one query.
  const ids = rows.map((r) => r.id);
  let pendingByCompany = new Set<string>();
  if (ids.length > 0) {
    const pendings = await db()
      .select({ companyId: businessOwnershipSubmissions.companyId })
      .from(businessOwnershipSubmissions)
      .where(
        sql`${businessOwnershipSubmissions.companyId} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `,
        )}) AND ${businessOwnershipSubmissions.status} = 'pending'`,
      );
    pendingByCompany = new Set(pendings.map((p) => p.companyId));
  }

  return NextResponse.json({
    companies: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      website: r.website,
      sector: r.sector,
      stage: r.stage,
      employee_count: r.employee_count,
      city: null,
      county: null,
      status: r.claimed_by_user_id
        ? "claimed"
        : pendingByCompany.has(r.id)
          ? "pending"
          : "unclaimed",
    })),
  });
}

// POST: admin-only company create. Used by /admin/companies and CLI.
export async function POST(req: Request) {
  const session = await getApiSession(req);
  const machine = hasMachineToken(req);
  if (!machine && !(session && isAdminRole(session.user.role))) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }
  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    name?: string;
    website?: string;
    description?: string;
    sector?: string;
    stage?: string;
    employee_count?: string;
    address_text?: string;
    linkedin?: string;
  } | null;
  if (!body || !body.slug || !body.name) {
    return errorResponse(
      "bad_request",
      "Missing required fields: slug, name.",
      400,
    );
  }

  const id = newId("co");
  await db()
    .insert(companies)
    .values({
      id,
      slug: body.slug,
      name: body.name,
      website: body.website ?? null,
      description: body.description ?? null,
      sector: body.sector ?? null,
      stage: body.stage ?? null,
      employeeCount: body.employee_count ?? null,
      addressText: body.address_text ?? null,
      linkedin: body.linkedin ?? null,
      hiringStatus: false,
    });

  return NextResponse.json({ id, slug: body.slug }, { status: 201 });
}
