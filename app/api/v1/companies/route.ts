import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import {
  getApiSession,
  hasMachineToken,
  isAdminRole,
} from "@/lib/auth-utils";
import { newId } from "@/lib/ids";
import { parseFilters } from "@/lib/company-filters";
import { listCompanies } from "@/lib/companies-list";

export const dynamic = "force-dynamic";

// Listing endpoint. Powers the /map view and /onboarding/owner search.
//
// The /onboarding/owner contract Agent 5 baked in is preserved:
//   - `q` does case-insensitive LIKE across name/slug/website
//   - response includes a derived `status: claimed|pending|unclaimed`
//     so the search UI can render claim status without joining
//     business_ownership_submissions itself.
//
// New for Agent 4: filters by sector(s), stage, county, city,
// employee_bucket / min_employees / max_employees, hiring_status, plus
// lat/lng/hiring_status/logo_url/summary/last_updated_at on each row.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const { filters, errors } = parseFilters(url.searchParams);
  if (errors) {
    return errorResponse(
      "bad_request",
      "Invalid filter parameters.",
      400,
      errors.format(),
    );
  }
  const result = await listCompanies(filters, 500);
  return NextResponse.json(result);
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
  try {
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
  } catch (err) {
    // companies.slug has a UNIQUE index. D1 surfaces violations as a
    // SQLite UNIQUE constraint error — return a precise 409 instead of
    // letting the framework throw a generic 500.
    const msg = err instanceof Error ? err.message : String(err);
    if (/UNIQUE constraint failed.*companies\.slug/i.test(msg)) {
      return errorResponse(
        "conflict",
        `A company already exists with slug "${body.slug}".`,
        409,
      );
    }
    throw err;
  }

  return NextResponse.json({ id, slug: body.slug }, { status: 201 });
}
