"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CompanyListItem } from "@/lib/companies-list";
import type { CompanyFilters } from "@/lib/company-filters";
import { Tile } from "@/components/brand";
import { FilterSidebar } from "./FilterSidebar";
import { ProfileDrawer } from "./ProfileDrawer";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle";
import { MapControls } from "./MapControls";
import { InvestorBrief } from "./InvestorBrief";
import { SectorLegend } from "./SectorLegend";

// MapLibre WebGL must not run at SSR — load only on the client.
const EcosystemMap = dynamic(
  () => import("./EcosystemMap").then((m) => m.EcosystemMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-paper-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
        loading map…
      </div>
    ),
  },
);

type Camera = { lat: number; lng: number; zoom: number } | null;

type Props = {
  initialCompanies: CompanyListItem[];
  initialTotal: number;
  initialFilters: CompanyFilters;
  initialView: ViewMode;
  initialCamera: Camera;
};

export function EcosystemMapShell({
  initialCompanies,
  initialTotal,
  initialFilters,
  initialView,
  initialCamera,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState(initialCompanies);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // Derive current view + filter from the URL on every render, so filter
  // changes from inside FilterSidebar (which writes to the URL) flow
  // back through this state machine without prop drilling.
  const view: ViewMode = useMemo(() => {
    const v = searchParams.get("view");
    return v === "clusters" || v === "heat" ? v : "companies";
  }, [searchParams]);

  const filtersKey = searchParams.toString();
  const isFirstFetch = useMemo(() => {
    // True when the URL matches the initial server-rendered state.
    return matchesInitial(searchParams, initialFilters, initialView);
  }, [searchParams, initialFilters, initialView]);

  // Re-fetch on filter change. Skip the very first render — the server
  // already gave us initialCompanies for the initial URL.
  useEffect(() => {
    if (isFirstFetch) {
      setCompanies(initialCompanies);
      setTotal(initialTotal);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams(searchParams);
    // Drop view + camera-related keys from the API call — they're
    // client-only.
    params.delete("view");
    params.delete("lat");
    params.delete("lng");
    params.delete("zoom");
    params.delete("brief");
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/v1/companies?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          companies: CompanyListItem[];
          total: number;
        };
        if (cancelled) return;
        setCompanies(data.companies);
        setTotal(data.total);
      } catch (err) {
        if (cancelled) return;
        setLoadError((err as Error).message ?? "fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // Keyboard shortcut "B" toggles the InvestorBrief panel.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "b" && e.key !== "B") return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setBriefOpen((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleViewChange = useCallback(
    (next: ViewMode) => {
      const params = new URLSearchParams(searchParams);
      if (next === "companies") {
        params.delete("view");
      } else {
        params.set("view", next);
      }
      router.replace(`/map?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePinClick = useCallback((slug: string) => {
    setSelectedSlug(slug);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedSlug(null);
  }, []);

  const empty = !loading && companies.length === 0;

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-paper">
      {/* Top bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink/15 bg-paper-2 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-lg font-medium leading-none">
            Utah Startup Map
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {loading
              ? "loading…"
              : `${total} compan${total === 1 ? "y" : "ies"} match`}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ViewModeToggle value={view} onChange={handleViewChange} />
          <button
            type="button"
            onClick={() => setBriefOpen((v) => !v)}
            className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] border-ink bg-ink px-3 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
            aria-pressed={briefOpen}
            title="Toggle investor brief (B)"
          >
            <span aria-hidden>↓</span>
            <span className="hidden sm:inline">Investor brief</span>
            <span className="sm:hidden">Brief</span>
            <kbd className="hidden rounded bg-paper/15 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              B
            </kbd>
          </button>
        </div>
      </header>

      {/* Layout: filter sidebar + map area + (optional) investor brief */}
      <div className="relative flex flex-1 min-h-0">
        {/* Filter sidebar */}
        <FilterSidebar
          totalMatch={total}
          loading={loading}
          companies={companies}
        />

        {/* Map area */}
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0">
            <EcosystemMap
              companies={companies}
              view={view}
              initialCamera={initialCamera}
              onPinClick={handlePinClick}
              selectedSlug={selectedSlug}
            />
          </div>

          <SectorLegend />
          <MapControls />

          {empty ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
              <Tile
                variant="default"
                shadow="sketch"
                className="pointer-events-auto max-w-sm text-center"
              >
                <p className="font-serif text-lg leading-snug">
                  No companies match these filters.
                </p>
                <p className="mt-1 text-sm text-ink-3">
                  Try clearing one or two filter chips. The map shows up to
                  500 companies.
                </p>
                <Link
                  href="/map"
                  className="mt-3 inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink bg-paper-2 px-3 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
                >
                  Clear filters
                </Link>
              </Tile>
            </div>
          ) : null}

          {loadError ? (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
              <Tile
                variant="default"
                shadow="sketch"
                className="pointer-events-auto max-w-md border-ember/60"
              >
                <p className="font-serif text-base">
                  Couldn&apos;t refresh the map.
                </p>
                <p className="mt-1 text-sm text-ink-3">
                  {loadError}. Try changing a filter to retry.
                </p>
              </Tile>
            </div>
          ) : null}
        </div>

        {/* Investor brief sidecar */}
        <InvestorBrief
          companies={companies}
          filters={Object.fromEntries(searchParams.entries())}
          open={briefOpen}
          onClose={() => setBriefOpen(false)}
        />
      </div>

      {/* Profile drawer */}
      <ProfileDrawer slug={selectedSlug} onClose={handleDrawerClose} />
    </div>
  );
}

function matchesInitial(
  current: URLSearchParams,
  initialFilters: CompanyFilters,
  initialView: ViewMode,
): boolean {
  // Server seeded with these — if the URL still reflects them, skip
  // the duplicate fetch on first hydrate.
  const map: Record<string, string | undefined> = {
    sector: initialFilters.sector,
    sectors: initialFilters.sectors,
    stage: initialFilters.stage,
    county: initialFilters.county,
    city: initialFilters.city,
    q: initialFilters.q,
    employee_bucket: initialFilters.employee_bucket,
    min_employees:
      initialFilters.min_employees != null
        ? String(initialFilters.min_employees)
        : undefined,
    max_employees:
      initialFilters.max_employees != null
        ? String(initialFilters.max_employees)
        : undefined,
    hiring_status:
      initialFilters.hiring_status != null
        ? String(initialFilters.hiring_status)
        : undefined,
  };
  for (const [k, v] of Object.entries(map)) {
    const cur = current.get(k);
    if ((cur ?? undefined) !== v) return false;
  }
  // Ignore camera + view; URL drift on those should NOT trigger a re-fetch.
  // We do still want to skip the duplicate fetch if the view matches.
  const curView = current.get("view") ?? "companies";
  return curView === initialView || curView === "" || curView === "companies";
}
