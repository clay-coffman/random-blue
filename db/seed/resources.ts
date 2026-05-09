import fs from "node:fs";
import Papa from "papaparse";
import { countyCentroids } from "./centroids";

export type ResourceSeed = {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  kind: string | null;
  contactEmail: string | null;
  locations: { county: string | null; city: string | null; statewide: boolean }[];
  industries: string[];
  communities: string[];
  topics: string[];
};

type ResourceRow = {
  id?: string;
  Title?: string;
  description?: string;
  Communities?: string;
  Industries?: string;
  Locations?: string;
  Topics?: string;
  link?: string;
  email?: string;
};

const ALL_COUNTY_NAMES = new Set(Object.keys(countyCentroids));

const pipeSplit = (s: string | undefined | null): string[] =>
  (s ?? "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

const normalize = (s: string): string => s.trim();

// Topics whose lowercased form is a poor eyebrow on a plan card. The CSV
// orders Topics by upstream convention, not by display priority — when one
// of these is first, falling through to it makes resources read like they're
// categorized for a different purpose than they actually serve.
const KIND_DEPRIORITIZED = new Set<string>(["close or exit a business"]);

export function loadResources(csvPath: string): ResourceSeed[] {
  const csv = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<ResourceRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const seeds: ResourceSeed[] = [];

  for (const row of parsed.data) {
    const upstreamId = (row.id ?? "").toString().trim();
    const title = (row.Title ?? "").trim();
    if (!upstreamId || !title) continue;

    const counties = pipeSplit(row.Locations).map(normalize);
    const isStatewide =
      counties.length >= ALL_COUNTY_NAMES.size &&
      counties.every((c) => ALL_COUNTY_NAMES.has(c));

    const locations: ResourceSeed["locations"] = isStatewide
      ? [{ county: null, city: null, statewide: true }]
      : counties.map((county) => ({ county, city: null, statewide: false }));

    const topics = pipeSplit(row.Topics).map(normalize);
    // `kind` indexes resources by their primary topic. The CSV has no
    // dedicated Kind column, so we collapse the first pipe-separated topic
    // and lowercase it to match the (also-lowercased) `resource_topics.topic`
    // rows, so any join/filter on topic == kind hits the resources_kind_idx.
    // Deprioritize topics that read poorly as the eyebrow on a plan card
    // (e.g. "Close or Exit a Business" was the upstream-first topic for a
    // chunk of GOEO-curated rows like SBDC and StartUp State, which made
    // their plan cards look mis-categorized). Pick the first non-deprioritized
    // topic; fall back to topics[0] only if every topic is deprioritized.
    const loweredTopics = topics.map((t) => t.toLowerCase());
    const kind =
      loweredTopics.find((t) => !KIND_DEPRIORITIZED.has(t)) ??
      loweredTopics[0] ??
      null;

    seeds.push({
      id: `r_${upstreamId}`,
      title,
      description: (row.description ?? "").trim() || null,
      sourceUrl: (row.link ?? "").trim() || null,
      kind,
      contactEmail: (row.email ?? "").trim() || null,
      locations,
      industries: pipeSplit(row.Industries).map((s) => normalize(s).toLowerCase()),
      communities: pipeSplit(row.Communities).map((s) => normalize(s).toLowerCase()),
      topics: topics.map((s) => s.toLowerCase()),
    });
  }

  return seeds;
}
