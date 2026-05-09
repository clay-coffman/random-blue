import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { and, eq, isNull } from "drizzle-orm";
import { Tile, Chip, ScribbleDivider } from "@/components/brand";
import { sectorChipClass, sectorDisplayName } from "@/lib/sectors";
import { parseBucket } from "@/lib/employee-bucket";
import { companyCard, type CompanyCard } from "@/lib/company-card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import {
  companies,
  introRequests,
  investorProfiles,
  savedCompanies,
} from "@/db/schema";
import { getApiSession } from "@/lib/auth-utils";
import { ProfileTabs } from "./_components/ProfileTabs";
import { MiniMap } from "./_components/MiniMap";
import { UpdateWithClaude } from "./_components/UpdateWithClaude";
import { DualPaneReveal } from "./_components/DualPaneReveal";
import { SaveButton } from "./_components/SaveButton";
import { RequestIntroButton } from "./_components/RequestIntroButton";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await companyCard(slug);
  if (!result) return { title: "Company not found — Utah Startup State Atlas" };
  const { card } = result;
  const description =
    card.what_they_sell ??
    card.description?.slice(0, 160) ??
    `${card.name} — a ${card.sector_display} startup in Utah.`;
  return {
    title: `${card.name} — Utah Startup State Atlas`,
    description,
    alternates: {
      canonical: `/startups/${card.slug}`,
      types: {
        "text/markdown": `/startups/${card.slug}.md`,
        "application/json": `/startups/${card.slug}.json`,
      },
    },
    openGraph: {
      title: card.name,
      description,
      url: `/startups/${card.slug}`,
      type: "website",
      siteName: "Utah Startup State Atlas",
    },
    twitter: {
      card: "summary",
      title: card.name,
      description,
    },
  };
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const result = await companyCard(slug);
  if (!result) notFound();

  if (sp.view === "dual") {
    return <DualPaneReveal card={result.card} />;
  }

  // Read session — drives whether to show Save / Request intro buttons.
  const headerStore = await headers();
  const fakeReq = new Request(`https://startup.utah.gov/startups/${slug}`, {
    headers: headerStore,
  });
  const session = await getApiSession(fakeReq);

  // For investor sessions, check if this company is already saved.
  let isInvestor = false;
  let isSaved = false;
  if (session?.user.role === "investor") {
    isInvestor = true;
    const [investor] = await db()
      .select({ id: investorProfiles.id })
      .from(investorProfiles)
      .where(eq(investorProfiles.userId, session.user.id))
      .limit(1);
    if (investor) {
      const [savedRow] = await db()
        .select({ id: savedCompanies.id })
        .from(savedCompanies)
        .where(
          and(
            eq(savedCompanies.investorId, investor.id),
            eq(savedCompanies.companyId, result.card.id),
          ),
        )
        .limit(1);
      isSaved = !!savedRow;
    }
  }

  // Pre-empt the duplicate-pending case for the intro dialog. Skip
  // the lookup when the viewer is the company claimer — the API
  // rejects self-targeted intros, so the row can't exist.
  let pendingIntroId: string | null = null;
  if (session?.user.id) {
    const [claim] = await db()
      .select({ claimedByUserId: companies.claimedByUserId })
      .from(companies)
      .where(eq(companies.id, result.card.id))
      .limit(1);
    if (claim?.claimedByUserId !== session.user.id) {
      const [existing] = await db()
        .select({ id: introRequests.id })
        .from(introRequests)
        .where(
          and(
            eq(introRequests.requesterUserId, session.user.id),
            eq(introRequests.targetCompanyId, result.card.id),
            isNull(introRequests.targetInvestorId),
            eq(introRequests.status, "pending"),
          ),
        )
        .limit(1);
      pendingIntroId = existing?.id ?? null;
    }
  }

  return (
    <VariantAProfile
      card={result.card}
      signedIn={!!session}
      isInvestor={isInvestor}
      isSaved={isSaved}
      pendingIntroId={pendingIntroId}
    />
  );
}

