// Loads all resources + their join rows from D1 into the in-memory shape
// the scoring lib expects. Called once per /recommend request — D1 holds
// only ~213 resources so a full scan is the simplest correct thing.

import { db } from "./db";
import {
  resourceCommunities,
  resourceIndustries,
  resourceLocations,
  resources,
  resourceTopics,
} from "@/db/schema";
import type { ResourceRow } from "./recommend";

export async function loadAllResourceRows(): Promise<ResourceRow[]> {
  const d = db();

  const [allResources, allLocs, allInds, allComs, allTops] = await Promise.all([
    d.select().from(resources),
    d.select().from(resourceLocations),
    d.select().from(resourceIndustries),
    d.select().from(resourceCommunities),
    d.select().from(resourceTopics),
  ]);

  const byId = new Map<string, ResourceRow>();
  for (const r of allResources) {
    byId.set(r.id, {
      id: r.id,
      title: r.title,
      description: r.description,
      sourceUrl: r.sourceUrl,
      contactEmail: r.contactEmail,
      kind: r.kind,
      topics: [],
      industries: [],
      communities: [],
      locations: [],
    });
  }

  for (const l of allLocs) {
    const row = byId.get(l.resourceId);
    if (row)
      row.locations.push({
        county: l.county,
        city: l.city,
        statewide: l.statewide,
      });
  }
  for (const i of allInds) {
    const row = byId.get(i.resourceId);
    if (row) row.industries.push(i.industry);
  }
  for (const c of allComs) {
    const row = byId.get(c.resourceId);
    if (row) row.communities.push(c.community);
  }
  for (const t of allTops) {
    const row = byId.get(t.resourceId);
    if (row) row.topics.push(t.topic);
  }

  return Array.from(byId.values());
}
