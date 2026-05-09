"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScribbleDivider } from "@/components/brand";

type CompanyMatch = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  sector: string | null;
  city: string | null;
  county: string | null;
  employee_count: string | null;
  status: "claimed" | "pending" | "unclaimed";
};

export default function OwnerOnboardingPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/companies?q=${encodeURIComponent(q)}&limit=10`,
        );
        if (res.ok) {
          const data = (await res.json()) as { companies: CompanyMatch[] };
          setResults(data.companies ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-180px)] max-w-2xl flex-col px-4 py-10 sm:px-7">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        Owner · step 2 of 3
      </p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Find your company.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        We&rsquo;ll match against the Atlas index. If your company isn&rsquo;t
        there yet, you can request to add it.
      </p>
      <ScribbleDivider className="my-6" />
      <Input
        autoFocus
        type="search"
        placeholder="Search by name, website, or domain"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search companies"
      />
      <ul className="mt-4 grid gap-2">
        {loading ? (
          <li className="text-sm text-ink-3">Searching…</li>
        ) : null}
        {!loading && q.length >= 2 && results.length === 0 ? (
          <li className="text-sm text-ink-3">No matches.</li>
        ) : null}
        {results.map((c) => {
          const disabled = c.status === "claimed";
          const inner = (
            <div
              className={`flex items-center gap-3 rounded-tile border-[1.5px] p-3 transition ${
                disabled
                  ? "cursor-not-allowed border-topo bg-paper-2 opacity-60"
                  : "border-topo bg-paper-2 hover:-translate-y-0.5 hover:border-ink hover:shadow-sketch"
              }`}
            >
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-topo bg-paper font-mono text-[10px]"
              >
                {c.name[0]?.toUpperCase() ?? "?"}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate font-serif text-lg leading-tight">
                  {c.name}
                </span>
                <span className="block truncate text-xs text-ink-3">
                  {[c.website, c.sector, c.city ?? c.county]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <StatusChip status={c.status} />
            </div>
          );
          return (
            <li key={c.id}>
              {disabled ? (
                inner
              ) : (
                <Link
                  href={`/companies/${c.slug}/claim`}
                  className="block focus:outline-none"
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-6 rounded-tile border border-dashed border-topo bg-paper-2 p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Don&rsquo;t see your company?
        </p>
        <p className="mt-2 text-sm text-ink-2">
          Email{" "}
          <a
            href="mailto:atlas@goed.utah.gov?subject=Request%20to%20add%20company"
            className="text-ember underline-offset-4 hover:underline"
          >
            atlas@goed.utah.gov
          </a>{" "}
          with your company name and website. A GOEO admin will add it to the
          map within 1 business day.
        </p>
      </div>
      <Link
        href="/onboarding/done"
        className="mt-8 self-start font-mono text-xs uppercase tracking-wider text-ink-3 hover:text-ember"
      >
        Skip for now →
      </Link>
    </section>
  );
}

function StatusChip({ status }: { status: CompanyMatch["status"] }) {
  if (status === "claimed") {
    return (
      <span className="rounded-pill bg-sage-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sage">
        claimed
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="rounded-pill bg-ember-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ember">
        pending
      </span>
    );
  }
  return (
    <span className="rounded-pill bg-stone px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
      unclaimed
    </span>
  );
}
