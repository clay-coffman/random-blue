// Server-side helpers for the four resource affinity join tables. These
// columns drive matching in lib/recommend.ts; the editor surface needs
// the same shape the seed loader produces (db/seed/resources.ts):
//
//   - industries / communities / topics: lowercase, trimmed, deduped
//   - counties: title-case canonical form (matches countyCentroids keys),
//     case-insensitive on read, drop unknown values
//   - statewide: a single-row {county:null, city:null, statewide:true}
//
// City editing is intentionally not supported here. The seed loader
// never populates city, so the corpus has nothing to lose; if a future
// loader sets city, replaceResourceAffinities will erase it on save.

import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  resourceCommunities,
  resourceIndustries,
  resourceLocations,
  resourceTopics,
} from "@/db/schema";
import { countyCentroids } from "@/db/seed/centroids";

export const CANONICAL_COUNTIES = Object.keys(countyCentroids).sort();

export type ResourceAffinities = {
  industries: string[];
  communities: string[];
  topics: string[];
  counties: string[];
  statewide: boolean;
};

export type ResourceAffinitySuggestions = {
  industries: string[];
  communities: string[];
  topics: string[];
};

const COUNTY_BY_LOWER = new Map(
  CANONICAL_COUNTIES.map((c) => [c.toLowerCase(), c]),
);

const dedupe = (xs: string[]): string[] => Array.from(new Set(xs));

const cleanLower = (xs: unknown[]): string[] =>
  dedupe(
    xs
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );

const cleanCounties = (xs: unknown[]): string[] =>
  dedupe(
    xs
      .filter((x): x is string => typeof x === "string")
      .map((x) => COUNTY_BY_LOWER.get(x.trim().toLowerCase()))
      .filter((x): x is string => Boolean(x)),
  );

export async function loadResourceAffinities(
  resourceId: string,
): Promise<ResourceAffinities> {
  const d = db();
  const [inds, coms, tops, locs] = await Promise.all([
    d
      .select({ v: resourceIndustries.industry })
      .from(resourceIndustries)
      .where(eq(resourceIndustries.resourceId, resourceId)),
    d
      .select({ v: resourceCommunities.community })
      .from(resourceCommunities)
      .where(eq(resourceCommunities.resourceId, resourceId)),
    d
      .select({ v: resourceTopics.topic })
      .from(resourceTopics)
      .where(eq(resourceTopics.resourceId, resourceId)),
    d
      .select({
        county: resourceLocations.county,
        statewide: resourceLocations.statewide,
      })
      .from(resourceLocations)
      .where(eq(resourceLocations.resourceId, resourceId)),
  ]);

  const statewide = locs.some((l) => l.statewide);
  const counties = statewide
    ? []
    : dedupe(
        locs
          .map((l) => l.county)
          .filter((c): c is string => Boolean(c))
          .map((c) => COUNTY_BY_LOWER.get(c.toLowerCase()) ?? c),
      ).sort();

  return {
    industries: inds.map((r) => r.v).sort(),
    communities: coms.map((r) => r.v).sort(),
    topics: tops.map((r) => r.v).sort(),
    counties,
    statewide,
  };
}

export async function loadAffinitySuggestions(): Promise<ResourceAffinitySuggestions> {
  const d = db();
  const [inds, coms, tops] = await Promise.all([
    d
      .select({ v: resourceIndustries.industry })
      .from(resourceIndustries)
      .groupBy(resourceIndustries.industry)
      .orderBy(sql`LOWER(${resourceIndustries.industry})`),
    d
      .select({ v: resourceCommunities.community })
      .from(resourceCommunities)
      .groupBy(resourceCommunities.community)
      .orderBy(sql`LOWER(${resourceCommunities.community})`),
    d
      .select({ v: resourceTopics.topic })
      .from(resourceTopics)
      .groupBy(resourceTopics.topic)
      .orderBy(sql`LOWER(${resourceTopics.topic})`),
  ]);
  return {
    industries: inds.map((r) => r.v),
    communities: coms.map((r) => r.v),
    topics: tops.map((r) => r.v),
  };
}

export type ResourceAffinitiesPatch = Partial<{
  industries: string[];
  communities: string[];
  topics: string[];
  counties: string[];
  statewide: boolean;
}>;

// Diff-style replace: only touch the join tables whose keys appear in
// the patch. A save that only changes `title` should not nuke topics.
//
// Locations replace as a unit: counties + statewide together describe
// the location set, so passing either replaces both. (Statewide=true
// collapses to a single null-county row; otherwise one row per county.)
export async function replaceResourceAffinities(
  resourceId: string,
  patch: ResourceAffinitiesPatch,
): Promise<void> {
  const d = db();

  if (patch.industries !== undefined) {
    const values = cleanLower(patch.industries);
    await d
      .delete(resourceIndustries)
      .where(eq(resourceIndustries.resourceId, resourceId));
    if (values.length > 0) {
      await d
        .insert(resourceIndustries)
        .values(values.map((industry) => ({ resourceId, industry })));
    }
  }

  if (patch.communities !== undefined) {
    const values = cleanLower(patch.communities);
    await d
      .delete(resourceCommunities)
      .where(eq(resourceCommunities.resourceId, resourceId));
    if (values.length > 0) {
      await d
        .insert(resourceCommunities)
        .values(values.map((community) => ({ resourceId, community })));
    }
  }

  if (patch.topics !== undefined) {
    const values = cleanLower(patch.topics);
    await d
      .delete(resourceTopics)
      .where(eq(resourceTopics.resourceId, resourceId));
    if (values.length > 0) {
      await d
        .insert(resourceTopics)
        .values(values.map((topic) => ({ resourceId, topic })));
    }
  }

  // Locations replace fires when EITHER counties or statewide is in
  // the patch — the two together describe the same dimension.
  if (patch.counties !== undefined || patch.statewide !== undefined) {
    const statewide = Boolean(patch.statewide);
    const counties = statewide ? [] : cleanCounties(patch.counties ?? []);
    await d
      .delete(resourceLocations)
      .where(eq(resourceLocations.resourceId, resourceId));
    if (statewide) {
      await d.insert(resourceLocations).values({
        resourceId,
        county: null,
        city: null,
        statewide: true,
      });
    } else if (counties.length > 0) {
      await d
        .insert(resourceLocations)
        .values(
          counties.map((county) => ({
            resourceId,
            county,
            city: null,
            statewide: false,
          })),
        );
    }
  }
}
