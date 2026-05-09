// Canonical investor public card formatter. Single source of truth for:
//   - GET /api/v1/investor-profiles/:slug   (the JSON shape)
//   - GET /investors/:slug.json             (same JSON shape)
//   - GET /investors/:slug.md               (markdown rendering)
//   - app/investors/[slug]/page.tsx         (server-component page render — reads card.*)
//
// Mirrors lib/company-card.ts. snake_case wire format throughout.
// Email is NEVER in the output — the only way to surface contact info
// is via an admin-accepted intro request.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { slugify } from "@/lib/slugify";

type InvestorProfileRow = typeof investorProfiles.$inferSelect;
import {
  GEO_FOCUS_OPTIONS,
  INVESTOR_TYPE_OPTIONS,
  SECTOR_OPTIONS,
  STAGE_OPTIONS,
} from "@/lib/investor-schema";

export type InvestorPublicCard = {
  id: string;
  slug: string;
  display_name: string;
  firm_name: string | null;
  investor_type: string | null;
  investor_type_display: string | null;
  tagline: string | null;
  bio: string | null;
  website: string | null;
  linkedin: string | null;
  stages: string[];
  stages_display: string[];
  sectors: string[];
  sectors_display: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  geo_focus: string[];
  geo_focus_display: string[];
  verification: {
    status: "verified" | "unverified";
    verified_at: string | null;
  };
  last_updated_at: string | null;
  canonical_url: string;
  agent_card_urls: {
    html: string;
    markdown: string;
    json: string;
    api: string;
  };
};

function lookup(opts: ReadonlyArray<{ id: string; label: string }>, ids: string[]): string[] {
  return ids.map((id) => opts.find((o) => o.id === id)?.label ?? id);
}

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rowToCard(row: InvestorProfileRow): InvestorPublicCard {
  const stages = parseJsonArray(row.stagesJson);
  const sectors = parseJsonArray(row.sectorsJson);
  const geoFocus = parseJsonArray(row.geoFocusJson);
  const investorType = row.investorType;
  const verifiedAt = row.verifiedAt ? row.verifiedAt.toISOString?.() ?? null : null;
  const lastUpdatedAt = row.updatedAt ? row.updatedAt.toISOString?.() ?? null : null;
  const slug = row.slug ?? "";

  return {
    id: row.id,
    slug,
    display_name: row.displayName ?? row.firmName ?? "Investor",
    firm_name: row.firmName,
    investor_type: investorType,
    investor_type_display: investorType
      ? INVESTOR_TYPE_OPTIONS.find((o) => o.id === investorType)?.label ?? investorType
      : null,
    tagline: row.tagline,
    bio: row.bio,
    website: row.website,
    linkedin: row.linkedin,
    stages,
    stages_display: lookup(STAGE_OPTIONS, stages),
    sectors,
    sectors_display: lookup(SECTOR_OPTIONS, sectors),
    check_size_min: row.checkSizeMin,
    check_size_max: row.checkSizeMax,
    geo_focus: geoFocus,
    geo_focus_display: lookup(GEO_FOCUS_OPTIONS, geoFocus),
    verification: {
      status: row.verificationStatus === "verified" ? "verified" : "unverified",
      verified_at: verifiedAt,
    },
    last_updated_at: lastUpdatedAt,
    canonical_url: `/investors/${slug}`,
    agent_card_urls: {
      html: `/investors/${slug}`,
      markdown: `/investors/${slug}.md`,
      json: `/investors/${slug}.json`,
      api: `/api/v1/investor-profiles/${slug}`,
    },
  };
}

/**
 * Visibility check: unverified profiles are owner-previewable + admin
 * viewable, but not anonymous-readable. Verified profiles are public.
 *
 * Pass viewer context (user id + role) when known; pass `null`s when
 * the request is anonymous.
 */
export function canSeeInvestor(
  row: Pick<InvestorProfileRow, "userId" | "verificationStatus">,
  viewerUserId: string | null,
  viewerRole: string | null,
): boolean {
  if (row.verificationStatus === "verified") return true;
  if (viewerRole === "goeo_admin" || viewerRole === "superadmin") return true;
  if (viewerUserId && row.userId === viewerUserId) return true;
  return false;
}

/**
 * Load a single investor profile by slug and shape into the canonical
 * public card. Returns null if the slug is unknown OR if the row has
 * no slug (i.e. unpublished).
 */
