import type { Metadata } from "next";
import { listCompanies } from "@/lib/companies-list";
import { parseFilters, type CompanyFilters } from "@/lib/company-filters";
import { EcosystemMapShell } from "./_components/EcosystemMapShell";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Utah Startup Map — Atlas",
  description:
    "An ecosystem map of every Utah startup. Filter by sector, stage, county, employee size, and hiring. Generate an investor brief on any subset.",
  alternates: {
    canonical: "/map",
  },
  openGraph: {
    title: "Utah Startup Map",
    description:
      "An ecosystem map of every Utah startup. Filter and explore.",
    url: "/map",
    type: "website",
    siteName: "Utah Startup State Atlas",
  },
};

function flatten(sp: SearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) {
      if (v.length > 0 && v[0]) out.set(k, v[0]);
    } else if (v) {
      out.set(k, v);
    }
  }
  return out;
}

type ViewMode = "companies" | "clusters" | "heat" | "list";

function isViewMode(v: unknown): v is ViewMode {
  return (
    v === "companies" || v === "clusters" || v === "heat" || v === "list"
  );
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const params = flatten(sp);
  const { filters: parsedFilters, errors } = parseFilters(params);
  const filters: CompanyFilters = errors ? {} : parsedFilters;

  const initial = await listCompanies(filters, 500);

  const rawView = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const view: ViewMode = isViewMode(rawView) ? rawView : "companies";

  const initialCamera = (() => {
    const lat = Array.isArray(sp.lat) ? sp.lat[0] : sp.lat;
    const lng = Array.isArray(sp.lng) ? sp.lng[0] : sp.lng;
    const zoom = Array.isArray(sp.zoom) ? sp.zoom[0] : sp.zoom;
    if (!lat || !lng || !zoom) return null;
    const parsed = {
      lat: Number(lat),
      lng: Number(lng),
      zoom: Number(zoom),
    };
    if (Object.values(parsed).some((n) => !Number.isFinite(n))) return null;
    return parsed;
  })();

  return (
    <EcosystemMapShell
      initialCompanies={initial.companies}
      initialTotal={initial.total}
      initialFilters={filters}
      initialView={view}
      initialCamera={initialCamera}
    />
  );
}
