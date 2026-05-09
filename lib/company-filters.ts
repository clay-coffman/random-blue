// Shared filter-extraction logic for the companies list endpoint and
// the /map server-component initial fetch. Reads URLSearchParams,
// validates, returns the Drizzle predicates + a JS post-filter for
// the bucket-shaped employee_count column (which can't be range-
// filtered in SQL).

import { z } from "zod";
import { and, eq, like, or, type SQL } from "drizzle-orm";
import { companies, companyLocations } from "@/db/schema";
import { bucketMatchesRange, bucketMatchesBucket } from "@/lib/employee-bucket";

export const CompanyFilterParams = z.object({
  sector: z.string().trim().min(1).optional(),
  /** Comma-separated multi-select, e.g. "FinTech,B2B Software". */
  sectors: z.string().trim().min(1).optional(),
  stage: z.string().trim().min(1).optional(),
  county: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  /** Filter by bucket string directly, e.g. "11-50". */
  employee_bucket: z.string().trim().min(1).optional(),
  /** Numeric range overlap. */
  min_employees: z.coerce.number().int().nonnegative().optional(),
  max_employees: z.coerce.number().int().nonnegative().optional(),
  hiring_status: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export type CompanyFilters = z.infer<typeof CompanyFilterParams>;

export function parseFilters(searchParams: URLSearchParams): {
  filters: CompanyFilters;
  errors: z.ZodError | null;
} {
  const obj: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) {
    if (v === "") continue;
    obj[k] = v;
  }
  const parsed = CompanyFilterParams.safeParse(obj);
  if (!parsed.success) return { filters: {}, errors: parsed.error };
  return { filters: parsed.data, errors: null };
}

/** Multi-sector list — falls back to single `sector` if `sectors` not set. */
export function selectedSectors(f: CompanyFilters): string[] {
  if (f.sectors) {
    return f.sectors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (f.sector) return [f.sector];
  return [];
}

/**
 * Build the Drizzle WHERE clause for everything except the bucket
 * filters (which require post-query JS filtering since employee_count
 * is text-bucket-shaped). The caller composes `inArray(companies.id,
 * locationCompanyIds)` separately if county/city is specified, since
 * Drizzle subquery composition gets noisy.
 */
export function buildBaseWhere(f: CompanyFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const sectors = selectedSectors(f);
  if (sectors.length === 1) {
    clauses.push(eq(companies.sector, sectors[0]));
  } else if (sectors.length > 1) {
    // `or` returns SQL | undefined only when called with no args; we
    // only land here with sectors.length > 1.
    const sectorMatch = or(...sectors.map((s) => eq(companies.sector, s)));
    if (sectorMatch) clauses.push(sectorMatch);
  }

  if (f.stage) {
    // Stage stored lower-case; defensive .trim() in case of user-edited
    // rows. Compare case-insensitively too — owner edits don't go
    // through the seed normalizer.
    clauses.push(eq(companies.stage, f.stage.trim().toLowerCase()));
  }

  if (f.hiring_status !== undefined) {
    clauses.push(eq(companies.hiringStatus, f.hiring_status));
  }

  if (f.q) {
    const needle = `%${f.q}%`;
    const textSearch = or(
      like(companies.name, needle),
      like(companies.slug, needle),
      like(companies.website, needle),
      like(companies.description, needle),
    );
    if (textSearch) clauses.push(textSearch);
  }

  if (clauses.length === 0) return undefined;
  return and(...clauses);
}

/** Build a county/city WHERE for company_locations subquery. */
export function buildLocationWhere(f: CompanyFilters): SQL | undefined {
  const clauses: SQL[] = [];
  if (f.county) clauses.push(eq(companyLocations.county, f.county.trim()));
  if (f.city) clauses.push(eq(companyLocations.city, f.city.trim()));
  if (clauses.length === 0) return undefined;
  return and(...clauses);
}

/** Does this row pass the bucket filters? In-memory step. */
export function passesBucketFilter(
  row: { employee_count?: string | null; employeeCount?: string | null },
  f: CompanyFilters,
): boolean {
  const bucket = row.employee_count ?? row.employeeCount ?? null;
  if (
    !bucketMatchesRange(bucket, f.min_employees ?? null, f.max_employees ?? null)
  ) {
    return false;
  }
  if (!bucketMatchesBucket(bucket, f.employee_bucket ?? null)) return false;
  return true;
}
