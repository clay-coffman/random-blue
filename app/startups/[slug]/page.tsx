import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip } from "@/components/brand";
import { Tile } from "@/components/brand";
import { getCompanyCard, type CompanyCard } from "@/lib/company-card";
import { UpdateWithAIButton } from "./_components/UpdateWithAIButton";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await getCompanyCard(slug);
  if (!card) notFound();

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-7 sm:py-12">
      <Hero card={card} />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-10">
          <Description card={card} />
          <Facts card={card} />
          <Roles card={card} />
          <Team card={card} />
          <LocationBlock card={card} />
        </main>
        <aside className="space-y-6">
          <AgentCardTile card={card} />
          <ClaimTile card={card} />
          <ActionsTile card={card} />
        </aside>
      </div>
    </div>
  );
}

function Hero({ card }: { card: CompanyCard }) {
  const initial = (card.name.trim()[0] ?? "?").toUpperCase();
  return (
    <header className="space-y-4">
      <Link
        href="/map"
        className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-ink-3 transition hover:text-ember"
      >
        ← Back to map
      </Link>
      <div className="flex flex-wrap items-start gap-5">
        <div
          aria-hidden
          className="grid h-20 w-20 shrink-0 place-items-center rounded-tile border-[1.5px] border-ink bg-paper-2 font-serif text-3xl font-medium text-ink shadow-sketch"
        >
          {initial}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {card.sector ? <Chip tone="ember-tint">{card.sector}</Chip> : null}
            {card.stage ? <Chip tone="stone">{card.stage}</Chip> : null}
            {card.hiringStatus ? (
              <Chip tone="sage-tint">Hiring</Chip>
            ) : null}
            {card.claimed ? <Chip tone="sage">✓ Verified</Chip> : null}
          </div>
          <h1 className="mt-2 font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            {card.name}
          </h1>
          {card.description ? (
            <p className="mt-3 max-w-2xl text-lg text-ink-2">
              {summary(card.description, 180)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {locationLabel(card) ? <span>📍 {locationLabel(card)}</span> : null}
            {card.foundingYear ? <span>Founded {card.foundingYear}</span> : null}
            {card.employeeCount ? (
              <span>{card.employeeCount} employees</span>
            ) : null}
            {card.lastUpdatedAt ? (
              <span>
                Updated{" "}
                {new Date(card.lastUpdatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function Description({ card }: { card: CompanyCard }) {
  if (!card.description) return null;
  return (
    <section aria-labelledby="about-h">
      <h2
        id="about-h"
        className="font-mono text-[11px] uppercase tracking-wider text-ink-3"
      >
        About
      </h2>
      <p className="mt-3 max-w-prose font-serif text-lg leading-relaxed text-ink-2">
        {card.description}
      </p>
    </section>
  );
}

function Facts({ card }: { card: CompanyCard }) {
  const facts: Array<{ label: string; value: string | null }> = [
    { label: "Stage", value: card.stage ?? null },
    { label: "Sector", value: card.sector ?? null },
    { label: "Employees", value: card.employeeCount ?? null },
    {
      label: "Hiring",
      value: card.hiringStatus ? "Yes — open roles" : "Not actively",
    },
  ];
  const visible = facts.filter((f) => f.value);
  if (!visible.length) return null;
  return (
    <section aria-labelledby="facts-h">
      <h2
        id="facts-h"
        className="font-mono text-[11px] uppercase tracking-wider text-ink-3"
      >
        Facts
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((f) => (
          <Tile key={f.label} variant="subtle" shadow="none" className="!p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
              {f.label}
            </div>
            <div className="mt-1 font-serif text-xl text-ink">{f.value}</div>
          </Tile>
        ))}
      </div>
    </section>
  );
}

function Roles({ card }: { card: CompanyCard }) {
  if (!card.jobs.length) return null;
  return (
    <section aria-labelledby="roles-h">
      <h2
        id="roles-h"
        className="font-mono text-[11px] uppercase tracking-wider text-ink-3"
      >
        Open roles · {card.jobs.length}
      </h2>
      <ul className="mt-3 space-y-2">
        {card.jobs.map((j) => (
          <li key={j.id}>
            <Tile variant="subtle" shadow="none" className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-serif text-lg text-ink">{j.title}</span>
                {j.url ? (
                  <a
                    href={j.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] uppercase tracking-wider text-ember transition hover:text-ink"
                  >
                    Apply ↗
                  </a>
                ) : null}
              </div>
            </Tile>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Team({ card }: { card: CompanyCard }) {
  if (!card.founderTeam.length) return null;
  return (
    <section aria-labelledby="team-h">
      <h2
        id="team-h"
        className="font-mono text-[11px] uppercase tracking-wider text-ink-3"
      >
        Team
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {card.founderTeam.map((f, i) => (
          <li key={`${f.name}-${i}`}>
            <Tile variant="subtle" shadow="none" className="!p-4">
              <div className="font-serif text-lg text-ink">{f.name}</div>
              {f.title ? (
                <div className="text-sm text-ink-3">{f.title}</div>
              ) : null}
              {f.linkedin ? (
                <a
                  href={f.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex font-mono text-[11px] uppercase tracking-wider text-ember transition hover:text-ink"
                >
                  LinkedIn ↗
                </a>
              ) : null}
            </Tile>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LocationBlock({ card }: { card: CompanyCard }) {
  const label = locationLabel(card);
  if (!label && !card.addressText) return null;
  return (
    <section aria-labelledby="loc-h">
      <h2
        id="loc-h"
        className="font-mono text-[11px] uppercase tracking-wider text-ink-3"
      >
        On the map
      </h2>
      <Tile variant="subtle" shadow="none" className="mt-3 !p-4">
        <div className="font-serif text-lg text-ink">
          {label ?? card.addressText}
        </div>
        {card.addressText && card.addressText !== label ? (
          <div className="mt-1 text-sm text-ink-3">{card.addressText}</div>
        ) : null}
        <Link
          href="/map"
          className="mt-3 inline-flex font-mono text-[11px] uppercase tracking-wider text-ember transition hover:text-ink"
        >
          See on the map →
        </Link>
      </Tile>
    </section>
  );
}

function AgentCardTile({ card }: { card: CompanyCard }) {
  const links = [
    { href: `/startups/${card.slug}/route.md`, label: `/startups/${card.slug}/route.md` },
    {
      href: `/startups/${card.slug}/route.json`,
      label: `/startups/${card.slug}/route.json`,
    },
    {
      href: `/api/v1/companies/${card.slug}`,
      label: `/api/v1/companies/${card.slug}`,
    },
  ];
  return (
    <div
      className="rounded-tile border-[1.5px] border-ink bg-ink p-5 text-paper"
      style={{ boxShadow: "5px 5px 0 #c2410c" }}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-topo">
        ↓ Agent Card
      </div>
      <h3 className="mt-2 font-serif text-xl leading-snug">
        This same profile, served to AI agents.
      </h3>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="block break-all rounded-md border border-ink-2 bg-ink-2/40 px-3 py-2 font-mono text-[11px] text-ember-tint transition hover:bg-ink-2 hover:text-paper"
            >
              {l.label} ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-topo">
        Same source feeds the page, the JSON, the API, and the Markdown.
      </p>
    </div>
  );
}

function ClaimTile({ card }: { card: CompanyCard }) {
  if (card.claimed) {
    return (
      <Tile variant="subtle" shadow="none" className="!p-4">
        <div className="flex items-center gap-2">
          <span className="text-sage" aria-hidden>
            ✓
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-sage">
            Owner-claimed
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-3">
          Profile maintained by the company.
        </p>
      </Tile>
    );
  }
  return (
    <div className="rounded-tile border-[1.5px] border-dashed border-ink bg-paper-2 p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
        Are you {card.name}?
      </div>
      <p className="mt-2 text-sm text-ink-2">
        Claim this profile in 90 seconds with a domain email.
      </p>
      <Link
        href={`/companies/${card.slug}/claim`}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-pill border-[1.5px] border-ember bg-ember px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
      >
        Claim this company →
      </Link>
    </div>
  );
}

function ActionsTile({ card }: { card: CompanyCard }) {
  return (
    <div className="space-y-2">
      {card.website ? (
        <a
          href={card.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-pill border-[1.5px] border-ink bg-paper-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
        >
          Visit website ↗
        </a>
      ) : null}
      {card.linkedin ? (
        <a
          href={card.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-pill border-[1.5px] border-ink bg-paper-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
        >
          LinkedIn ↗
        </a>
      ) : null}
      <UpdateWithAIButton slug={card.slug} name={card.name} />
    </div>
  );
}

function summary(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function locationLabel(card: CompanyCard): string | null {
  const loc = card.locations[0];
  if (loc) {
    const parts = [loc.city, loc.county && `${loc.county} County`].filter(
      Boolean,
    );
    if (parts.length) return parts.join(", ");
  }
  return null;
}
