"use client";

import { cn } from "@/lib/utils";
import type { MapFacets, MapFilters } from "./types";

type Props = {
  facets: MapFacets;
  value: MapFilters;
  onChange: (next: MapFilters) => void;
  total: number;
  loading: boolean;
  onOpenBrief: () => void;
  briefOpen: boolean;
};

export function FilterBar({
  facets,
  value,
  onChange,
  total,
  loading,
  onOpenBrief,
  briefOpen,
}: Props) {
  const hasFilters =
    !!value.sector ||
    !!value.stage ||
    !!value.county ||
    !!value.hiring ||
    value.q.trim().length > 0;

  return (
    <div className="pointer-events-auto absolute left-3 right-3 top-3 z-20 sm:left-4 sm:right-auto sm:max-w-[min(94vw,920px)]">
      <div className="rounded-tile border-[1.5px] border-ink bg-paper-2/95 p-2 shadow-sketch backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <SelectChip
            label="Sector"
            value={value.sector}
            options={facets.sectors}
            onChange={(v) => onChange({ ...value, sector: v })}
          />
          <SelectChip
            label="Stage"
            value={value.stage}
            options={facets.stages}
            onChange={(v) => onChange({ ...value, stage: v })}
          />
          <SelectChip
            label="County"
            value={value.county}
            options={facets.counties}
            onChange={(v) => onChange({ ...value, county: v })}
          />
          <ToggleChip
            label="Hiring"
            active={value.hiring === "true"}
            onClick={() =>
              onChange({
                ...value,
                hiring: value.hiring === "true" ? null : "true",
              })
            }
          />
          <input
            type="search"
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            placeholder="Search company or sector"
            className="min-w-0 flex-1 basis-[160px] rounded-pill border-[1.5px] border-topo bg-paper px-3 py-1.5 text-sm placeholder:text-ink-3 focus:border-ink focus:outline-none"
            aria-label="Search companies"
          />
          <button
            type="button"
            onClick={onOpenBrief}
            className={cn(
              "inline-flex min-h-9 items-center gap-1 rounded-pill border-[1.5px] border-ember px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5",
              briefOpen
                ? "bg-paper-2 text-ember"
                : "bg-ember text-paper",
            )}
          >
            ↓ Investor brief
          </button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          <span>
            {loading ? "Loading…" : `${total} compan${total === 1 ? "y" : "ies"}`}
            {hasFilters ? " · filtered" : ""}
          </span>
          {hasFilters ? (
            <button
              type="button"
              onClick={() =>
                onChange({
                  sector: null,
                  stage: null,
                  county: null,
                  hiring: null,
                  q: "",
                })
              }
              className="text-ember transition hover:text-ink"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SelectChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border-[1.5px] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition",
        value
          ? "border-ink bg-ink text-paper"
          : "border-topo bg-paper text-ink-2 hover:border-ink",
      )}
    >
      <span className="opacity-70">{label}:</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="cursor-pointer appearance-none border-0 bg-transparent pr-3 text-[11px] uppercase tracking-wider text-inherit focus:outline-none"
        aria-label={`${label} filter`}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-pill border-[1.5px] px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition",
        active
          ? "border-sage bg-sage text-paper"
          : "border-topo bg-paper text-ink-2 hover:border-ink",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
