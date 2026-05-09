"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Chip } from "@/components/brand";
import { sectorChipClass, sectorDisplayName } from "@/lib/sectors";
import { stageDisplayName } from "@/lib/stages";
import type { CompanyListItem } from "@/lib/companies-list";
import { cn } from "@/lib/utils";

type Props = {
  companies: CompanyListItem[];
  total: number;
  loading: boolean;
  onSelect: (slug: string) => void;
  selectedSlug: string | null;
};

export function CompanyList({
  companies,
  total,
  loading,
  onSelect,
  selectedSlug,
}: Props) {
  const searchParams = useSearchParams();

  const sorted = useMemo(
    () =>
      [...companies].sort((a, b) =>
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
      ),
    [companies],
  );

  const mapHref = useMemo(() => {
    const p = new URLSearchParams(searchParams);
    p.delete("view");
    const qs = p.toString();
    return qs ? `/map?${qs}` : "/map";
  }, [searchParams]);

  return (
    <div className="absolute inset-0 overflow-y-auto bg-paper">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 pb-6 pt-16 sm:px-6 lg:pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {loading
              ? "loading…"
              : `Showing ${sorted.length}${
                  total > sorted.length ? ` of ${total}` : ""
                } compan${sorted.length === 1 ? "y" : "ies"}`}
          </p>
          <Link
            href={mapHref}
            className="font-mono text-[11px] uppercase tracking-wider text-ink-3 underline-offset-4 hover:underline"
          >
            Open in map view →
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((c) => (
            <li key={c.id}>
              <CompanyCard
                company={c}
                selected={c.slug === selectedSlug}
                onSelect={() => onSelect(c.slug)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CompanyCard({
  company,
  selected,
  onSelect,
}: {
  company: CompanyListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const place =
    [company.city, company.county && `${company.county} County`]
      .filter(Boolean)
      .join(", ") || null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex h-full min-h-[44px] w-full flex-col gap-3 rounded-tile border-[1.5px] bg-paper-2 p-4 text-left shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-sky",
        selected ? "border-sky" : "border-ink/15",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-tile border-[1.5px] border-ink/15 bg-paper">
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-serif text-base text-ink-3">
              {company.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-base leading-tight">
            {company.name}
          </h3>
          {place ? (
            <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-ink-3">
              {place}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {company.sector ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-pill border-[1.5px] border-ink/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
              sectorChipClass(company.sector),
            )}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "currentColor" }}
            />
            {sectorDisplayName(company.sector)}
          </span>
        ) : null}
        {company.stage ? (
          <Chip tone="stone" size="sm">
            {stageDisplayName(company.stage)}
          </Chip>
        ) : null}
        {company.hiring_status ? (
          <Chip tone="ember-tint" size="sm">
            hiring
          </Chip>
        ) : null}
      </div>

      {company.summary ? (
        <p className="line-clamp-3 text-sm leading-snug text-ink-2">
          {company.summary}
        </p>
      ) : null}

      {company.employee_count ? (
        <p className="mt-auto font-mono text-[10px] uppercase tracking-wider text-ink-3">
          {company.employee_count} employees
        </p>
      ) : null}
    </button>
  );
}