export async function investorCard(
  slug: string,
): Promise<{ card: InvestorPublicCard; markdown: string; row: InvestorProfileRow } | null> {
  const [row] = await db()
    .select()
    .from(investorProfiles)
    .where(eq(investorProfiles.slug, slug))
    .limit(1);
  if (!row || !row.slug) return null;
  const card = rowToCard(row);
  return { card, markdown: cardToMarkdown(card), row };
}

/**
 * If the row has no slug, generate one from display_name (or firm_name)
 * via the shared slugify, append -2/-3/… on collision, persist, and
 * return the chosen slug. If the row already has a slug, return it.
 *
 * Race-safe: two concurrent calls (e.g. two browser tabs hitting
 * /me/investor) can each see candidate `pelion` free in their probe.
 * The UNIQUE index on `slug` keeps the DB consistent — the loser's
 * UPDATE throws SQLITE_CONSTRAINT, we catch it and retry. After a
 * successful UPDATE, re-read the row to honor whatever slug another
 * concurrent call may have already assigned to this same user.
 */
export async function ensureInvestorSlug(row: InvestorProfileRow): Promise<string> {
  if (row.slug) return row.slug;
  const seed = row.displayName ?? row.firmName ?? "investor";
  const base = slugify(seed) || "investor";
  for (let n = 1; n <= 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await db()
      .select({ id: investorProfiles.id })
      .from(investorProfiles)
      .where(eq(investorProfiles.slug, candidate))
      .limit(1);
    if (taken.length > 0) continue;

    try {
      await db()
        .update(investorProfiles)
        .set({ slug: candidate })
        .where(eq(investorProfiles.id, row.id));
      const [refreshed] = await db()
        .select({ slug: investorProfiles.slug })
        .from(investorProfiles)
        .where(eq(investorProfiles.id, row.id))
        .limit(1);
      return refreshed?.slug ?? candidate;
    } catch (err) {
      if (/UNIQUE/i.test(err instanceof Error ? err.message : String(err))) {
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    `Could not allocate a slug for investor ${row.id} after 50 tries`,
  );
}

function formatCheckSize(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
  };
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `up to ${fmt(max!)}`;
}

function cardToMarkdown(card: InvestorPublicCard): string {
  const lines: string[] = [];

  lines.push(`# ${card.display_name}`);
  lines.push("");
  if (card.tagline) {
    lines.push(`> ${card.tagline}`);
    lines.push("");
  }

  lines.push("## Facts");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  if (card.firm_name) lines.push(`| Firm | ${card.firm_name} |`);
  if (card.investor_type_display)
    lines.push(`| Type | ${card.investor_type_display} |`);
  if (card.stages_display.length)
    lines.push(`| Stage focus | ${card.stages_display.join(", ")} |`);
  if (card.sectors_display.length)
    lines.push(`| Sectors | ${card.sectors_display.join(", ")} |`);
  if (card.geo_focus_display.length)
    lines.push(`| Geo | ${card.geo_focus_display.join(", ")} |`);
  const check = formatCheckSize(card.check_size_min, card.check_size_max);
  if (check) lines.push(`| Check size | ${check} |`);
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

  if (card.bio) {
    lines.push("## About");
    lines.push("");
    lines.push(card.bio);
    lines.push("");
  }

  lines.push("## Contact");
  lines.push("");
  lines.push(
    `Direct contact info is not published. To reach ${card.display_name}, ` +
      `send an intro request through GOEO at ${card.canonical_url} ` +
      `(sign-in required). The GOEO team reviews each request and, if accepted, ` +
      `connects both parties by email.`,
  );
  lines.push("");

  lines.push("## Links");
  lines.push("");
  if (card.website) lines.push(`- Website: ${card.website}`);
  if (card.linkedin) lines.push(`- LinkedIn: ${card.linkedin}`);
  lines.push(`- Profile (HTML): ${card.agent_card_urls.html}`);
  lines.push(`- Agent Card (JSON): ${card.agent_card_urls.json}`);
  lines.push(`- API: ${card.agent_card_urls.api}`);
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(
    `_This Markdown card is the canonical agent-readable view of ${card.display_name}. ` +
      `Same source feeds the JSON, the API, and the HTML profile page. ` +
      `Email addresses are intentionally redacted; intros flow through ` +
      `GOEO at ${card.canonical_url}._`,
  );

  return lines.join("\n");
}
