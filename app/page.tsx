import Link from "next/link";
import {
  ActivityTicker,
  Chip,
  PersonaTile,
  ScribbleDivider,
  SectionHeader,
  Tile,
} from "@/components/brand";
import { recentActivity } from "@/lib/activity";
import { getLandingStats } from "@/lib/landing-stats";
import { personas } from "@/lib/personas";

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
  const [activity, stats] = await Promise.all([
    recentActivity(6),
    getLandingStats(),
  ]);
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
      <section className="mx-auto grid max-w-[1480px] gap-10 px-4 pb-12 pt-10 sm:px-7 sm:pt-16 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div className="flex flex-col">
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
            <Link href="/agents" className={`${ctaBase} ${ctaGhost}`}>
              For agents
            </Link>
          </div>

          {/* Persona shortcut row */}
          <div className="mt-10">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              ↓ Try as a sample founder
            </p>
            <div className="flex flex-wrap gap-2">
              {personas.map((p, i) => (
                <PersonaTile
                  key={p.id}
                  persona={p}
                  variant="compact"
                  active={i === 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Faux preview card (≥ md only) */}
        <aside className="hidden md:block">
          <Tile variant="rotated" className="max-w-md">
            <div className="flex items-center justify-between">
              <Chip tone="ember-tint">Raising seed</Chip>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                Plan &middot; pg 1
              </span>
            </div>
            <h3 className="mt-3 font-serif text-2xl leading-tight">
              Priya, 31 &middot; SLC
            </h3>
            <p className="mt-1 font-hand text-sm text-ink-3">
              B2B SaaS, 18mo in, paying customers.
            </p>
            <ScribbleDivider className="mt-4" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-ember">
              Do this now
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              <li className="rounded-tile border border-topo bg-paper p-3">
                <p className="font-medium">Apply: Park City Angels</p>
                <p className="text-xs text-ink-3">
                  Rolling deadline &middot; check size $25k–$250k
                </p>
              </li>
              <li className="rounded-tile border border-topo bg-paper p-3">
                <p className="font-medium">Pitch: Silicon Slopes Series</p>
                <p className="text-xs text-ink-3">
                  Five new resources added this week
                </p>
              </li>
            </ul>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-sky">
              Do this next &middot; 3 items
            </p>
            <ScribbleDivider width="med" className="mt-2" />
            <ScribbleDivider width="short" className="mt-1" />
          </Tile>
        </aside>
      </section>

      {/* Live signal strip */}
      <section className="border-y-[1.5px] border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-7">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ember-tint">
            <span aria-hidden className="h-2 w-2 rounded-full bg-ember" />
            Live
          </span>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {liveStats.map((s) => (
              <li
                key={s.label}
                className="flex flex-col border-l border-paper/20 pl-4"
              >
                <span className="font-serif text-xl leading-none">
                  {s.value}
                </span>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-topo">
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
          <ActivityTicker className="md:ml-auto" events={activity} />
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
