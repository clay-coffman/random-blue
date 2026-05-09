"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScribbleDivider } from "@/components/brand";
import { SECTOR_REGISTRY } from "@/lib/sectors";
import { STAGE_VALUES } from "@/lib/stages";
import { BUCKET_PRESETS } from "@/lib/employee-bucket";
import type { CompanyListItem } from "@/lib/companies-list";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { SaveSearchModal } from "./SaveSearchModal";

const STAGES = STAGE_VALUES;

const COUNTIES = [
  "Beaver",
  "Box Elder",
  "Cache",
  "Carbon",
  "Daggett",
  "Davis",
  "Duchesne",
  "Emery",
  "Garfield",
  "Grand",
  "Iron",
  "Juab",
  "Kane",
  "Millard",
  "Morgan",
  "Piute",
  "Rich",
  "Salt Lake",
  "San Juan",
  "Sanpete",
  "Sevier",
  "Summit",
  "Tooele",
  "Uintah",
  "Utah",
  "Wasatch",
  "Washington",
  "Wayne",
  "Weber",
];

type Props = {
  totalMatch: number;
  loading: boolean;
  companies: CompanyListItem[];
};

export function FilterSidebar({ totalMatch, loading }: Props) {
  // Mobile collapses the sidebar into a single button.
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-r-[1.5px] border-ink/15 bg-paper-2 px-4 py-5 lg:block">
        <FilterControls totalMatch={totalMatch} loading={loading} />
      </aside>

      {/* Mobile floating button + dialog */}
      <div className="absolute left-3 top-3 z-20 lg:hidden">
        <Dialog>
          <DialogTrigger
            render={
              <button
                type="button"
                className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper px-3 font-mono text-[11px] uppercase tracking-wider shadow-sketch transition hover:-translate-y-0.5"
              >
                Filters · {totalMatch}
              </button>
            }
          />
          <DialogContent
            showCloseButton
            className="left-1/2 top-4 max-h-[85vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 translate-y-0 overflow-y-auto bg-paper-2 p-5"
          >
            <FilterControls totalMatch={totalMatch} loading={loading} />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function FilterControls({
  totalMatch,
  loading,
}: {
  totalMatch: number;
  loading: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const signedIn = !!session.data?.user;

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // Re-sync local search when URL changes.
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Debounced URL write for the free-text search.
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const trimmed = search.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      if (params.toString() === searchParams.toString()) return;
      router.replace(`/map?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchParams, router]);

  const writeParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
      router.replace(`/map?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const selectedSectors = useMemo(() => {
    const v =
      searchParams.get("sectors") ?? searchParams.get("sector") ?? "";
    if (!v) return new Set<string>();
    return new Set(v.split(",").map((s) => s.trim()).filter(Boolean));
  }, [searchParams]);

  function toggleSector(csv: string) {
    const next = new Set(selectedSectors);
    if (next.has(csv)) next.delete(csv);
    else next.add(csv);
    const params = new URLSearchParams(searchParams);
    params.delete("sector");
    params.delete("sectors");
    if (next.size === 1) params.set("sector", [...next][0]!);
    else if (next.size > 1) params.set("sectors", [...next].join(","));
    router.replace(`/map?${params.toString()}`, { scroll: false });
  }

  // Distinct sectors (collapse marketplace/consumer dupes by key).
  const distinctSectors = useMemo(() => {
    const seen = new Set<string>();
    return SECTOR_REGISTRY.filter((s) => {
      if (seen.has(s.csv)) return false;
      seen.add(s.csv);
      return true;
    });
  }, []);

  const stage = searchParams.get("stage") ?? "";
  const county = searchParams.get("county") ?? "";
  const bucket = searchParams.get("employee_bucket") ?? "";
  const hiring = searchParams.get("hiring_status");

  function clearAll() {
    router.replace("/map", { scroll: false });
  }

  const anyFilter =
    selectedSectors.size > 0 ||
    stage ||
    county ||
    bucket ||
    hiring != null ||
    search ||
    searchParams.get("min_employees") ||
    searchParams.get("max_employees");

  // Project the current URL filters into a flat record for the
  // saved-search payload. Strip view/camera/brief — same logic as
  // EcosystemMapShell's apiQuery, kept inline because passing
  // searchParams down is enough.
  const filtersForSave = (() => {
    const out: Record<string, string> = {};
    for (const [k, v] of searchParams.entries()) {
      if (["view", "lat", "lng", "zoom", "brief"].includes(k)) continue;
      out[k] = v;
    }
    return out;
  })();
  const defaultName = (() => {
    const parts: string[] = [];
    if (selectedSectors.size > 0) parts.push([...selectedSectors].join("/"));
    if (stage) parts.push(stage);
    if (county) parts.push(`${county} County`);
    if (hiring === "true") parts.push("hiring");
    if (parts.length === 0) return "";
    return parts.join(" · ").slice(0, 80);
  })();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
          Filters
        </p>
        <p className="mt-1 font-serif text-lg leading-snug">
          {loading
            ? "Loading…"
            : `${totalMatch} compan${totalMatch === 1 ? "y" : "ies"} match`}
        </p>
        {anyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className="mt-1 inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-wider text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
          >
            Clear all
          </button>
        ) : null}
        <div className="mt-3">
          <SaveSearchModal
            filters={filtersForSave}
            defaultName={defaultName}
            signedIn={signedIn}
          />
        </div>
      </div>

      {/* Search */}
      <label className="block">
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Search
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, slug, description…"
          className="h-11 min-h-[44px] w-full rounded-md border-[1.5px] border-ink/30 bg-paper px-3 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ember/30"
        />
      </label>

      <ScribbleDivider width="full" />

      {/* Sector multi-select */}
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Sector
        </p>
        <div className="flex flex-wrap gap-1.5">
          {distinctSectors.map((s) => {
            const active = selectedSectors.has(s.csv);
            return (
              <button
                key={s.csv}
                type="button"
                onClick={() => toggleSector(s.csv)}
                className={cn(
                  "inline-flex h-11 min-h-[44px] items-center gap-1.5 rounded-pill border-[1.5px] px-3 font-mono text-[11px] uppercase tracking-wider transition",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 bg-paper text-ink-2 hover:border-ink/40",
                )}
                aria-pressed={active}
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.hex }}
                />
                {s.display}
              </button>
            );
          })}
        </div>
      </div>

      <ScribbleDivider width="full" />

      {/* Stage */}
      <label className="block">
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Stage
        </span>
        <select
          value={stage}
          onChange={(e) => writeParam("stage", e.target.value || null)}
          className="h-11 min-h-[44px] w-full rounded-md border-[1.5px] border-ink/30 bg-paper px-3 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ember/30"
        >
          <option value="">Any stage</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* County */}
      <label className="block">
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink-3">
          County
        </span>
        <select
          value={county}
          onChange={(e) => writeParam("county", e.target.value || null)}
          className="h-11 min-h-[44px] w-full rounded-md border-[1.5px] border-ink/30 bg-paper px-3 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ember/30"
        >
          <option value="">Any county</option>
          {COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Employee bucket */}
      <label className="block">
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Team size
        </span>
        <select
          value={bucket}
          onChange={(e) => writeParam("employee_bucket", e.target.value || null)}
          className="h-11 min-h-[44px] w-full rounded-md border-[1.5px] border-ink/30 bg-paper px-3 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ember/30"
        >
          <option value="">Any size</option>
          {BUCKET_PRESETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      {/* Hiring — wrap in a 44px-tall label so the whole row is the
          tap target (the native click handler routes through the
          label to the checkbox). */}
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-2">
        <input
          type="checkbox"
          checked={hiring === "true"}
          onChange={(e) =>
            writeParam("hiring_status", e.target.checked ? "true" : null)
          }
          className="h-5 w-5 rounded border-ink/40"
        />
        Hiring now
      </label>
    </div>
  );
}
