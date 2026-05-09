import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { ApiError, errorResponse } from "@/lib/api-error";
import {
  companies,
  companyLocations,
  businessOwnershipSubmissions,
} from "@/db/schema";
import {
  getApiSession,
  hasMachineToken,
  isAdminRole,
} from "@/lib/auth-utils";
import { newId } from "@/lib/ids";

// Mixed file: GET (Agent 4) is straight DB; POST (Agent 5) needs
// Better Auth which won't run on edge. Default Node runtime.
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 500;

const EMPLOYEE_BANDS: Record<string, [number, number]> = {
  "2-10": [2, 10],
  "11-50": [11, 50],
  "51-200": [51, 200],
  "201-500": [201, 500],
  "501-1K": [501, 1000],
  "1K-5K": [1001, 5000],
};

function summarize(text: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length <= 200) return trimmed;
  return trimmed.slice(0, 197).trimEnd() + "…";
}

function bandOverlapsRange(
  band: string | null,
  min: number | null,
  max: number | null,
): boolean {
  if (min === null && max === null) return true;
  if (!band) return false;
  const range = EMPLOYEE_BANDS[band];
  if (!range) return false;
  const [lo, hi] = range;
  if (min !== null && hi < min) return false;
  if (max !== null && lo > max) return false;
  return true;
}

function parseIntParam(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// GET — list companies with map filters + claim status. Backs the
// /map view and /onboarding/owner search (which expects `q`,
// `limit`, and a `status` field per row).
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sector = url.searchParams.get("sector");
    const stage = url.searchParams.get("stage");
    const county = url.searchParams.get("county");
    const city = url.searchParams.get("city");
    const hiring = url.searchParams.get("hiring_status");
    const q = url.searchParams.get("q");
    const minEmp = parseIntParam(url.searchParams.get("min_employees"));
    const maxEmp = parseIntParam(url.searchParams.get("max_employees"));
    const limitParam = parseIntParam(url.searchParams.get("limit"));
    const limit = limitParam
      ? Math.min(MAX_LIMIT, Math.max(1, limitParam))
      : DEFAULT_LIMIT;

    const filters: SQL[] = [];
    if (sector) filters.push(eq(companies.sector, sector));
    if (stage) filters.push(eq(companies.stage, stage));
    if (hiring === "true") filters.push(eq(companies.hiringStatus, true));
    if (hiring === "false") filters.push(eq(companies.hiringStatus, false));
    if (q) {
      // Escape user input so a `%` or `_` in the search box matches
      // literally instead of acting as a LIKE wildcard. The ESCAPE
      // clause tells SQLite to treat `\` as the escape character.
      const escaped = q.replace(/[\\%_]/g, (m) => `\\${m}`);
      const term = `%${escaped}%`;
      const orClause = or(
        sql`${companies.name} LIKE ${term} ESCAPE '\\'`,
        sql`${companies.slug} LIKE ${term} ESCAPE '\\'`,
        sql`${companies.website} LIKE ${term} ESCAPE '\\'`,
        sql`${companies.description} LIKE ${term} ESCAPE '\\'`,
        sql`${companies.sector} LIKE ${term} ESCAPE '\\'`,
      );
      if (orClause) filters.push(orClause);
    }
    if (county) filters.push(eq(companyLocations.county, county));
    if (city) filters.push(eq(companyLocations.city, city));

    const d = db();
    const baseQuery = d
      .select({
        id: companies.id,
        slug: companies.slug,
        name: companies.name,
        sector: companies.sector,
        stage: companies.stage,
        employeeCount: companies.employeeCount,
        hiringStatus: companies.hiringStatus,
        lat: companies.lat,
        lng: companies.lng,
        logoUrl: companies.logoUrl,
        website: companies.website,
        description: companies.description,
        claimedByUserId: companies.claimedByUserId,
        county: companyLocations.county,
        city: companyLocations.city,
      })
      .from(companies)
      .leftJoin(companyLocations, eq(companyLocations.companyId, companies.id));

    const whereClause = filters.length ? and(...filters) : undefined;
    const rows = whereClause
      ? await baseQuery.where(whereClause).limit(limit * 2)
      : await baseQuery.limit(limit * 2);

    // De-duplicate companies that have multiple location rows.
    const seen = new Set<string>();
    const deduped: typeof rows = [];
    for (const r of rows) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      if (!bandOverlapsRange(r.employeeCount, minEmp, maxEmp)) continue;
      deduped.push(r);
      if (deduped.length >= limit) break;
    }

    // One extra query: which of these companies have a pending
    // ownership submission. Used by /onboarding/owner to disambiguate
    // claimed vs pending vs unclaimed; the map ignores `status`.
    let pending = new Set<string>();
    if (deduped.length > 0) {
      const ids = deduped.map((r) => r.id);
      const pendings = await d
        .select({ companyId: businessOwnershipSubmissions.companyId })
        .from(businessOwnershipSubmissions)
        .where(
          and(
            inArray(businessOwnershipSubmissions.companyId, ids),
            eq(businessOwnershipSubmissions.status, "pending"),
          ),
        );
      pending = new Set(pendings.map((p) => p.companyId));
    }

    const wireCompanies = deduped.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      sector: r.sector,
      stage: r.stage,
      employee_count: r.employeeCount,
      hiring_status: r.hiringStatus,
      lat: r.lat,
      lng: r.lng,
      logo_url: r.logoUrl,
      website: r.website,
      summary: summarize(r.description),
      county: r.county,
      city: r.city,
      claimed_by_user_id: r.claimedByUserId,
      status: r.claimedByUserId
        ? ("claimed" as const)
        : pending.has(r.id)
          ? ("pending" as const)
          : ("unclaimed" as const),
    }));

    return NextResponse.json({
      companies: wireCompanies,
      total: wireCompanies.length,
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("companies list error", err);
    return errorResponse("internal_error", "Failed to list companies", 500);
  }
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
