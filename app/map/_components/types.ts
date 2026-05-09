// Wire-format companies-list row, mirrors `GET /api/v1/companies`.
export type CompanyListItem = {
  id: string;
  slug: string;
  name: string;
  sector: string | null;
  stage: string | null;
  employee_count: string | null;
  hiring_status: boolean;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
  website: string | null;
  summary: string | null;
  county: string | null;
  city: string | null;
};

export type CompaniesListResponse = {
  companies: CompanyListItem[];
  total: number;
};

export type MapFilters = {
  sector: string | null;
  stage: string | null;
  county: string | null;
  hiring: "true" | "false" | null;
  q: string;
};

export const EMPTY_FILTERS: MapFilters = {
  sector: null,
  stage: null,
  county: null,
  hiring: null,
  q: "",
};

export type MapFacets = {
  sectors: string[];
  stages: string[];
  counties: string[];
};

export function filtersToQuery(f: MapFilters): string {
  const p = new URLSearchParams();
  if (f.sector) p.set("sector", f.sector);
  if (f.stage) p.set("stage", f.stage);
  if (f.county) p.set("county", f.county);
  if (f.hiring) p.set("hiring_status", f.hiring);
  if (f.q.trim()) p.set("q", f.q.trim());
  const s = p.toString();
  return s ? `?${s}` : "";
}
