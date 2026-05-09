"use client";

import { useEffect, useState } from "react";
import { Tile } from "@/components/brand";
import type { CompanyListItem } from "@/lib/companies-list";
import { cn } from "@/lib/utils";

type Theme = { title: string; slugs: string[]; summary: string };
type BriefResponse = {
  headline?: string | null;
  metadata?: string | null;
  themes: Theme[];
  notable_raises?: Array<{ slug: string; amount: string; date: string | null }>;
  hiring?: { open_roles: number; top_hirers: string[] } | null;
  degraded?: boolean;
};

type Props = {
  companies: CompanyListItem[];
  filters: Record<string, string>;
  open: boolean;
  onClose: () => void;
};

export function InvestorBrief({ companies, filters, open, onClose }: Props) {
  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-fetch when the panel opens or the filtered set changes shape.
  // Use the filtered slugs as the cache key so a different set always
  // refreshes.
  const slugsKey = companies.map((c) => c.slug).join(",");

  useEffect(() => {
    if (!open) return;
    if (companies.length === 0) {
      setData({ themes: [], degraded: true });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/v1/companies/investor-brief", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            filter: filters,
            slugs: companies.map((c) => c.slug).slice(0, 80),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = (await res.json()) as BriefResponse;
        if (cancelled) return;
        setData(d);
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message ?? "fetch failed");
          setData({ themes: [], degraded: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slugsKey]);

  function copySummary() {
    if (!data) return;
    const lines: string[] = [];
    if (data.headline) lines.push(`# ${data.headline}`);
    if (data.metadata) lines.push(`_${data.metadata}_`);
    lines.push("");
    for (const t of data.themes) {
      lines.push(`## ${t.title}`);
      lines.push(t.summary);
      if (t.slugs.length) lines.push(`Companies: ${t.slugs.join(", ")}`);
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n"));
  }

  return (
    <aside
      data-open={open ? "true" : "false"}
      aria-hidden={!open}
      className={cn(
        "fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col overflow-hidden border-l-[1.5px] border-ink/20 bg-ink text-paper transition-transform duration-300",
        "translate-x-full data-[open=true]:translate-x-0",
        "lg:absolute lg:inset-y-0 lg:w-[360px]",
      )}
    >
      <header className="flex items-center justify-between border-b border-paper/15 bg-paper/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember-tint">
            ↓ Investor brief
          </p>
          <kbd className="rounded bg-paper/10 px-1.5 py-0.5 font-mono text-[10px] text-paper/70">
            B
          </kbd>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 min-h-[44px] items-center rounded-pill border-[1.5px] border-paper/30 bg-paper/5 px-3 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:bg-paper/15"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="font-mono text-[11px] uppercase tracking-wider text-paper/60">
            Generating brief…
          </p>
        ) : null}

        {!loading && data?.degraded ? (
          <Tile
            variant="default"
            shadow="none"
            className="border-paper/30 bg-paper/5 p-4 text-paper"
          >
            <p className="font-serif text-lg leading-snug">
              {error
                ? "Couldn't generate a brief just now."
                : companies.length === 0
                  ? "No companies in the current filter."
                  : "Brief unavailable."}
            </p>
            <p className="mt-1 text-xs text-paper/70">
              {error
                ? `Reason: ${error}. Try changing a filter or hit B again to retry.`
                : companies.length === 0
                  ? "Loosen a filter to see clusters."
                  : "Try a tighter filter or hit B again to retry."}
            </p>
          </Tile>
        ) : null}

        {!loading && data && !data.degraded ? (
          <div className="space-y-5">
            {data.headline ? (
              <h2 className="font-serif text-2xl leading-tight">
                {data.headline}
              </h2>
            ) : null}
            {data.metadata ? (
              <p className="font-hand text-base text-paper/80">
                {data.metadata}
              </p>
            ) : null}

            {data.themes.length > 0 ? (
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember-tint">
                  Cluster themes
                </p>
                <ul className="mt-2 space-y-3">
                  {data.themes.map((t, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-paper/15 bg-paper/5 p-3"
                    >
                      <p className="font-serif text-base font-medium leading-snug">
                        {t.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-paper/80">
                        {t.summary}
                      </p>
                      {t.slugs.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t.slugs.map((slug) => (
                            <a
                              key={slug}
                              href={`/startups/${slug}`}
                              className="inline-flex min-h-[44px] items-center rounded-pill bg-paper/10 px-3 font-mono text-[10px] uppercase tracking-wider text-paper hover:bg-paper/20"
                            >
                              {slug}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.notable_raises && data.notable_raises.length > 0 ? (
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember-tint">
                  Notable raises (12 mo)
                </p>
                <ul className="mt-2 space-y-1.5">
                  {data.notable_raises.slice(0, 4).map((r, i) => (
                    <li key={i}>
                      <a
                        href={`/startups/${r.slug}`}
                        className="flex min-h-[44px] items-center justify-between rounded-md border border-paper/15 bg-paper/5 px-3 py-1.5 text-sm transition hover:bg-paper/10"
                      >
                        <span className="font-mono text-[11px] uppercase tracking-wider">
                          {r.slug}
                        </span>
                        <span className="font-serif text-sm">{r.amount}</span>
                      </a>
                    </li>
                  ))}
                  {data.notable_raises.length > 4 ? (
                    <li className="text-xs text-paper/60">
                      + {data.notable_raises.length - 4} more
                    </li>
                  ) : null}
                </ul>
              </section>
            ) : null}

            {data.hiring ? (
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember-tint">
                  Hiring now
                </p>
                <p className="mt-1 font-serif text-base">
                  {data.hiring.open_roles} open role
                  {data.hiring.open_roles === 1 ? "" : "s"}
                  {data.hiring.top_hirers.length > 0
                    ? ` · top hirers: ${data.hiring.top_hirers.slice(0, 3).join(", ")}`
                    : ""}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-paper/15 bg-paper/5 p-3">
        <button
          type="button"
          onClick={copySummary}
          disabled={!data || data.degraded}
          className="inline-flex h-11 min-h-[44px] items-center gap-1 rounded-pill border-[1.5px] border-paper/30 bg-paper/5 px-3 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:bg-paper/15 disabled:opacity-40"
        >
          ↗ Copy summary
        </button>
      </footer>
    </aside>
  );
}
