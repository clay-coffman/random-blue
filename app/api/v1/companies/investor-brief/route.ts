import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api-error";
import { listCompanies } from "@/lib/companies-list";
import { parseFilters } from "@/lib/company-filters";
import { generateInvestorBrief } from "@/lib/investor-brief";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  filter: z.record(z.string(), z.unknown()).default({}),
  slugs: z.array(z.string()).max(120).optional(),
});

// POST: source-bound investor brief over the currently-filtered set.
// Caller may pass `slugs` (canonical: from the client's filtered view)
// or rely on `filter` to re-derive the set server-side. Returns the
// structured brief; degraded fallback on any failure path.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("bad_request", "Body must be JSON.", 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid request shape.",
      400,
      parsed.error.format(),
    );
  }

  // Derive the company set: prefer explicit slugs (the client knows
  // what's actually rendered on the map). Fall back to filter-driven
  // lookup when the client didn't pass any.
  const filterParams = new URLSearchParams();
  for (const [k, v] of Object.entries(parsed.data.filter)) {
    if (v == null) continue;
    if (typeof v === "string") filterParams.set(k, v);
    else if (typeof v === "number" || typeof v === "boolean")
      filterParams.set(k, String(v));
  }
  const { filters } = parseFilters(filterParams);

  let companies = (await listCompanies(filters, 500)).companies;
  if (parsed.data.slugs && parsed.data.slugs.length > 0) {
    const allow = new Set(parsed.data.slugs);
    companies = companies.filter((c) => allow.has(c.slug));
  }

  const brief = await generateInvestorBrief(parsed.data.filter, companies);
  return NextResponse.json(brief);
}
