"use client";

import { useEffect, useMemo, useState } from "react";
import { EcosystemMap } from "./EcosystemMap";
import { FilterBar } from "./FilterBar";
import { InvestorBrief } from "./InvestorBrief";
import { ProfileDrawer } from "./ProfileDrawer";
import {
  EMPTY_FILTERS,
  filtersToQuery,
  type CompaniesListResponse,
  type CompanyListItem,
  type MapFacets,
  type MapFilters,
} from "./types";

type Props = {
  initial: CompaniesListResponse;
  facets: MapFacets;
};

export function MapView({ initial, facets }: Props) {
  const [filters, setFilters] = useState<MapFilters>(EMPTY_FILTERS);
  const [companies, setCompanies] = useState<CompanyListItem[]>(
    initial.companies,
  );
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // Refetch when filters change (skip the initial render).
  useEffect(() => {
    const isEmpty =
      !filters.sector &&
      !filters.stage &&
      !filters.county &&
      !filters.hiring &&
      filters.q.trim().length === 0;
    if (isEmpty && companies.length === initial.companies.length) {
      // No filter applied and we already have the unfiltered set.
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/companies${filtersToQuery(filters)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as CompaniesListResponse;
      })
      .then((res) => {
        if (cancelled) return;
        setCompanies(res.companies);
        setTotal(res.total);
        // If selection no longer matches, clear it.
        setSelectedSlug((s) =>
          s && res.companies.some((c) => c.slug === s) ? s : null,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCompanies([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sector, filters.stage, filters.county, filters.hiring, filters.q]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.slug === selectedSlug) ?? null,
    [companies, selectedSlug],
  );

  return (
    <div
      className="relative w-full overflow-hidden bg-paper"
      style={{ height: "calc(100vh - 65px)", minHeight: "560px" }}
    >
      <EcosystemMap
        companies={companies}
        selectedSlug={selectedSlug}
        onSelect={(slug) => {
          setSelectedSlug(slug);
          setBriefOpen(false);
        }}
      />
      <FilterBar
        facets={facets}
        value={filters}
        onChange={setFilters}
        total={total}
        loading={loading}
        briefOpen={briefOpen}
        onOpenBrief={() => {
          setBriefOpen((b) => !b);
          if (!briefOpen) setSelectedSlug(null);
        }}
      />
      <ProfileDrawer
        company={selectedCompany}
        onClose={() => setSelectedSlug(null)}
      />
      <InvestorBrief
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        filters={filters}
        companies={companies}
      />
    </div>
  );
}
