// Canonical Agent Card formatter. Single source of truth for:
//   - GET /api/v1/companies/:slug   (the JSON shape)
//   - GET /startups/:slug.json      (same JSON shape)
//   - GET /startups/:slug.md        (markdown rendering)
//   - app/startups/[slug]/page.tsx  (server-component page render — reads card.*)
//
// The fields here track docs/product-plan.md lines 158–179. snake_case
// wire format throughout so the JSON shape doesn't need transformation.

import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, companyJobs, companyLocations } from "@/db/schema";
import { sectorDisplayName } from "@/lib/sectors";

export type CompanyJobCard = {
  title: string;
  url: string | null;
  posted_at: string | null;
};

export type CompanyCard = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  /** Verbatim CSV `Section` value — kept for filter parity. */
  sector: string | null;
  /** Display-friendly sector label. */
  sector_display: string;
  stage: string | null;
  description: string | null;
  /** Short "what they sell" derived from description (first sentence). */
  what_they_sell: string | null;
  /** Hand-shaped "who should contact them" — heuristic. */
  who_should_contact: string | null;
  /** Hand-shaped "what agents should know" — heuristic. */
  agent_brief: string;
  employee_count: string | null;
  hiring_status: boolean;
  founding_year: number | null;
  linkedin: string | null;
  logo_url: string | null;
  founder_team: unknown | null;
  address_text: string | null;
  city: string | null;
  county: string | null;
  lat: number | null;
  lng: number | null;
  jobs: CompanyJobCard[];
  /** Verification — derived from `verified_at` + `claimed_by_user_id`. */
  verification: {
    status: "verified" | "claimed" | "unclaimed";
    verified_at: string | null;
    claimed_at: string | null;
  };
  last_updated_at: string | null;
  /** Stable canonical URL for sharing. */
  canonical_url: string;
  /** Companion agent-card URLs. */
  agent_card_urls: {
    html: string;
    markdown: string;
    json: string;
    api: string;
  };
};

function firstSentence(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : trimmed).slice(0, 240);
}

/** Heuristic agent brief — what an external agent needs to know before
 *  recommending this company. Built from sector + stage + hiring +
 *  description so the .md/.json cards always have a non-trivial
 *  "agent_brief" field. */
function buildAgentBrief(c: {
  name: string;
  sector: string | null;
  stage: string | null;
  hiringStatus: boolean;
  city: string | null;
  county: string | null;
  description: string | null;
  employeeCount: string | null;
}): string {
  const parts: string[] = [];
  parts.push(`${c.name} is a Utah-based startup`);
  if (c.sector) parts.push(`in ${c.sector}`);
  if (c.stage) parts.push(`at ${c.stage} stage`);
  if (c.employeeCount) parts.push(`(${c.employeeCount} employees)`);
  if (c.city || c.county) {
    const loc = [c.city, c.county && `${c.county} County`]
      .filter(Boolean)
      .join(", ");
    parts.push(`based in ${loc}`);
  }
  let s = parts.join(" ") + ".";
  if (c.hiringStatus) s += " Currently hiring.";
  if (c.description) {
    const tldr = firstSentence(c.description);
    if (tldr) s += " " + tldr;
  }
  return s;
}

/**
 * Load a single company + its locations + its jobs and shape into the
 * canonical Agent Card. Returns null if the slug is unknown.
 */
