"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Chip } from "@/components/brand";
import { colorForSector } from "./sector-colors";
import type { CompanyListItem } from "./types";

type Props = {
  company: CompanyListItem | null;
  onClose: () => void;
};

export function ProfileDrawer({ company, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!company) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [company, onClose]);

  if (!company) return null;

  const location = [company.city, company.county && `${company.county} County`]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {/* Backdrop only on mobile */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-ink/30 md:hidden"
      />
      <aside
        className="
          fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-tile border-t-[1.5px] border-ink bg-paper-2 shadow-sketch
          md:bottom-0 md:left-auto md:right-0 md:top-[68px] md:max-h-none md:w-[380px] md:rounded-none md:border-l-[1.5px] md:border-t-0
        "
        role="dialog"
        aria-label={`${company.name} preview`}
      >
        <div className="md:hidden">
          <div
            aria-hidden
            className="mx-auto mt-2 h-1 w-12 rounded-full bg-topo"
          />
        </div>
        <div className="flex items-start gap-3 p-5">
          <div
            aria-hidden
            className="grid h-12 w-12 shrink-0 place-items-center rounded-tile border-[1.5px] border-ink bg-paper font-serif text-xl"
            style={{ backgroundColor: colorForSector(company.sector) + "22" }}
          >
            {(company.name.trim()[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {company.sector ? (
                <Chip tone="ember-tint" size="sm">
                  {company.sector}
                </Chip>
              ) : null}
              {company.stage ? (
                <Chip tone="stone" size="sm">
                  {company.stage}
                </Chip>
              ) : null}
              {company.hiring_status ? (
                <Chip tone="sage-tint" size="sm">
                  Hiring
                </Chip>
              ) : null}
            </div>
            <h2 className="mt-1 font-serif text-2xl leading-tight">
              {company.name}
            </h2>
            {location ? (
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
                📍 {location}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-ink bg-paper-2 text-lg leading-none transition hover:-translate-y-0.5"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {company.summary ? (
          <p className="mx-5 text-sm leading-relaxed text-ink-2">
            {company.summary}
          </p>
        ) : null}

        <div className="mt-5 grid gap-2 px-5 pb-6">
          <Link
            href={`/startups/${company.slug}`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-pill border-[1.5px] border-ember bg-ember px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
          >
            View profile →
          </Link>
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-pill border-[1.5px] border-ink bg-paper-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
            >
              Website ↗
            </a>
          ) : null}
        </div>

        <div className="border-t border-topo bg-paper px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          <span className="block">Agent card</span>
          <div className="mt-1 grid gap-1 break-all">
            <a
              href={`/startups/${company.slug}/route.md`}
              className="text-ember transition hover:text-ink"
            >
              /startups/{company.slug}/route.md ↗
            </a>
            <a
              href={`/api/v1/companies/${company.slug}`}
              className="text-ember transition hover:text-ink"
            >
              /api/v1/companies/{company.slug} ↗
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
