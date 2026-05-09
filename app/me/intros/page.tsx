import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { Tile, Chip } from "@/components/brand";
import { db } from "@/lib/db";
import {
  companies,
  introRequests,
  investorProfiles,
} from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { getApiSession } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, "ember-tint" | "sage-tint" | "stone"> = {
  pending: "ember-tint",
  accepted: "sage-tint",
  introduced: "sage-tint",
  declined: "stone",
};

type Tab = "outbound" | "inbound";

export default async function MyIntrosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const headerStore = await headers();
  const fakeReq = new Request("https://startup.utah.gov/me/intros", {
    headers: headerStore,
  });
  const session = await getApiSession(fakeReq);
  if (!session) redirect("/sign-in?next=/me/intros");

  const sp = await searchParams;
  const userId = session.user.id;

  const outboundRows = await db()
    .select({
      intro: introRequests,
      targetInvestorSlug: investorProfiles.slug,
      targetInvestorName: investorProfiles.displayName,
      targetInvestorFirm: investorProfiles.firmName,
      targetCompanySlug: companies.slug,
      targetCompanyName: companies.name,
    })
    .from(introRequests)
    .leftJoin(
      investorProfiles,
      eq(introRequests.targetInvestorId, investorProfiles.id),
    )
    .leftJoin(companies, eq(introRequests.targetCompanyId, companies.id))
    .where(eq(introRequests.requesterUserId, userId))
    .orderBy(desc(introRequests.submittedAt));

  // Inbound — only accepted/introduced visible to recipients.
  const [investor] = await db()
    .select({ id: investorProfiles.id })
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, userId))
    .limit(1);
  const claimed = await db()
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.claimedByUserId, userId));

  const targetInvestorIds = investor ? [investor.id] : [];
  const targetCompanyIds = claimed.map((c) => c.id);

  const inboundConditions = [];
  if (targetInvestorIds.length)
    inboundConditions.push(
      inArray(introRequests.targetInvestorId, targetInvestorIds),
    );
  if (targetCompanyIds.length)
    inboundConditions.push(
      inArray(introRequests.targetCompanyId, targetCompanyIds),
    );

  const inboundRows =
    inboundConditions.length === 0
      ? []
      : await db()
          .select({
            intro: introRequests,
            requesterEmail: userTable.email,
            requesterName: userTable.name,
          })
          .from(introRequests)
          .leftJoin(
            userTable,
            eq(introRequests.requesterUserId, userTable.id),
          )
          .where(
            and(
              or(...inboundConditions),
              inArray(introRequests.status, ["accepted", "introduced"]),
            ),
          )
          .orderBy(desc(introRequests.submittedAt));

  const tab: Tab =
    sp.tab === "inbound" && inboundRows.length > 0 ? "inbound" : "outbound";

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-20 pt-6 sm:px-7 sm:pt-8">
      <header className="border-b-[1.5px] border-ink/30 pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Your queue
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl">
          Intros
        </h1>
        <p className="mt-3 max-w-prose font-serif text-base text-ink-2">
          Requests you&apos;ve sent through GOEO, plus accepted intros
          where you&apos;re the target.
        </p>

        <nav aria-label="Intros queue" className="mt-5 flex flex-wrap gap-2">
          <TabLink
            label={`Outbound (${outboundRows.length})`}
            href="/me/intros?tab=outbound"
            active={tab === "outbound"}
          />
          <TabLink
            label={`Inbound (${inboundRows.length})`}
            href="/me/intros?tab=inbound"
            active={tab === "inbound"}
            disabled={inboundRows.length === 0}
          />
        </nav>
      </header>

      {tab === "outbound" ? (
        <OutboundView rows={outboundRows} />
      ) : (
        <InboundView rows={inboundRows} />
      )}
    </div>
  );
}

function TabLink({
  label,
  href,
  active,
  disabled,
}: {
  label: string;
  href: string;
  active: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span
        role="link"
        aria-disabled="true"
        className="inline-flex h-10 min-h-[44px] cursor-not-allowed items-center justify-center rounded-pill border-[1.5px] border-ink/20 bg-paper-2 px-4 font-mono text-xs uppercase tracking-wider text-ink-3"
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper"
          : "inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink/40 px-4 font-mono text-xs uppercase tracking-wider text-ink-2 hover:bg-paper-2"
      }
    >
      {label}
    </Link>
  );
}

