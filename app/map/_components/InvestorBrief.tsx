"use client";

import { useEffect, useState } from "react";
import type { CompanyListItem, MapFilters } from "./types";

type Cluster = {
  title: string;
  count: number;
  slugs: string[];
  summary: string;
};

type BriefResponse = {
  filter_summary: string;
  total_in_view: number;
  clusters: Cluster[];
  hiring_summary?: string | null;
  degraded?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  filters: MapFilters;
  companies: CompanyListItem[];
};

export function InvestorBrief({ open, onClose, filters, companies }: Props) {
  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const slugs = companies.map((c) => c.slug).slice(0, 80);
    fetch("/api/v1/companies/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter: filters, slugs }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as BriefResponse;
      })
      .then((b) => {
        if (!cancelled) setData(b);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-run when the panel opens or the visible set changes meaningfully.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companies.length, filters.sector, filters.stage, filters.county, filters.hiring, filters.q]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close investor brief"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-ink/30 md:hidden"
      />
      <aside
        className="
          fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-tile border-t-[1.5px] border-ink bg-paper-2 shadow-sketch
          md:bottom-0 md:left-auto md:right-0 md:top-[68px] md:max-h-none md:w-[380px] md:rounded-none md:border-l-[1.5px] md:border-t-0
        "
        role="dialog"
        aria-label="Investor brief"
      >
        <header className="flex items-center justify-between border-b-[1.5px] border-ink bg-ink px-5 py-3 text-paper">
          <span className="font-mono text-[11px] uppercase tracking-wider">
            ↓ Investor brief
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-paper/40 text-lg leading-none transition hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="space-y-4 p-5">
          {loading ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
              Reading the cluster…
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-danger/40 bg-paper p-3 text-sm text-danger">
              Couldn&apos;t generate a brief right now. Try again in a moment.
            </p>
          ) : null}
          {data ? (
            <>
              <div>
                <h2 className="font-serif text-xl leading-snug text-ink">
                  {data.filter_summary}
                </h2>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
                  {data.total_in_view} compan
                  {data.total_in_view === 1 ? "y" : "ies"} in view
                </div>
              </div>

              {data.degraded ? (
                <p className="rounded-md border border-topo bg-paper p-2 text-xs text-ink-3">
                  Brief generation degraded — showing what we have.
                </p>
              ) : null}

              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  Cluster themes
                </h3>
                <ul className="mt-2 space-y-3">
                  {data.clusters.length === 0 ? (
                    <li className="text-sm text-ink-3">
                      No themes — try widening the filter.
                    </li>
                  ) : null}
                  {data.clusters.map((c, i) => (
                    <li
                      key={i}
                      className="rounded-tile border border-topo bg-paper p-3"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-serif text-base text-ink">
                          {c.title}
                        </span>
                        <span className="rounded-pill border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper">
                          {c.count}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-2">{c.summary}</p>
                      {c.slugs.length ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                          {c.slugs.slice(0, 6).map((s) => (
                            <a
                              key={s}
                              href={`/startups/${s}`}
                              className="rounded-pill border border-topo bg-paper-2 px-2 py-0.5 text-ember transition hover:border-ink hover:text-ink"
                            >
                              {s}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>

              {data.hiring_summary ? (
                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                    Hiring
                  </h3>
                  <p className="mt-1 text-sm text-ink-2">{data.hiring_summary}</p>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
