import Link from "next/link";
import type { Metadata } from "next";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { SectionHeader, Tile } from "@/components/brand";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { getLandingStats } from "@/lib/landing-stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For investors — Atlas",
  description:
    "Utah's startup landscape, mapped. Filter by stage, sector, and county. Click any company for a one-page brief with citations.",
};

const ctaBase =
  "inline-flex min-h-[44px] items-center justify-center gap-1 rounded-tile border-[1.5px] border-ink px-5 py-3 font-medium shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover";
const ctaSky = "border-sky bg-sky text-paper";
const ctaGhost = "bg-paper-2 text-ink";

const valueTiles = [
  {
    kicker: "FILTER THE MAP",
    title: "Stage, sector, county, status.",
    body:
      "Spot density and gaps across all 29 Utah counties. Overlay rural and minority-owned. Pick a tile, see who's there.",
  },
  {
    kicker: "ONE-PAGE BRIEFS",
    title: "Every claim has a citation.",
    body:
      "Funding stage, team size, and traction signals link back to source data. No black-box scoring; the receipts are inline.",
  },
  {
    kicker: "GOEO-MEDIATED INTROS",
    title: "Verified profiles, no scraped emails.",
    body:
      "Direct contact info is intentionally redacted. Intros route through Utah's Governor's Office of Economic Development.",
  },
];

async function getVerifiedInvestorCount(): Promise<number> {
  try {
    const [row] = await db()
      .select({ n: count() })
      .from(investorProfiles)
      .where(
        and(
          eq(investorProfiles.verificationStatus, "verified"),
          isNotNull(investorProfiles.slug),
        ),
      );
    return row?.n ?? 0;
  } catch (err) {
    console.error("getVerifiedInvestorCount failed:", err);
    return 0;
  }
}

export default async function InvestorsLandingPage() {
  const [stats, verifiedInvestors] = await Promise.all([
    getLandingStats(),
    getVerifiedInvestorCount(),
  ]);
  const fmt = (n: number) => n.toLocaleString("en-US");
  const liveStats = [
    { value: fmt(stats.companies), label: "Companies" },
    { value: fmt(stats.counties), label: "Counties" },
    { value: fmt(stats.verifiedProfiles), label: "Verified company profiles" },
    { value: fmt(verifiedInvestors), label: "Verified investors" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-[1480px] px-4 pb-12 pt-10 sm:px-7 sm:pt-16">
        <div className="flex max-w-3xl flex-col">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-sky">
            FOR INVESTORS
          </p>
          <h1 className="font-serif text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            The map, with a memo.
          </h1>
          <p className="mt-3 font-serif text-2xl text-ink-2 sm:text-3xl">
            Utah&rsquo;s startup landscape,{" "}
            <em className="font-medium not-italic text-sky">filterable</em> and{" "}
            <em className="font-medium not-italic text-sky">cited</em>.
          </p>
          <p className="mt-5 max-w-[620px] text-base leading-relaxed text-ink-2">
            Atlas is the public, agent-readable directory of Utah-active
            startups and capital. Filter the map by stage, sector, county, and
            status. Open any company for a one-page brief whose every claim
            links back to source data. Investor profiles are verified; intros
            flow through Utah&rsquo;s Governor&rsquo;s Office of Economic
            Development, not a scraper.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/map" className={`${ctaBase} ${ctaSky}`}>
              Open the map →
            </Link>
            <Link
              href="/map?view=list"
              className={`${ctaBase} ${ctaGhost}`}
            >
              Browse companies
            </Link>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-topo bg-paper-2">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-7">
          {liveStats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="font-serif text-xl leading-none text-ink">
                {s.value}
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Three value tiles */}
      <section className="mx-auto grid max-w-[1480px] gap-7 border-b border-topo px-4 py-14 sm:grid-cols-2 sm:px-7 md:grid-cols-3">
        {valueTiles.map((tile) => (
          <Tile
            key={tile.kicker}
            as="article"
            shadow="sketch-hover"
            className="flex flex-col gap-4"
          >
            <SectionHeader
              kicker={tile.kicker}
              kickerTone="sky"
              title={tile.title}
            />
            <p className="text-sm leading-relaxed text-ink-2">{tile.body}</p>
          </Tile>
        ))}
      </section>

      {/* Mono credibility line */}
      <section className="mx-auto max-w-[1480px] px-4 py-10 sm:px-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
          Built for Utah&rsquo;s Governor&rsquo;s Office of Economic Development
          &middot; openapi &middot; mcp &middot; llms.txt &middot; v0.4
          &middot; atlas
        </p>
      </section>
    </div>
  );
}
