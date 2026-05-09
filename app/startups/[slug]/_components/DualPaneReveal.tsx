"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Tile, Chip } from "@/components/brand";
import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/tabs";
import { sectorChipClass, sectorDisplayName } from "@/lib/sectors";
import { cn } from "@/lib/utils";
import type { CompanyCard } from "@/lib/company-card";

type FormatTab = "md" | "json" | "api" | "llms";

const TAB_LABELS: Record<FormatTab, string> = {
  md: ".md",
  json: ".json",
  api: "API",
  llms: "llms.txt",
};

function urlFor(slug: string, t: FormatTab): string {
  switch (t) {
    case "md":
      return `/startups/${slug}.md`;
    case "json":
      return `/startups/${slug}.json`;
    case "api":
      return `/api/v1/companies/${slug}`;
    case "llms":
      return "/llms.txt";
  }
}

export function DualPaneReveal({ card }: { card: CompanyCard }) {
  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-20 pt-6 sm:px-7 sm:pt-8">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/startups/${card.slug}`}
            className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] border-ink/30 bg-paper-2 px-3 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
          >
            ← Classic view
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
            Dual-pane reveal
          </p>
        </div>
        <p className="font-hand text-base text-ink-3">
          One source · four formats · same answer.
        </p>
      </div>

      <h1 className="mt-4 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {card.name}
      </h1>

      {/* Two-column reveal */}
      <div className="mt-6 grid gap-0 overflow-hidden rounded-tile border-[1.5px] border-ink shadow-[5px_5px_0_var(--color-ember)] lg:grid-cols-2">
        {/* HUMAN view */}
        <div className="border-b-[1.5px] border-ink bg-paper-2 p-6 lg:border-b-0 lg:border-r-[1.5px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
            ← Human view
          </p>
          <h2 className="mt-2 font-serif text-2xl leading-tight">
            {card.name}
          </h2>
          {card.what_they_sell ? (
            <p className="mt-1 text-sm text-ink-3">{card.what_they_sell}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {card.sector ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-pill border-[1.5px] border-ink/30 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider",
                  sectorChipClass(card.sector),
                )}
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: "currentColor" }}
                />
                {sectorDisplayName(card.sector)}
              </span>
            ) : null}
            {card.stage ? <Chip tone="stone">{card.stage}</Chip> : null}
            {card.hiring_status ? (
              <Chip tone="ember-tint">hiring</Chip>
            ) : null}
            {card.verification.status === "verified" ? (
              <Chip tone="sage-tint">verified</Chip>
            ) : null}
          </div>

          <div className="mt-4 space-y-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {card.city || card.county ? (
              <p>
                {[card.city, card.county && `${card.county} County`]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
            {card.employee_count ? (
              <p>{card.employee_count} employees</p>
            ) : null}
            {card.founding_year ? <p>founded {card.founding_year}</p> : null}
          </div>

          {card.description ? (
            <p className="mt-4 font-serif text-base leading-relaxed text-ink-2">
              {card.description.length > 360
                ? card.description.slice(0, 360) + "…"
                : card.description}
            </p>
          ) : null}

          {card.jobs.length > 0 ? (
            <div className="mt-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
                Open roles ({card.jobs.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {card.jobs.slice(0, 4).map((j, i) => (
                  <li key={i}>
                    <Tile variant="subtle" shadow="none" className="p-2">
                      <p className="font-serif text-sm font-medium leading-snug">
                        {j.title}
                      </p>
                    </Tile>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* AGENT view */}
        <div className="bg-ink p-6 text-paper">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember-tint">
              Agent view →
            </p>
            <p className="font-hand text-sm text-topo">same source.</p>
          </div>

          <AgentTabs card={card} />
        </div>
      </div>

      <p className="mt-6 max-w-2xl font-serif text-base leading-relaxed text-ink-2 sm:mt-8">
        Same source feeds <code className="rounded bg-paper-2 px-1 font-mono text-sm text-ember">.json</code>,{" "}
        <code className="rounded bg-paper-2 px-1 font-mono text-sm text-ember">.md</code>, the API, and{" "}
        <code className="rounded bg-paper-2 px-1 font-mono text-sm text-ember">/llms.txt</code>.
        The owner of {card.name} maintains one verified profile; agents and humans see the same canonical data.
      </p>
    </div>
  );
}

function AgentTabs({ card }: { card: CompanyCard }) {
  const tabs: FormatTab[] = ["md", "json", "api", "llms"];
  const [active, setActive] = useState<FormatTab>("json");
  // The two synchronous formats (json/api) are seeded inline; only
  // the .md and llms.txt formats actually need a network round-trip.
  // The cache lives in a ref so writes don't re-fire the fetch
  // effect (the visible content state is what triggers re-render).
  const cacheRef = useRef<Record<FormatTab, string | null>>({
    md: null,
    json: JSON.stringify(card, null, 2),
    api: JSON.stringify(card, null, 2),
    llms: null,
  });
  const [, forceRender] = useState(0);
  const [loading, setLoading] = useState<FormatTab | null>(null);

  // Lazy-fetch .md / llms.txt the first time their tab is selected.
  // Depends only on `active` + `card.slug` — the ref-cache check
  // gates the fetch without forcing a state re-run on cache writes.
  useEffect(() => {
    if (cacheRef.current[active] != null) return;
    let cancelled = false;
    setLoading(active);
    (async () => {
      try {
        const url = urlFor(card.slug, active);
        const res = await fetch(url);
        const text = await res.text();
        if (cancelled) return;
        cacheRef.current = { ...cacheRef.current, [active]: text };
        forceRender((n) => n + 1);
      } catch {
        if (!cancelled) {
          cacheRef.current = {
            ...cacheRef.current,
            [active]: "(failed to load)",
          };
          forceRender((n) => n + 1);
        }
      } finally {
        if (!cancelled) setLoading(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, card.slug]);

  const content = cacheRef.current;

  return (
    <div className="mt-3">
      <Tabs value={active} onValueChange={(v) => setActive(v as FormatTab)}>
        <TabsList className="border-paper/20 bg-paper/5">
          {tabs.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="data-[selected]:bg-paper data-[selected]:text-ink"
            >
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsPanel key={t} value={t}>
            <div className="overflow-hidden rounded-md border border-paper/15 bg-[#0A1320]">
              <div className="flex items-center justify-between border-b border-paper/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-paper/60">
                <span>{urlFor(card.slug, t)}</span>
                <a
                  href={urlFor(card.slug, t)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ember-tint underline-offset-2 hover:underline"
                >
                  Open ↗
                </a>
              </div>
              <pre className="max-h-[420px] overflow-auto p-3 font-mono text-[11px] leading-relaxed text-paper">
                <code>
                  {loading === t
                    ? "loading…"
                    : (content[t] ?? "").trim() || "(empty)"}
                </code>
              </pre>
            </div>
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}