function VariantAProfile({
  card,
  signedIn,
  isInvestor,
  isSaved,
  pendingIntroId,
}: {
  card: CompanyCard;
  signedIn: boolean;
  isInvestor: boolean;
  isSaved: boolean;
  pendingIntroId: string | null;
}) {
  const jobsCount = card.jobs.length;
  // Tab labels track render order in the main column. The Agent Card
  // teaser lives in the right rail, not the main column — so it's
  // omitted from the tab strip (clicking it on desktop would scroll
  // past the sidebar). Same with the right-rail Claim/Related tiles.
  const sectionLabels = ["Overview", "Facts", "Open roles", "Gallery", "Map"];
  const verification = card.verification.status;

  // JSON-LD Organization schema for SEO + agent consumption.
  // schema.org `numberOfEmployees` expects an integer or
  // QuantitativeValue with min/max. Our bucket strings ("11-50")
  // can't be plain integers; emit a QuantitativeValue when the bucket
  // parses cleanly, otherwise omit so consumers don't get garbage.
  const empRange = parseBucket(card.employee_count);
  const empJsonLd = empRange
    ? {
        "@type": "QuantitativeValue" as const,
        ...(Number.isFinite(empRange.min) && { minValue: empRange.min }),
        ...(Number.isFinite(empRange.max) && { maxValue: empRange.max }),
        unitText: "employees",
      }
    : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: card.name,
    url: card.website ?? undefined,
    description: card.description ?? undefined,
    logo: card.logo_url ?? undefined,
    sameAs: card.linkedin ? [card.linkedin] : undefined,
    address:
      card.city || card.county
        ? {
            "@type": "PostalAddress",
            addressLocality: card.city ?? undefined,
            addressRegion: card.county ? `${card.county} County, UT` : "UT",
            addressCountry: "US",
          }
        : undefined,
    foundingDate: card.founding_year ? String(card.founding_year) : undefined,
    numberOfEmployees: empJsonLd,
  };

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-20 pt-6 sm:px-7 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <header className="grid gap-5 border-b-[1.5px] border-ink/30 pb-7 sm:grid-cols-[96px_1fr_auto] sm:items-start sm:gap-6">
        <Tile
          variant="default"
          shadow="sketch"
          className="flex aspect-square w-20 items-center justify-center p-0 sm:h-24 sm:w-24"
        >
          {card.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.logo_url}
              alt={`${card.name} logo`}
              className="h-full w-full rounded-tile object-cover"
            />
          ) : (
            <span className="font-serif text-4xl">
              {card.name.charAt(0).toUpperCase()}
            </span>
          )}
        </Tile>

        <div className="min-w-0">
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
            {verification === "verified" ? (
              <Chip tone="sage-tint">verified</Chip>
            ) : verification === "claimed" ? (
              <Chip tone="sky-tint">claimed</Chip>
            ) : null}
            {card.hiring_status ? (
              <Chip tone="ember-tint">hiring{jobsCount ? ` · ${jobsCount}` : ""}</Chip>
            ) : null}
          </div>

          <h1 className="mt-2 font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {card.name}
          </h1>
          {card.what_they_sell ? (
            <p className="mt-2 font-serif text-lg text-ink-2 sm:text-xl">
              {card.what_they_sell}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {card.city || card.county ? (
              <span>
                {[card.city, card.county && `${card.county} County`]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            ) : null}
            {card.founding_year ? <span>· founded {card.founding_year}</span> : null}
            {card.employee_count ? <span>· {card.employee_count} employees</span> : null}
            {card.last_updated_at ? (
              <span>· updated {card.last_updated_at.split("T")[0]}</span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          {card.website ? (
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ember bg-ember px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
            >
              ↗ Visit website
            </a>
          ) : null}
          {jobsCount > 0 ? (
            <Link
              href="#open-roles"
              className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper px-4 font-mono text-xs uppercase tracking-wider transition hover:-translate-y-0.5"
            >
              View {jobsCount} open role{jobsCount === 1 ? "" : "s"}
            </Link>
          ) : null}
          {isInvestor ? (
            <SaveButton companyId={card.id} initialSaved={isSaved} />
          ) : null}
          {signedIn ? (
            <RequestIntroButton
              companyId={card.id}
              companyName={card.name}
              pendingIntroId={pendingIntroId}
            />
          ) : null}
          <Link
            href={`/companies/${card.slug}/claim`}
            className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ink/40 bg-transparent px-4 font-mono text-[11px] uppercase tracking-wider text-ink-2 transition hover:bg-paper-2"
          >
            Claim this profile
          </Link>
        </div>
      </header>

      {/* TABS — sticky */}
      <ProfileTabs sections={sectionLabels} jobsCount={jobsCount} />

      {/* BODY two-column */}
      <div className="grid gap-10 pt-8 lg:grid-cols-[1fr_360px]">
        {/* MAIN COLUMN */}
        <div className="min-w-0 space-y-12">
          {/* OVERVIEW / ABOUT */}
          <section id="overview" className="scroll-mt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              About
            </p>
            <div className="mt-3 space-y-4 font-serif text-lg leading-relaxed text-ink-2">
              {card.description ? (
                card.description
                  .split(/\n+/)
                  .map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-ink-3">No description on file yet.</p>
              )}
            </div>
          </section>

          {/* FACTS — 4-col fact tiles */}
          <section id="facts" className="scroll-mt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Facts
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FactTile label="Stage" value={card.stage ?? "—"} />
              <FactTile
                label="Founded"
                value={card.founding_year ? String(card.founding_year) : "—"}
              />
              <FactTile label="Team size" value={card.employee_count ?? "—"} />
              <FactTile
                label="Hiring"
                value={
                  card.hiring_status
                    ? jobsCount
                      ? `${jobsCount} open`
                      : "Yes"
                    : "Not now"
                }
              />
            </div>
          </section>

          <ScribbleDivider width="med" />

          {/* OPEN ROLES */}
          <section id="open-roles" className="scroll-mt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Open roles ({jobsCount})
            </p>
            {jobsCount === 0 ? (
              <p className="mt-3 text-sm text-ink-3">
                No public roles right now.
                {card.website ? (
                  <>
                    {" "}
                    Check{" "}
                    <a
                      href={card.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-ember/40 hover:decoration-ember"
                    >
                      the company site
                    </a>{" "}
                    for the latest postings.
                  </>
                ) : null}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {card.jobs.map((j, i) => (
                  <li key={i}>
                    <Tile variant="subtle" shadow="none" className="p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-serif text-lg leading-snug">
                          {j.title}
                        </p>
                        {j.url ? (
                          <a
                            href={j.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 self-start rounded-pill border-[1.5px] border-ink bg-paper-2 px-3 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5 sm:self-auto"
                          >
                            View →
                          </a>
                        ) : null}
                      </div>
                    </Tile>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* GALLERY */}
          <section id="gallery" className="scroll-mt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Gallery
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Tile
                  key={i}
                  variant="subtle"
                  shadow="none"
                  className="flex aspect-square items-center justify-center p-0"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                    no photo yet
                  </span>
                </Tile>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Photos appear once the owner uploads them via the claim flow.
            </p>
          </section>

          <ScribbleDivider width="med" />

          {/* ON THE MAP */}
          <section id="map" className="scroll-mt-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              On the map
            </p>
            <div className="mt-3">
              {card.lat != null && card.lng != null ? (
                <MiniMap
                  lat={card.lat}
                  lng={card.lng}
                  name={card.name}
                  sector={card.sector}
                  slug={card.slug}
                />
              ) : (
                <Tile variant="subtle" shadow="none" className="p-6">
                  <p className="text-sm text-ink-3">
                    Coordinates not on file yet.
                  </p>
                </Tile>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT RAIL */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* AGENT CARD TEASER (dark Tile + ember shadow). Lives in the
              right rail intentionally — it's the differentiator beat,
              not a body section. The tab strip skips this. */}
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
              This same profile, served to AI agents.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { label: `/startups/${card.slug}.md`, href: card.agent_card_urls.markdown },
                { label: `/startups/${card.slug}.json`, href: card.agent_card_urls.json },
                { label: `/api/v1/companies/${card.slug}`, href: card.agent_card_urls.api },
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
              Same source feeds the page, the JSON, the API, and the Markdown.
              The owner maintains one verified profile.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href={`/startups/${card.slug}?view=dual`}
                className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
              >
                Open dual-pane →
              </Link>
              <UpdateWithClaude card={card} />
            </div>
          </section>

          {/* CLAIM */}
          {verification !== "verified" ? (
            <Tile
              variant="subtle"
              shadow="none"
              className="border-dashed border-ink/40 p-4"
            >
              <p className="font-serif text-lg font-medium leading-snug">
                Are you {card.name}?
              </p>
              <p className="mt-1 text-sm text-ink-3">
                Claim this profile by uploading a verification document. GOEO
                staff reviews each claim.
              </p>
              <Link
                href={`/companies/${card.slug}/claim`}
                className="mt-3 inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
              >
                Claim →
              </Link>
            </Tile>
          ) : null}

          {/* RELATED */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Related
            </p>
            <div className="mt-3 space-y-2">
              <Tile variant="subtle" shadow="none" className="p-3">
                <p className="font-serif text-base font-medium">Cluster</p>
                <Link
                  href={`/map?sector=${encodeURIComponent(card.sector ?? "")}`}
                  className="mt-1 inline-flex min-h-[44px] items-center text-sm text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
                >
                  All Utah {card.sector_display.toLowerCase()} →
                </Link>
              </Tile>
              {card.county ? (
                <Tile variant="subtle" shadow="none" className="p-3">
                  <p className="font-serif text-base font-medium">County</p>
                  <Link
                    href={`/map?county=${encodeURIComponent(card.county)}`}
                    className="mt-1 inline-flex min-h-[44px] items-center text-sm text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
                  >
                    All companies in {card.county} County →
                  </Link>
                </Tile>
              ) : null}
            </div>
          </div>

          {/* Footer attribution */}
          <p className="border-t border-topo-2 pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            ↑ {verification} · sources: GOEO directory{" "}
            {card.last_updated_at
              ? `· last sync ${card.last_updated_at.split("T")[0]}`
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
