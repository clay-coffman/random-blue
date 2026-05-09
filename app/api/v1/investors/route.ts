import { NextResponse } from "next/server";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

// Public list of verified investors. No auth. Used by the directory
// UI and external agents. Email is never included.
export async function GET() {
  const rows = await db()
    .select({
      id: investorProfiles.id,
      slug: investorProfiles.slug,
      displayName: investorProfiles.displayName,
      firmName: investorProfiles.firmName,
      tagline: investorProfiles.tagline,
      investorType: investorProfiles.investorType,
      stagesJson: investorProfiles.stagesJson,
      sectorsJson: investorProfiles.sectorsJson,
      geoFocusJson: investorProfiles.geoFocusJson,
      verifiedAt: investorProfiles.verifiedAt,
    })
    .from(investorProfiles)
    .where(
      and(
        eq(investorProfiles.verificationStatus, "verified"),
        isNotNull(investorProfiles.slug),
      ),
    )
    .orderBy(asc(investorProfiles.displayName));

  const investors = rows.map((r) => ({
    id: r.id,
    slug: r.slug!,
    display_name: r.displayName ?? r.firmName ?? "Investor",
    firm_name: r.firmName,
    tagline: r.tagline,
    investor_type: r.investorType,
    stages: parseJsonArray(r.stagesJson),
    sectors: parseJsonArray(r.sectorsJson),
    geo_focus: parseJsonArray(r.geoFocusJson),
    verified_at: r.verifiedAt ? r.verifiedAt.toISOString?.() ?? null : null,
    canonical_url: `/investors/${r.slug}`,
  }));

  return NextResponse.json({ investors, count: investors.length });
}

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
