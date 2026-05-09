import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Tile, Chip, ScribbleDivider } from "@/components/brand";
import {
  canSeeInvestor,
  investorCard,
  type InvestorPublicCard,
} from "@/lib/investor-card";
import { getApiSession } from "@/lib/auth-utils";
import { RequestIntroDialog } from "./_components/RequestIntroDialog";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await investorCard(slug);
  if (!result) {
    return { title: "Investor not found — Utah Startup State Atlas" };
  }
  const { card } = result;
  const description =
    card.tagline ??
    card.bio?.slice(0, 160) ??
    `${card.display_name} — Utah-active investor.`;
  return {
    title: `${card.display_name} — Utah Startup State Atlas`,
    description,
    alternates: {
      canonical: `/investors/${card.slug}`,
      types: {
        "text/markdown": `/investors/${card.slug}.md`,
        "application/json": `/investors/${card.slug}.json`,
      },
    },
    openGraph: {
      title: card.display_name,
      description,
      url: `/investors/${card.slug}`,
      type: "profile",
      siteName: "Utah Startup State Atlas",
    },
  };
}

function formatCheckSize(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  const fmt = (n: number) => {
    if (n >= 1_000_000)
      return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
  };
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `up to ${fmt(max!)}`;
}

export default async function InvestorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await investorCard(slug);
  if (!result) notFound();

  // Read session — anon visitors see "sign in to request intro";
  // signed-in users get the dialog.
  const headerStore = await headers();
  const fakeReq = new Request("https://startup.utah.gov/investors", {
    headers: headerStore,
  });
  const session = await getApiSession(fakeReq);

  // Visibility gate: unverified profiles are owner-previewable +
  // admin viewable, but not anonymous-readable.
  if (
    !canSeeInvestor(
      result.row,
      session?.user.id ?? null,
      session?.user.role ?? null,
    )
  ) {
    notFound();
  }

  return <InvestorProfile card={result.card} signedIn={!!session} />;
}

function InvestorProfile({
  card,
  signedIn,
}: {
  card: InvestorPublicCard;
  signedIn: boolean;
}) {
  const verified = card.verification.status === "verified";
  const checkSize = formatCheckSize(card.check_size_min, card.check_size_max);

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-20 pt-6 sm:px-7 sm:pt-8">
      {/* HERO */}
      <header className="grid gap-5 border-b-[1.5px] border-ink/30 pb-7 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {card.investor_type_display ? (
              <Chip tone="ink">{card.investor_type_display}</Chip>
            ) : null}
            {verified ? (
              <Chip tone="sage-tint">verified</Chip>
            ) : (
              <Chip tone="stone">unverified</Chip>
            )}
            {card.stages_display.slice(0, 4).map((s) => (
              <Chip key={s} tone="sky-tint">
                {s}
              </Chip>
            ))}
          </div>

          <h1 className="mt-2 font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {card.display_name}
          </h1>
          {card.firm_name && card.firm_name !== card.display_name ? (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
              {card.firm_name}
            </p>
          ) : null}
          {card.tagline ? (
            <p className="mt-2 font-serif text-lg text-ink-2 sm:text-xl">
              {card.tagline}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {card.geo_focus_display.length > 0 ? (
              <span>{card.geo_focus_display.join(" · ")}</span>
            ) : null}
            {checkSize !== "—" ? <span>· {checkSize}</span> : null}
            {card.last_updated_at ? (
              <span>· updated {card.last_updated_at.split("T")[0]}</span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          {signedIn ? (
            <RequestIntroDialog
              targetType="investor"
              targetId={card.id}
              targetName={card.display_name}
            />
          ) : (
            <Link
              href={`/sign-in?next=/investors/${card.slug}`}
              className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ember bg-ember px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
            >
              Sign in to request an intro
            </Link>
          )}
          {card.website ? (
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper px-4 font-mono text-xs uppercase tracking-wider transition hover:-translate-y-0.5"
            >
              ↗ Website
            </a>
          ) : null}
          {card.linkedin ? (
            <a
              href={card.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ink/40 bg-transparent px-4 font-mono text-[11px] uppercase tracking-wider text-ink-2 transition hover:bg-paper-2"
            >
              ↗ LinkedIn
            </a>
          ) : null}
        </div>
      </header>

      {/* BODY two-column */}
      <div className="grid gap-10 pt-8 lg:grid-cols-[1fr_360px]">
        {/* MAIN COLUMN */}
        <div className="min-w-0 space-y-12">
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              About
            </p>
            <div className="mt-3 space-y-4 font-serif text-lg leading-relaxed text-ink-2">
              {card.bio ? (
                card.bio.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-ink-3">No bio on file yet.</p>
              )}
            </div>
          </section>

          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Investment focus
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FactTile
                label="Stage focus"
                value={card.stages_display.join(", ") || "—"}
              />
              <FactTile
                label="Sectors"
                value={card.sectors_display.join(", ") || "—"}
              />
              <FactTile
                label="Geo"
                value={card.geo_focus_display.join(", ") || "—"}
              />
              <FactTile label="Check size" value={checkSize} />
            </div>
          </section>

          <ScribbleDivider width="med" />

          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Contact
            </p>
            <Tile variant="subtle" shadow="none" className="mt-3 p-4">
              <p className="font-serif text-base leading-relaxed text-ink-2">
                Direct contact info for {card.display_name} is not published.
                To reach out, send an intro request through GOEO. The team
                reviews each request and, if accepted, connects both parties
                by email.
              </p>
              {signedIn ? (
                <div className="mt-4">
                  <RequestIntroDialog
                    targetType="investor"
                    targetId={card.id}
                    targetName={card.display_name}
                  />
                </div>
              ) : (
                <Link
                  href={`/sign-in?next=/investors/${card.slug}`}
                  className="mt-4 inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
                >
                  Sign in to request →
                </Link>
              )}
            </Tile>
          </section>
        </div>

        {/* RIGHT RAIL */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section
            aria-labelledby="agent-card-label"
            className="rounded-tile border-[1.5px] border-ink bg-ink p-4 text-paper"
            style={{ boxShadow: "5px 5px 0 var(--color-ember)" }}
          >
            <p
              id="agent-card-label"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember-tint"
            >
              ↓ Agent Card
            </p>
            <p className="mt-2 font-serif text-xl leading-snug text-paper">
              This profile, served to AI agents.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                {
                  label: `/investors/${card.slug}.md`,
                  href: card.agent_card_urls.markdown,
                },
                {
                  label: `/investors/${card.slug}.json`,
                  href: card.agent_card_urls.json,
                },
                {
                  label: `/api/v1/investor-profiles/${card.slug}`,
                  href: card.agent_card_urls.api,
                },
                { label: "/llms.txt", href: "/llms.txt" },
              ].map((row) => (
                <li key={row.href}>
                  <Link
                    href={row.href}
                    className="flex min-h-[44px] items-center justify-between rounded bg-paper/5 px-3 py-2 font-mono text-[11px] text-paper transition hover:bg-paper/15"
                  >
                    <span className="truncate">{row.label}</span>
                    <span className="text-ember-tint">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-topo">
              Email is intentionally redacted. Intros flow through GOEO.
            </p>
          </section>

          <p className="border-t border-topo-2 pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            ↑ {card.verification.status} · maintained by the investor
            {card.last_updated_at
              ? ` · last update ${card.last_updated_at.split("T")[0]}`
              : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <Tile variant="subtle" shadow="none" className="p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </p>
      <p className="mt-1 font-serif text-base font-medium leading-snug">
        {value}
      </p>
    </Tile>
  );
}
