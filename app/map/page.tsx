import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, companyLocations } from "@/db/schema";
import { MapView } from "./_components/MapView";
import type {
  CompaniesListResponse,
  CompanyListItem,
  MapFacets,
} from "./_components/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Utah Startup Map · Atlas",
  description:
    "Filter Utah startups by sector, stage, location, and hiring. Click any pin for the full profile.",
};

function summarize(text: string | null): string | null {
  if (!text) return null;
  const t = text.trim();
  return t.length <= 200 ? t : t.slice(0, 197).trimEnd() + "…";
}

export default async function MapPage() {
  const d = db();

  const rows = await d
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
      county: companyLocations.county,
      city: companyLocations.city,
    })
    .from(companies)
    .leftJoin(companyLocations, eq(companyLocations.companyId, companies.id))
    .limit(1000);

  const seen = new Set<string>();
  const items: CompanyListItem[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    items.push({
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
    });
  }

  const initial: CompaniesListResponse = {
    companies: items,
    total: items.length,
  };

  const [sectorRows, stageRows, countyRows] = await Promise.all([
    d
      .select({ v: companies.sector })
      .from(companies)
      .where(sql`${companies.sector} IS NOT NULL`)
      .groupBy(companies.sector),
    d
      .select({ v: companies.stage })
      .from(companies)
      .where(sql`${companies.stage} IS NOT NULL`)
      .groupBy(companies.stage),
    d
      .select({ v: companyLocations.county })
      .from(companyLocations)
      .where(sql`${companyLocations.county} IS NOT NULL`)
      .groupBy(companyLocations.county),
  ]);

  const facets: MapFacets = {
    sectors: sectorRows
      .map((r) => r.v)
      .filter((v): v is string => !!v)
      .sort(),
    stages: stageRows
      .map((r) => r.v)
      .filter((v): v is string => !!v)
      .sort(),
    counties: countyRows
      .map((r) => r.v)
      .filter((v): v is string => !!v)
      .sort(),
  };

  return <MapView initial={initial} facets={facets} />;
}
