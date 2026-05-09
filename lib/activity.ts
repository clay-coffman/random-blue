import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "./db";
import {
  businessOwnershipSubmissions,
  companies,
  founderPassports,
  profileUpdates,
} from "@/db/schema";

export type ActivityEvent = {
  kind: "claim" | "passport" | "update";
  text: string;
  ts: number;
};

type Timestamp = Date | number | null;

export type ClaimRow = {
  reviewedAt: Timestamp;
  companyName: string | null;
  companySector: string | null;
};

export type PassportRow = {
  createdAt: Timestamp;
  county: string | null;
  industry: string | null;
};

export type UpdateRow = {
  appliedAt: Timestamp;
  companyName: string | null;
  sourceClient: string | null;
};

function toMs(t: Timestamp): number | null {
  if (t === null || t === undefined) return null;
  return typeof t === "number" ? t : t.valueOf();
}

export function formatClaim(row: ClaimRow): ActivityEvent | null {
  const ts = toMs(row.reviewedAt);
  if (ts === null || !row.companyName) return null;
  const where = row.companySector ? ` (${row.companySector})` : "";
  return {
    kind: "claim",
    text: `${row.companyName}${where} just verified ownership`,
    ts,
  };
}

export function formatPassport(row: PassportRow): ActivityEvent | null {
  const ts = toMs(row.createdAt);
  if (ts === null) return null;
  const where = row.county ? ` in ${row.county}` : "";
  const what = row.industry ? ` working on ${row.industry}` : "";
  if (!where && !what) return null;
  return {
    kind: "passport",
    text: `New founder${where}${what}`,
    ts,
  };
}

export function formatUpdate(row: UpdateRow): ActivityEvent | null {
  const ts = toMs(row.appliedAt);
  if (ts === null || !row.companyName) return null;
  const via = sourceClientLabel(row.sourceClient);
  return {
    kind: "update",
    text: `${row.companyName} updated their profile${via}`,
    ts,
  };
}

function sourceClientLabel(source: string | null): string {
  switch (source) {
    case "claude.ai":
      return " via Claude";
    case "chatgpt.com":
      return " via ChatGPT";
    case "machine":
      return " via API";
    default:
      return "";
  }
}

export function mergeEvents(
  groups: ReadonlyArray<ReadonlyArray<ActivityEvent>>,
  limit: number,
): ActivityEvent[] {
  const merged = groups.flat().sort((a, b) => b.ts - a.ts);
  return merged.slice(0, limit);
}

export async function recentActivity(limit = 6): Promise<ActivityEvent[]> {
  try {
    const d = db();
    const perKind = Math.max(2, Math.ceil(limit / 2));

    const [claimRows, passportRows, updateRows] = await Promise.all([
      d
        .select({
          reviewedAt: businessOwnershipSubmissions.reviewedAt,
          companyName: companies.name,
          companySector: companies.sector,
        })
        .from(businessOwnershipSubmissions)
        .innerJoin(
          companies,
          eq(businessOwnershipSubmissions.companyId, companies.id),
        )
        .where(
          and(
            eq(businessOwnershipSubmissions.status, "approved"),
            isNotNull(businessOwnershipSubmissions.reviewedAt),
          ),
        )
        .orderBy(desc(businessOwnershipSubmissions.reviewedAt))
        .limit(perKind),

      d
        .select({
          createdAt: founderPassports.createdAt,
          county: founderPassports.county,
          industry: founderPassports.industry,
        })
        .from(founderPassports)
        .where(isNotNull(founderPassports.createdAt))
        .orderBy(desc(founderPassports.createdAt))
        .limit(perKind),

      d
        .select({
          appliedAt: profileUpdates.appliedAt,
          companyName: companies.name,
          sourceClient: profileUpdates.sourceClient,
        })
        .from(profileUpdates)
        .innerJoin(companies, eq(profileUpdates.companyId, companies.id))
        .where(isNotNull(profileUpdates.appliedAt))
        .orderBy(desc(profileUpdates.appliedAt))
        .limit(perKind),
    ]);

    const claims = claimRows
      .map(formatClaim)
      .filter((e): e is ActivityEvent => e !== null);
    const passports = passportRows
      .map(formatPassport)
      .filter((e): e is ActivityEvent => e !== null);
    const updates = updateRows
      .map(formatUpdate)
      .filter((e): e is ActivityEvent => e !== null);

    return mergeEvents([claims, passports, updates], limit);
  } catch (err) {
    console.error("recentActivity failed:", err);
    return [];
  }
}