function OutboundView({
  rows,
}: {
  rows: Array<{
    intro: typeof introRequests.$inferSelect;
    targetInvestorSlug: string | null;
    targetInvestorName: string | null;
    targetInvestorFirm: string | null;
    targetCompanySlug: string | null;
    targetCompanyName: string | null;
  }>;
}) {
  if (rows.length === 0) {
    return (
      <Tile variant="subtle" shadow="none" className="mt-8 p-8 text-center">
        <p className="font-serif text-xl text-ink-2">
          No outbound requests yet.
        </p>
        <p className="mt-2 text-sm text-ink-3">
          Send your first request from{" "}
          <Link
            href="/investors/all"
            className="underline decoration-ember/40 hover:decoration-ember"
          >
            the investor directory
          </Link>{" "}
          or any company profile.
        </p>
      </Tile>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {rows.map((row) => {
        const targetName =
          row.targetInvestorName ??
          row.targetInvestorFirm ??
          row.targetCompanyName ??
          "(unknown)";
        const targetUrl = row.targetInvestorSlug
          ? `/investors/${row.targetInvestorSlug}`
          : row.targetCompanySlug
            ? `/startups/${row.targetCompanySlug}`
            : null;
        return (
          <li key={row.intro.id}>
            <Tile variant="default" shadow="sketch" className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg leading-tight">
                    Intro to{" "}
                    {targetUrl ? (
                      <Link
                        href={targetUrl}
                        className="underline-offset-2 hover:underline"
                      >
                        {targetName}
                      </Link>
                    ) : (
                      targetName
                    )}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                    submitted{" "}
                    {row.intro.submittedAt
                      ? new Date(row.intro.submittedAt).toLocaleDateString()
                      : "—"}
                    {row.intro.reviewedAt
                      ? ` · reviewed ${new Date(row.intro.reviewedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-ink-2">
                    {row.intro.messageText}
                  </p>
                  {row.intro.adminNotes ? (
                    <p className="mt-3 rounded-tile border border-topo bg-paper-2 p-3 text-sm text-ink-2">
                      <strong>GOEO note:</strong> {row.intro.adminNotes}
                    </p>
                  ) : null}
                </div>
                <Chip tone={STATUS_CHIP[row.intro.status] ?? "stone"}>
                  {row.intro.status}
                </Chip>
              </div>
            </Tile>
          </li>
        );
      })}
    </ul>
  );
}

function InboundView({
  rows,
}: {
  rows: Array<{
    intro: typeof introRequests.$inferSelect;
    requesterEmail: string | null;
    requesterName: string | null;
  }>;
}) {
  if (rows.length === 0) {
    return (
      <Tile variant="subtle" shadow="none" className="mt-8 p-8 text-center">
        <p className="font-serif text-xl text-ink-2">
          No inbound intros yet.
        </p>
        <p className="mt-2 text-sm text-ink-3">
          When GOEO accepts an intro request to you, it&apos;ll show up here.
        </p>
      </Tile>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {rows.map((row) => (
        <li key={row.intro.id}>
          <Tile variant="default" shadow="sketch" className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg leading-tight">
                  Intro from{" "}
                  {row.requesterName ?? row.requesterEmail ?? "(unknown)"}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  {row.requesterEmail ?? ""} ·{" "}
                  <span className="rounded bg-paper-2 px-1">
                    {row.intro.requesterRole}
                  </span>{" "}
                  · accepted{" "}
                  {row.intro.reviewedAt
                    ? new Date(row.intro.reviewedAt).toLocaleDateString()
                    : "—"}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink-2">
                  {row.intro.messageText}
                </p>
                {row.intro.adminNotes ? (
                  <p className="mt-3 rounded-tile border border-topo bg-paper-2 p-3 text-sm text-ink-2">
                    <strong>GOEO note:</strong> {row.intro.adminNotes}
                  </p>
                ) : null}
              </div>
              <Chip tone={STATUS_CHIP[row.intro.status] ?? "stone"}>
                {row.intro.status}
              </Chip>
            </div>
          </Tile>
        </li>
      ))}
    </ul>
  );
}
