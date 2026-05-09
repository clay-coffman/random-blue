import Link from "next/link";
import { SectionHeader, Tile } from "@/components/brand";
import { getLandingStats } from "@/lib/landing-stats";

export const dynamic = "force-dynamic";

const ctaBase =
  "inline-flex min-h-[44px] items-center justify-center gap-1 rounded-tile border-[1.5px] border-ink px-5 py-3 font-medium shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover";
const ctaEmber = "border-ember bg-ember text-paper";
const ctaGhost = "bg-paper-2 text-ink";

const audienceCards = [
  {
    kicker: "FOR FOUNDERS",
    title: "Six questions, one 90-day plan.",
    body:
      "Tell Atlas your stage, sector, and county. Get a ranked plan: do this now, do this next, ignore for now.",
    cta: { label: "Start my plan →", href: "/founder" },
    tone: "ember" as const,
  },
  {
    kicker: "FOR INVESTORS",
    title: "The map, with a memo.",
    body:
      "Filter by stage, sector, and county. Click any company for a one-page brief with citations.",
    cta: { label: "Open the map →", href: "/map" },
    tone: "sky" as const,
  },
  {
    kicker: "FOR AGENTS",
    title: "Built for machines too.",
    body:
      "OpenAPI, MCP, llms.txt, .md / .json variants on every profile. CLI install in one line.",
    cta: { label: "See agent docs →", href: "/agents" },
    tone: "sage" as const,
  },
];

export default async function Home() {
  const stats = await getLandingStats();
  const fmt = (n: number) => n.toLocaleString("en-US");
  const liveStats = [
    { value: fmt(stats.companies), label: "Companies" },
    { value: fmt(stats.resources), label: "Resources" },
    { value: fmt(stats.counties), label: "Counties" },
    { value: fmt(stats.verifiedProfiles), label: "Verified profiles" },
  ];
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-[1480px] px-4 pb-12 pt-10 sm:px-7 sm:pt-16">
        <div className="flex max-w-3xl flex-col">
          <p className="mb-3 font-hand text-base text-ink-3">
            A guide. Not a library.
          </p>
          <h1 className="font-serif text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            A guide for Utah founders.
          </h1>
          <p className="mt-3 font-serif text-2xl text-ink-2 sm:text-3xl">
            Six questions.{" "}
            <em className="font-medium not-italic text-ember">
              One 90-day plan.
            </em>
          </p>
          <p className="mt-5 max-w-[560px] text-base leading-relaxed text-ink-2">
            Tell us who you&rsquo;re building. Atlas matches your situation
            against every state-vetted resource &mdash; capital, mentors, pitch
            nights, rural and veteran programs &mdash; and returns a ranked
            plan, not a pile of links.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/founder" className={`${ctaBase} ${ctaEmber}`}>
              Start my plan →
            </Link>
            <Link href="/map" className={`${ctaBase} ${ctaGhost}`}>
              Explore the map
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

      {/* Three audiences */}
      <section className="mx-auto grid max-w-[1480px] gap-7 border-b border-topo px-4 py-14 sm:px-7 md:grid-cols-3">
        {audienceCards.map((card) => (
          <Tile
            key={card.kicker}
            as="article"
            shadow="sketch-hover"
            className="flex flex-col gap-4"
          >
            <SectionHeader
              kicker={card.kicker}
              kickerTone={card.tone}
              title={card.title}
            />
            <p className="text-sm leading-relaxed text-ink-2">{card.body}</p>
            <Link
              href={card.cta.href}
              className="mt-auto inline-flex w-fit items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-ink hover:text-ember"
            >
              {card.cta.label}
            </Link>
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
