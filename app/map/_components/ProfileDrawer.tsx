"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tile, Chip } from "@/components/brand";
import { sectorChipClass, sectorDisplayName } from "@/lib/sectors";
import { cn } from "@/lib/utils";
import type { CompanyCard } from "@/lib/company-card";

type Props = {
  slug: string | null;
  onClose: () => void;
};

export function ProfileDrawer({ slug, onClose }: Props) {
  const [card, setCard] = useState<CompanyCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumping `retryNonce` re-runs the fetch effect for the same slug —
  // gives the Retry button a way to re-trigger without changing the
  // slug or unmounting the drawer.
  const [retryNonce, setRetryNonce] = useState(0);

  // Fetch on slug change or retry.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setCard(null);
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/v1/companies/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as CompanyCard;
        if (cancelled) return;
        setCard(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message ?? "load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, retryNonce]);

  // Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (slug) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slug, onClose]);

  const open = slug != null;

  return (
    <>
      {/* Mobile backdrop */}
      {open ? (
        <button
          type="button"
          aria-label="Close drawer"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
        />
      ) : null}
      <aside
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-tile border-t-[1.5px] border-ink/30 bg-paper shadow-sketch transition-transform duration-300 ease-out",
          "translate-y-full data-[open=true]:translate-y-0",
          // Desktop = side panel
          "sm:inset-y-0 sm:bottom-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-l-tile sm:rounded-tr-none sm:border-l-[1.5px] sm:border-t-0 sm:translate-y-0 sm:translate-x-full sm:data-[open=true]:translate-x-0",
        )}
      >
        {/* Drag-handle (mobile only) */}
        <div className="mx-auto h-1.5 w-12 rounded-pill bg-ink/20 sm:hidden" />

        <div className="px-5 pb-6 pt-3 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
              {loading ? "loading…" : "company"}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 min-h-[44px] items-center rounded-pill border-[1.5px] border-ink/30 bg-paper-2 px-3 font-mono text-[11px] uppercase tracking-wider transition hover:bg-paper"
              aria-label="Close drawer"
            >
              Close
            </button>
          </div>

          {error ? (
            <Tile variant="subtle" shadow="none" className="mt-4 p-4">
              <p className="text-sm text-ink-2">
                Couldn&apos;t load this company.
              </p>
              <button
                type="button"
                className="mt-2 inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-wider text-ember underline-offset-2 hover:underline"
                onClick={() => setRetryNonce((n) => n + 1)}
              >
                ↻ Retry
              </button>
            </Tile>
          ) : loading || !card ? (
            <DrawerSkeleton />
          ) : (
            <DrawerContent card={card} />
          )}
        </div>
      </aside>
    </>
  );
}

function DrawerSkeleton() {
  return (
    <div className="mt-4 animate-pulse space-y-3">
      <div className="h-8 w-3/4 rounded bg-paper-2" />
      <div className="h-5 w-1/2 rounded bg-paper-2" />
      <div className="mt-4 h-20 w-full rounded bg-paper-2" />
      <div className="h-4 w-full rounded bg-paper-2" />
      <div className="h-4 w-5/6 rounded bg-paper-2" />
    </div>
  );
}

function DrawerContent({ card }: { card: CompanyCard }) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
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
          <Chip tone="ember-tint">
            hiring{card.jobs.length > 0 ? ` · ${card.jobs.length}` : ""}
          </Chip>
        ) : null}
        {card.verification.status === "verified" ? (
          <Chip tone="sage-tint">verified</Chip>
        ) : null}
      </div>

      <h2 className="font-serif text-2xl leading-tight">{card.name}</h2>
      {card.what_they_sell ? (
        <p className="text-sm text-ink-2">{card.what_they_sell}</p>
      ) : null}

      <div className="space-y-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
        {card.city || card.county ? (
          <p>
            {[card.city, card.county && `${card.county} County`]
              .filter(Boolean)
              .join(", ")}
          </p>
        ) : null}
        {card.employee_count ? <p>{card.employee_count} employees</p> : null}
      </div>

      {card.description ? (
        <p className="font-serif text-base leading-relaxed text-ink-2">
          {card.description.length > 280
            ? card.description.slice(0, 280) + "…"
            : card.description}
        </p>
      ) : null}

      {card.jobs.length > 0 ? (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            Open roles ({card.jobs.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {card.jobs.slice(0, 3).map((j, i) => (
              <li key={i} className="text-sm text-ink-2">
                · {j.title}
              </li>
            ))}
            {card.jobs.length > 3 ? (
              <li className="text-xs text-ink-3">
                + {card.jobs.length - 3} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 pt-2">
        <Link
          href={`/startups/${card.slug}`}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
        >
          View profile →
        </Link>
        {card.website ? (
          <a
            href={card.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink/30 bg-paper-2 px-4 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
          >
            ↗ Visit website
          </a>
        ) : null}
      </div>
    </div>
  );
}
