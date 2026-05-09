// Shared listing logic. The /api/v1/companies GET handler and the
// /map server component both need the same filter → row pipeline.
// Returning the wire-shape (snake_case) keeps the JSON response and
// the SSR'd map data byte-for-byte equivalent.

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companies,
  companyLocations,
  businessOwnershipSubmissions,
} from "@/db/schema";
import {
  buildBaseWhere,
  buildLocationWhere,
  passesBucketFilter,
  type CompanyFilters,
} from "@/lib/company-filters";

export type CompanyListItem = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  sector: string | null;
  stage: string | null;
  employee_count: string | null;
  hiring_status: boolean;
  logo_url: string | null;
  summary: string | null;
  lat: number | null;
  lng: number | null;
  city: string | null;
  county: string | null;
  last_updated_at: string | null;
  status: "claimed" | "pending" | "unclaimed";
};

export async function listCompanies(
  filters: CompanyFilters,
  hardLimit = 500,
): Promise<{ companies: CompanyListItem[]; total: number }> {
  const limit = Math.min(filters.limit ?? hardLimit, hardLimit);
  const baseWhere = buildBaseWhere(filters);
  const locWhere = buildLocationWhere(filters);

  let companyIdScope: string[] | null = null;
  if (locWhere) {
    const locRows = await db()
      .select({ companyId: companyLocations.companyId })
      .from(companyLocations)
      .where(locWhere);
    companyIdScope = locRows.map((r) => r.companyId);
    if (companyIdScope.length === 0) return { companies: [], total: 0 };
  }

  const finalWhere = (() => {
    if (baseWhere && companyIdScope) {
      return and(baseWhere, inArray(companies.id, companyIdScope));
    }
    if (baseWhere) return baseWhere;
    if (companyIdScope) return inArray(companies.id, companyIdScope);
    return undefined;
  })();

  const cols = {
    id: companies.id,
    slug: companies.slug,
    name: companies.name,
    website: companies.website,
    sector: companies.sector,
    stage: companies.stage,
    employee_count: companies.employeeCount,
    hiring_status: companies.hiringStatus,
    logo_url: companies.logoUrl,
    description: companies.description,
    lat: companies.lat,
    lng: companies.lng,
    last_updated_at: companies.lastUpdatedAt,
    claimed_by_user_id: companies.claimedByUserId,
  };

  const rowsRaw = finalWhere
    ? await db().select(cols).from(companies).where(finalWhere).limit(limit)
    : await db().select(cols).from(companies).limit(limit);

  const rows = rowsRaw.filter((r) => passesBucketFilter(r, filters));
  if (rows.length === 0) return { companies: [], total: 0 };

  const ids = rows.map((r) => r.id);
  // D1 / SQLite caps compound `IN (?, ?, …)` at ~100 placeholders.
  // Chunk the lookup so larger result sets don't blow up the query;
  // 90 leaves a small headroom for any other constants in the WHERE.
  const CHUNK = 90;
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

  const locResults = await Promise.all(
    chunks.map((c) =>
      db()
        .select({
          companyId: companyLocations.companyId,
          county: companyLocations.county,
          city: companyLocations.city,
        })
        .from(companyLocations)
        .where(inArray(companyLocations.companyId, c)),
    ),
  );
  const pendingResults = await Promise.all(
    chunks.map((c) =>
      db()
        .select({ companyId: businessOwnershipSubmissions.companyId })
        .from(businessOwnershipSubmissions)
        .where(
          and(
            inArray(businessOwnershipSubmissions.companyId, c),
            eq(businessOwnershipSubmissions.status, "pending"),
          ),
        ),
    ),
  );
  const locs = locResults.flat();
  const pendings = pendingResults.flat();

  // Schema permits multiple location rows per company, but the wire
  // shape exposes one city/county pair (the company's primary
  // location). We pick the first row encountered as the representative
  // until the schema grows an HQ flag — keep this explicit so it's
  // clear we're discarding rows by design, not by accident.
  const locByCompany = new Map<
    string,
    { city: string | null; county: string | null }
  >();
  for (const l of locs) {
    if (!locByCompany.has(l.companyId)) {
      locByCompany.set(l.companyId, { city: l.city, county: l.county });
    }
  }
  const pendingSet = new Set(pendings.map((p) => p.companyId));

  const out: CompanyListItem[] = rows.map((r) => {
    const loc = locByCompany.get(r.id);
    const summary = r.description
      ? r.description.split(/(?<=[.!?])\s+/, 1)[0].slice(0, 240)
      : null;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      website: r.website,
      sector: r.sector,
      stage: r.stage,
      employee_count: r.employee_count,
      hiring_status: r.hiring_status,
      logo_url: r.logo_url,
      summary,
      lat: r.lat,
      lng: r.lng,
      city: loc?.city ?? null,
      county: loc?.county ?? null,
      last_updated_at: r.last_updated_at
        ? r.last_updated_at.toISOString?.() ?? null
        : null,
      status: r.claimed_by_user_id
        ? "claimed"
        : pendingSet.has(r.id)
          ? "pending"
          : "unclaimed",
    };
  });

  return { companies: out, total: out.length };
}
