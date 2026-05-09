import Link from "next/link";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { Tile, Chip } from "@/components/brand";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import {
  GEO_FOCUS_OPTIONS,
  INVESTOR_TYPE_OPTIONS,
  SECTOR_OPTIONS,
  STAGE_OPTIONS,
} from "@/lib/investor-schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor directory — Utah Startup State Atlas",
  description:
    "Verified Utah-active investors. Public profiles only — direct contact info is redacted; intros flow through GOEO.",
};

type SearchParams = {
  sector?: string;
  stage?: string;
  geo?: string;
  type?: string;
};

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function lookup(
  opts: ReadonlyArray<{ id: string; label: string }>,
  ids: string[],
): string[] {
  return ids.map((id) => opts.find((o) => o.id === id)?.label ?? id);
}

export default async function InvestorsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const rows = await db()
    .select({
      id: investorProfiles.id,
      slug: investorProfiles.slug,
      displayName: investorProfiles.displayName,
      firmName: investorProfiles.firmName,
      tagline: investorProfiles.tagline,
      investorType: investorProfiles.investorType,
      stagesJson: investorProfiles.stagesJson,
      sectorsJson: investorProfiles.sectorsJson,
      geoFocusJson: investorProfiles.geoFocusJson,
    })
    .from(investorProfiles)
    .where(
      and(
        eq(investorProfiles.verificationStatus, "verified"),
        isNotNull(investorProfiles.slug),
      ),
    )
    .orderBy(asc(investorProfiles.displayName));

  const profiles = rows
    .map((r) => ({
      id: r.id,
      slug: r.slug!,
      displayName: r.displayName ?? r.firmName ?? "Investor",
      firmName: r.firmName,
      tagline: r.tagline,
      investorType: r.investorType,
      stages: parseJsonArray(r.stagesJson),
      sectors: parseJsonArray(r.sectorsJson),
      geoFocus: parseJsonArray(r.geoFocusJson),
    }))
    // Apply filters in-memory — directory is small (<200 rows), and
    // SQLite JSON containment requires custom SQL. Keep it simple.
    .filter((p) => {
      if (sp.type && p.investorType !== sp.type) return false;
      if (sp.stage && !p.stages.includes(sp.stage)) return false;
      if (sp.sector && !p.sectors.includes(sp.sector)) return false;
      if (sp.geo && !p.geoFocus.includes(sp.geo)) return false;
      return true;
    });

  const activeFilters = [
    sp.type ? { key: "type", label: chipLabel(INVESTOR_TYPE_OPTIONS, sp.type) } : null,
    sp.stage ? { key: "stage", label: chipLabel(STAGE_OPTIONS, sp.stage) } : null,
    sp.sector ? { key: "sector", label: chipLabel(SECTOR_OPTIONS, sp.sector) } : null,
    sp.geo ? { key: "geo", label: chipLabel(GEO_FOCUS_OPTIONS, sp.geo) } : null,
  ].filter((x): x is { key: string; label: string } => !!x);

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-20 pt-6 sm:px-7 sm:pt-8">
      <Link
        href="/investors"
        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-ink"
      >
        ← Investor overview
      </Link>
      <header className="mt-3 border-b-[1.5px] border-ink/30 pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Directory
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
          Investors
        </h1>
        <p className="mt-3 max-w-prose font-serif text-lg leading-relaxed text-ink-2">
          {profiles.length} verified Utah-active{" "}
          {profiles.length === 1 ? "investor" : "investors"}. Public profiles only —
          email is intentionally redacted. Intros flow through GOEO.
        </p>

        {/* Filters */}
        <FilterBar searchParams={sp} />

        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Filters:
            </span>
            {activeFilters.map((f) => (
              <Link
                key={f.key}
                href={removeParam(sp, f.key)}
                className="inline-flex items-center gap-1 rounded-pill border-[1.5px] border-ink/30 bg-paper-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider hover:bg-paper"
              >
                {f.label} ✕
              </Link>
            ))}
            <Link
              href="/investors/all"
              className="font-mono text-[10px] uppercase tracking-wider text-ink-3 underline-offset-2 hover:underline"
            >
              clear all
            </Link>
          </div>
        ) : null}
      </header>

      {profiles.length === 0 ? (
        <Tile variant="subtle" shadow="none" className="mt-8 p-8 text-center">
          <p className="font-serif text-xl text-ink-2">
            No verified investors match these filters yet.
          </p>
          <p className="mt-2 text-sm text-ink-3">
            New investors are added as they verify their profiles. Check back
            soon, or{" "}
            <Link
              href="/investors/all"
              className="underline decoration-ember/40 hover:decoration-ember"
            >
              clear filters
            </Link>
            .
          </p>
        </Tile>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <li key={p.id}>
              <Link href={`/investors/${p.slug}`} className="block">
                <Tile
                  variant="default"
                  shadow="sketch"
                  className="h-full p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.investorType ? (
                      <Chip tone="ink">
                        {chipLabel(INVESTOR_TYPE_OPTIONS, p.investorType)}
                      </Chip>
                    ) : null}
                    <Chip tone="sage-tint">verified</Chip>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl leading-tight tracking-tight">
                    {p.displayName}
                  </h2>
                  {p.firmName && p.firmName !== p.displayName ? (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                      {p.firmName}
                    </p>
                  ) : null}
                  {p.tagline ? (
                    <p className="mt-2 font-serif text-base text-ink-2">
                      {p.tagline}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {lookup(STAGE_OPTIONS, p.stages.slice(0, 3)).map((s) => (
                      <Chip key={s} tone="sky-tint">
                        {s}
                      </Chip>
                    ))}
                  </div>
                  {p.sectors.length > 0 ? (
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                      {lookup(SECTOR_OPTIONS, p.sectors.slice(0, 4)).join(" · ")}
                    </p>
                  ) : null}
                </Tile>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function chipLabel(
  opts: ReadonlyArray<{ id: string; label: string }>,
  id: string,
): string {
  return opts.find((o) => o.id === id)?.label ?? id;
}

function removeParam(sp: SearchParams, key: string): string {
  const params = new URLSearchParams(sp as Record<string, string>);
  params.delete(key);
  const q = params.toString();
  return q ? `/investors/all?${q}` : "/investors/all";
}

function FilterBar({ searchParams }: { searchParams: SearchParams }) {
  return (
    <form
      method="get"
      action="/investors/all"
      className="mt-5 flex flex-wrap items-end gap-3"
    >
      <FilterSelect
        name="type"
        label="Type"
        value={searchParams.type ?? ""}
        options={INVESTOR_TYPE_OPTIONS}
      />
      <FilterSelect
        name="stage"
        label="Stage"
        value={searchParams.stage ?? ""}
        options={STAGE_OPTIONS}
      />
      <FilterSelect
        name="sector"
        label="Sector"
        value={searchParams.sector ?? ""}
        options={SECTOR_OPTIONS}
      />
      <FilterSelect
        name="geo"
        label="Geo"
        value={searchParams.geo ?? ""}
        options={GEO_FOCUS_OPTIONS}
      />
      <button
        type="submit"
        className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
      >
        Apply
      </button>
    </form>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: ReadonlyArray<{ id: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="h-10 rounded-tile border-[1.5px] border-ink/30 bg-paper px-3 font-mono text-xs"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