export async function companyCard(
  slug: string,
): Promise<{ card: CompanyCard; markdown: string } | null> {
  const d = db();
  const [row] = await d
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!row) return null;

  const [locations, jobs] = await Promise.all([
    d
      .select()
      .from(companyLocations)
      .where(eq(companyLocations.companyId, row.id))
      .limit(1),
    d
      .select()
      .from(companyJobs)
      .where(eq(companyJobs.companyId, row.id))
      .orderBy(asc(companyJobs.title)),
  ]);
  const loc = locations[0];

  const verifiedAt = row.verifiedAt ? row.verifiedAt.toISOString?.() ?? null : null;
  const claimedAt = row.claimedAt ? row.claimedAt.toISOString?.() ?? null : null;
  const lastUpdatedAt = row.lastUpdatedAt
    ? row.lastUpdatedAt.toISOString?.() ?? null
    : null;

  let founderTeam: unknown = null;
  if (row.founderTeamJson) {
    try {
      founderTeam = JSON.parse(row.founderTeamJson);
    } catch {
      // Defensive: malformed JSON shouldn't block the card render.
      founderTeam = null;
    }
  }

  const card: CompanyCard = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    website: row.website,
    sector: row.sector,
    sector_display: sectorDisplayName(row.sector),
    stage: row.stage,
    description: row.description,
    what_they_sell: firstSentence(row.description),
    who_should_contact: row.hiringStatus
      ? "Engineers, designers, and operators considering Utah startups; investors actively diligencing this stage."
      : "Investors actively diligencing this stage; partner companies in adjacent sectors.",
    agent_brief: buildAgentBrief({
      name: row.name,
      sector: row.sector,
      stage: row.stage,
      hiringStatus: row.hiringStatus,
      city: loc?.city ?? null,
      county: loc?.county ?? null,
      description: row.description,
      employeeCount: row.employeeCount,
    }),
    employee_count: row.employeeCount,
    hiring_status: row.hiringStatus,
    founding_year: row.foundingYear,
    linkedin: row.linkedin,
    logo_url: row.logoUrl,
    founder_team: founderTeam,
    address_text: row.addressText,
    city: loc?.city ?? null,
    county: loc?.county ?? null,
    lat: row.lat,
    lng: row.lng,
    jobs: jobs.map((j) => ({
      title: j.title,
      url: j.url,
      posted_at: j.postedAt ? j.postedAt.toISOString?.() ?? null : null,
    })),
    verification: {
      status: verifiedAt ? "verified" : claimedAt ? "claimed" : "unclaimed",
      verified_at: verifiedAt,
      claimed_at: claimedAt,
    },
    last_updated_at: lastUpdatedAt,
    canonical_url: `/startups/${row.slug}`,
    agent_card_urls: {
      html: `/startups/${row.slug}`,
      markdown: `/startups/${row.slug}.md`,
      json: `/startups/${row.slug}.json`,
      api: `/api/v1/companies/${row.slug}`,
    },
  };

  return { card, markdown: cardToMarkdown(card) };
}

function cardToMarkdown(card: CompanyCard): string {
  const lines: string[] = [];
  const sector = card.sector_display;

  lines.push(`# ${card.name}`);
  lines.push("");
  if (card.what_they_sell) {
    lines.push(`> ${card.what_they_sell}`);
    lines.push("");
  }

  // Quick facts table — agents skim this first.
  lines.push("## Facts");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  if (sector) lines.push(`| Sector | ${sector} |`);
  if (card.stage) lines.push(`| Stage | ${card.stage} |`);
  if (card.employee_count)
    lines.push(`| Employees | ${card.employee_count} |`);
  lines.push(`| Hiring | ${card.hiring_status ? "Yes" : "No"} |`);
  if (card.founding_year)
    lines.push(`| Founded | ${card.founding_year} |`);
  if (card.city || card.county) {
    const loc = [card.city, card.county && `${card.county} County`]
      .filter(Boolean)
      .join(", ");
    lines.push(`| Location | ${loc} |`);
  }
  lines.push(
    `| Verification | ${card.verification.status}${
      card.verification.verified_at
        ? ` · ${card.verification.verified_at.split("T")[0]}`
        : ""
    } |`,
  );
  if (card.last_updated_at)
    lines.push(`| Last updated | ${card.last_updated_at.split("T")[0]} |`);
  lines.push("");

  // Description.
  if (card.description) {
    lines.push("## About");
    lines.push("");
    lines.push(card.description);
    lines.push("");
  }

  // Agent brief — the "what agents should know" line.
  lines.push("## What agents should know");
  lines.push("");
  lines.push(card.agent_brief);
  lines.push("");
  if (card.who_should_contact) {
    lines.push(`**Who should contact:** ${card.who_should_contact}`);
    lines.push("");
  }

  // Open roles.
  if (card.jobs.length > 0) {
    lines.push(`## Open roles (${card.jobs.length})`);
    lines.push("");
    for (const j of card.jobs) {
      lines.push(j.url ? `- [${j.title}](${j.url})` : `- ${j.title}`);
    }
    lines.push("");
  }

  // Links.
  lines.push("## Links");
  lines.push("");
  if (card.website) lines.push(`- Website: ${card.website}`);
  if (card.linkedin) lines.push(`- LinkedIn: ${card.linkedin}`);
  lines.push(`- Profile (HTML): ${card.agent_card_urls.html}`);
  lines.push(`- Agent Card (JSON): ${card.agent_card_urls.json}`);
  lines.push(`- API: ${card.agent_card_urls.api}`);
  lines.push("");

  // Footer — agent-readable provenance.
  lines.push("---");
  lines.push("");
  lines.push(
    `_This Markdown card is the canonical agent-readable view of ${card.name}. ` +
      `Same source feeds the JSON, the API, and the HTML profile page. ` +
      `Updates flow through PATCH /api/v1/companies/${card.slug}._`,
  );

  return lines.join("\n");
}
