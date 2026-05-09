// Shared formatter for the company "Agent Card."
//
// Single source of truth for the canonical company shape. The HTML
// profile page (`app/startups/[slug]/page.tsx`), the markdown card
// endpoint (`/startups/<slug>/route.md`), the JSON card endpoint
// (`/startups/<slug>/route.json`), and the public REST endpoint
// (`/api/v1/companies/<slug>`) all consume what these functions
// produce — so adding a field means one edit here plus the
// corresponding line in `formatCompanyCardMarkdown` /
// `toWireCompanyCard`.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, companyJobs, companyLocations } from "@/db/schema";

export type CompanyCardLocation = {
  county: string | null;
  city: string | null;
};

export type CompanyCardJob = {
  id: number;
  title: string;
  url: string | null;
  postedAt: string | null;
};

export type CompanyCardFounder = {
  name: string;
  title?: string;
  linkedin?: string;
};

export type CompanyCard = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  description: string | null;
  sector: string | null;
  stage: string | null;
  employeeCount: string | null;
  hiringStatus: boolean;
  foundingYear: number | null;
  linkedin: string | null;
  logoUrl: string | null;
  founderTeam: CompanyCardFounder[];
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  locations: CompanyCardLocation[];
  jobs: CompanyCardJob[];
  verifiedAt: string | null;
  claimedAt: string | null;
  claimed: boolean;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
};

export type CompanyCardWire = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  description: string | null;
  sector: string | null;
  stage: string | null;
  employee_count: string | null;
  hiring_status: boolean;
  founding_year: number | null;
  linkedin: string | null;
  logo_url: string | null;
  founder_team: CompanyCardFounder[];
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  locations: { county: string | null; city: string | null }[];
  jobs: {
    id: number;
    title: string;
    url: string | null;
    posted_at: string | null;
  }[];
  verified_at: string | null;
  claimed_at: string | null;
  claimed: boolean;
  last_updated_by: string | null;
  last_updated_at: string | null;
  agent_card: {
    markdown_url: string;
    json_url: string;
    api_url: string;
  };
};

function parseFounderTeam(raw: string | null): CompanyCardFounder[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
      .map((f) => ({
        name: typeof f.name === "string" ? f.name : "",
        title: typeof f.title === "string" ? f.title : undefined,
        linkedin: typeof f.linkedin === "string" ? f.linkedin : undefined,
      }))
      .filter((f) => f.name.length > 0);
  } catch {
    return [];
  }
}

function isoOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export async function getCompanyCard(
  slug: string,
): Promise<CompanyCard | null> {
  const d = db();
  const rows = await d
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  const c = rows[0];
  if (!c) return null;

  const [locs, jobs] = await Promise.all([
    d
      .select()
      .from(companyLocations)
      .where(eq(companyLocations.companyId, c.id)),
    d.select().from(companyJobs).where(eq(companyJobs.companyId, c.id)),
  ]);

  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    website: c.website,
    description: c.description,
    sector: c.sector,
    stage: c.stage,
    employeeCount: c.employeeCount,
    hiringStatus: c.hiringStatus,
    foundingYear: c.foundingYear,
    linkedin: c.linkedin,
    logoUrl: c.logoUrl,
    founderTeam: parseFounderTeam(c.founderTeamJson),
    addressText: c.addressText,
    lat: c.lat,
    lng: c.lng,
    locations: locs.map((l) => ({ county: l.county, city: l.city })),
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      url: j.url,
      postedAt: isoOrNull(j.postedAt),
    })),
    verifiedAt: isoOrNull(c.verifiedAt),
    claimedAt: isoOrNull(c.claimedAt),
    claimed: !!c.claimedByUserId,
    lastUpdatedBy: c.lastUpdatedBy,
    lastUpdatedAt: isoOrNull(c.lastUpdatedAt),
  };
}

export function toWireCompanyCard(c: CompanyCard): CompanyCardWire {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    website: c.website,
    description: c.description,
    sector: c.sector,
    stage: c.stage,
    employee_count: c.employeeCount,
    hiring_status: c.hiringStatus,
    founding_year: c.foundingYear,
    linkedin: c.linkedin,
    logo_url: c.logoUrl,
    founder_team: c.founderTeam,
    address_text: c.addressText,
    lat: c.lat,
    lng: c.lng,
    locations: c.locations,
    jobs: c.jobs.map((j) => ({
      id: j.id,
      title: j.title,
      url: j.url,
      posted_at: j.postedAt,
    })),
    verified_at: c.verifiedAt,
    claimed_at: c.claimedAt,
    claimed: c.claimed,
    last_updated_by: c.lastUpdatedBy,
    last_updated_at: c.lastUpdatedAt,
    agent_card: {
      markdown_url: `/startups/${c.slug}/route.md`,
      json_url: `/startups/${c.slug}/route.json`,
      api_url: `/api/v1/companies/${c.slug}`,
    },
  };
}

export function formatCompanyCardMarkdown(c: CompanyCard): string {
  const lines: string[] = [];

  lines.push(`# ${c.name}`);
  lines.push("");

  const meta: string[] = [];
  if (c.sector) meta.push(`**Sector:** ${c.sector}`);
  if (c.stage) meta.push(`**Stage:** ${c.stage}`);
  if (c.employeeCount) meta.push(`**Employees:** ${c.employeeCount}`);
  if (c.foundingYear) meta.push(`**Founded:** ${c.foundingYear}`);
  meta.push(`**Hiring:** ${c.hiringStatus ? "Yes" : "No"}`);
  if (c.claimed) meta.push("**Verified:** Owner-claimed");
  if (meta.length) {
    lines.push(meta.join(" · "));
    lines.push("");
  }

  if (c.description) {
    lines.push(c.description);
    lines.push("");
  }

  if (c.website || c.linkedin) {
    lines.push("## Links");
    if (c.website) lines.push(`- Website: ${c.website}`);
    if (c.linkedin) lines.push(`- LinkedIn: ${c.linkedin}`);
    lines.push("");
  }

  if (c.locations.length || c.addressText) {
    lines.push("## Location");
    for (const loc of c.locations) {
      const parts = [loc.city, loc.county && `${loc.county} County`].filter(
        Boolean,
      );
      if (parts.length) lines.push(`- ${parts.join(", ")}`);
    }
    if (!c.locations.length && c.addressText) {
      lines.push(`- ${c.addressText}`);
    }
    lines.push("");
  }

  if (c.founderTeam.length) {
    lines.push("## Team");
    for (const f of c.founderTeam) {
      const parts = [f.name, f.title].filter(Boolean).join(" — ");
      lines.push(f.linkedin ? `- ${parts} (${f.linkedin})` : `- ${parts}`);
    }
    lines.push("");
  }

  if (c.jobs.length) {
    lines.push("## Open roles");
    for (const j of c.jobs) {
      lines.push(j.url ? `- [${j.title}](${j.url})` : `- ${j.title}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Agent Card");
  lines.push("");
  lines.push(
    "This profile is served as HTML, Markdown, and JSON from the same source.",
  );
  lines.push("");
  lines.push(`- HTML: \`/startups/${c.slug}\``);
  lines.push(`- Markdown: \`/startups/${c.slug}/route.md\``);
  lines.push(`- JSON: \`/startups/${c.slug}/route.json\``);
  lines.push(`- API: \`/api/v1/companies/${c.slug}\``);
  if (c.lastUpdatedAt) {
    lines.push("");
    lines.push(`_Last updated: ${c.lastUpdatedAt}_`);
  }

  return lines.join("\n") + "\n";
}
