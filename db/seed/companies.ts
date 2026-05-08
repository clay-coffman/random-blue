import fs from "node:fs";
import Papa from "papaparse";
import { newId } from "../../lib/ids";
import { geocodeFromAddress } from "./centroids";

export type CompanySeed = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  description: string | null;
  sector: string | null;
  stage: string | null;
  employeeCount: string | null;
  linkedin: string | null;
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  city: string | null;
  county: string | null;
};

// Header column names — note the exact strings (incl. trailing spaces).
const COL_NAME = "Startup Name ";
const COL_EMP = "# of Employees ";
const COL_LINKEDIN = "LinkedIn Link (map it to Links to get the logo)";

type CompanyRow = {
  "Display Type"?: string;
  [COL_LINKEDIN]?: string;
  [COL_NAME]?: string;
  "Full Address"?: string;
  "Description of startup"?: string;
  Website?: string;
  Stage?: string;
  [COL_EMP]?: string;
  Section?: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeUrl(raw: string | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function loadCompanies(csvPath: string): CompanySeed[] {
  const csv = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<CompanyRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const seen = new Map<string, number>();
  const seeds: CompanySeed[] = [];

  for (const row of parsed.data) {
    const name = (row[COL_NAME] ?? "").trim();
    if (!name) continue;

    let slug = slugify(name);
    if (!slug) continue;
    const count = seen.get(slug) ?? 0;
    if (count > 0) slug = `${slug}-${count + 1}`;
    seen.set(slugify(name), count + 1);

    const address = (row["Full Address"] ?? "").trim() || null;
    const geo = geocodeFromAddress(address);

    seeds.push({
      id: newId("co"),
      slug,
      name,
      website: normalizeUrl(row.Website),
      description: (row["Description of startup"] ?? "").trim() || null,
      sector: (row.Section ?? "").trim() || null,
      stage: (row.Stage ?? "").trim().toLowerCase() || null,
      employeeCount: (row[COL_EMP] ?? "").trim() || null,
      linkedin: (row[COL_LINKEDIN] ?? "").trim() || null,
      addressText: address,
      lat: geo.lat,
      lng: geo.lng,
      city: geo.city,
      county: geo.county,
    });
  }

  return seeds;
}
