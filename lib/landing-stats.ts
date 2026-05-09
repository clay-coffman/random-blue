import "server-only";
import { cache } from "react";
import { count, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, resources } from "@/db/schema";
import { COUNTIES } from "@/lib/intake-options";

export type LandingStats = {
  companies: number;
  resources: number;
  counties: number;
  verifiedProfiles: number;
};

const FALLBACK: LandingStats = {
  companies: 220,
  resources: 213,
  counties: COUNTIES.length,
  verifiedProfiles: 0,
};

export const getLandingStats = cache(async (): Promise<LandingStats> => {
  try {
    const d = db();
    const [[c], [r], [v]] = await Promise.all([
      d.select({ n: count() }).from(companies),
      d.select({ n: count() }).from(resources),
      d
        .select({ n: count() })
        .from(companies)
        .where(isNotNull(companies.verifiedAt)),
    ]);
    return {
      companies: c.n,
      resources: r.n,
      counties: COUNTIES.length,
      verifiedProfiles: v.n,
    };
  } catch (err) {
    console.error("getLandingStats failed:", err);
    return FALLBACK;
  }
});
