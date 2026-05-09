import Link from "next/link";
import { count, desc, eq, gte } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  businessOwnershipSubmissions,
  companies,
  profileUpdates,
  resources,
} from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { getAuth } from "@/auth";
import { ScribbleDivider } from "@/components/brand";
import { getPendingSubmissionsCount } from "@/lib/admin/pending";

export const dynamic = "force-dynamic";

async function loadStats() {
  const [[{ users }], [{ companiesC }], [{ resourcesC }], pending] =
    await Promise.all([
      db().select({ users: count() }).from(userTable),
      db().select({ companiesC: count() }).from(companies),
      db().select({ resourcesC: count() }).from(resources),
      getPendingSubmissionsCount(),
    ]);

  // Week-over-week: rough deltas from created_at on user, companies
  // (claimed in past 7 days as proxy), resources lastUpdatedAt.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [[{ usersWeek }], [{ claimedWeek }]] = await Promise.all([
    db()
      .select({ usersWeek: count() })
      .from(userTable)
      .where(gte(userTable.createdAt, weekAgo)),
    db()
      .select({ claimedWeek: count() })
      .from(companies)
      .where(gte(companies.claimedAt, weekAgo)),
  ]);

  return {
    users,
    companies: companiesC,
    resources: resourcesC,
    pending,
    usersWeek,
    claimedWeek,
  };
}

async function loadQueueSummary() {
  return db()
    .select({
      id: businessOwnershipSubmissions.id,
      submittedAt: businessOwnershipSubmissions.submittedAt,
      status: businessOwnershipSubmissions.status,
      companyName: companies.name,
      companySlug: companies.slug,
      userId: businessOwnershipSubmissions.userId,
      userEmail: userTable.email,
    })
    .from(businessOwnershipSubmissions)
    .leftJoin(
      companies,
      eq(businessOwnershipSubmissions.companyId, companies.id),
    )
    .leftJoin(userTable, eq(businessOwnershipSubmissions.userId, userTable.id))
    .where(eq(businessOwnershipSubmissions.status, "pending"))
    .orderBy(desc(businessOwnershipSubmissions.submittedAt))
    .limit(4);
}

async function loadRecentEdits() {
  return db()
    .select({
      id: profileUpdates.id,
      appliedAt: profileUpdates.appliedAt,
      sourceClient: profileUpdates.sourceClient,
      patchJson: profileUpdates.patchJson,
      companySlug: companies.slug,
      companyName: companies.name,
    })
    .from(profileUpdates)
    .leftJoin(companies, eq(profileUpdates.companyId, companies.id))
    .orderBy(desc(profileUpdates.appliedAt))
    .limit(4);
}

export default async function AdminDashboard() {
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  const userName = (session?.user.name ?? "there").split(" ")[0];

  const [stats, queue, edits] = await Promise.all([
    loadStats(),
    loadQueueSummary(),
    loadRecentEdits(),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Last 7 days
          </p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            Good morning, {userName}.
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/admins"
            className="rounded-tile border border-ink bg-paper px-3 py-2 text-sm"
          >
            + Invite admin
          </Link>
          <Link
            href="/admin/companies"
            className="rounded-tile border-[1.5px] border-ember bg-ember px-3 py-2 text-sm font-medium text-paper shadow-sketch"
          >
            + New company
          </Link>
        </div>
      </header>

      {/* Stats row */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Users" value={stats.users} delta={`+${stats.usersWeek} this week`} />
        <Stat
          label="Companies"
          value={stats.companies}
          delta={`+${stats.claimedWeek} claimed`}
        />
        <Stat label="Resources" value={stats.resources} delta="" />
        <Stat
          label="Claim queue"
          value={stats.pending}
          delta={
            stats.pending > 0
              ? `${stats.pending} need review`
              : "all caught up"
          }
          highlight={stats.pending > 0}
        />
        <Stat label="Reports" value={0} delta="—" />
      </ul>

      <ScribbleDivider />

      {/* Two-column body */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <header className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl">Claim queue · needs review</h2>
            <Link
              href="/admin/submissions"
              className="font-mono text-[10px] uppercase tracking-wider text-ember hover:underline"
            >
              View all {stats.pending} →
            </Link>
          </header>
          <ul className="mt-3 grid gap-2">
            {queue.length === 0 ? (
              <li className="rounded-tile border border-dashed border-topo bg-paper-2 p-4 text-sm text-ink-3">
                No pending submissions. ✓
              </li>
            ) : (
              queue.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center gap-2 rounded-tile border border-topo bg-paper-2 p-3"
                >
                  <span className="flex-1">
                    <Link
                      href={`/admin/submissions/${q.id}`}
                      className="font-medium hover:text-ember"
                    >
                      {q.companyName ?? "(unknown)"}
                    </Link>
                    <span className="block truncate text-xs text-ink-3">
                      {q.userEmail ?? "(unknown user)"} ·{" "}
                      {q.submittedAt
                        ? new Date(q.submittedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </span>
                  <Link
                    href={`/admin/submissions/${q.id}`}
                    className="rounded-pill border border-ember px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ember hover:bg-ember-tint"
                  >
                    Review →
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <header className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl">Recent agent edits</h2>
          </header>
          <ul className="mt-3 grid gap-2">
            {edits.length === 0 ? (
              <li className="rounded-tile border border-dashed border-topo bg-paper-2 p-4 text-sm text-ink-3">
                No edits yet.
              </li>
            ) : (
              edits.map((e) => {
                const fields = (() => {
                  try {
                    return Object.keys(JSON.parse(e.patchJson));
                  } catch {
                    return [];
                  }
                })();
                return (
                  <li
                    key={e.id}
                    className="rounded-tile border border-topo bg-paper-2 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {e.companyName ?? "(unknown)"}
                      </span>
                      <SourceClientChip source={e.sourceClient ?? "owner"} />
                    </div>
                    <p className="mt-1 text-xs text-ink-3">
                      changed {fields.length} field
                      {fields.length === 1 ? "" : "s"}:{" "}
                      <code>{fields.slice(0, 4).join(", ") || "—"}</code>{" "}
                      ·{" "}
                      {e.appliedAt
                        ? new Date(e.appliedAt).toLocaleString()
                        : "—"}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>

      {/* Coverage gaps section deferred until Phase 5 wires real
          aggregation queries (counties × resources, tag staleness,
          sector hiring). Hardcoded placeholder removed to avoid
          misleading admins in production. */}
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  highlight,
}: {
  label: string;
  value: number;
  delta: string;
  highlight?: boolean;
}) {
  return (
    <li
      className={`rounded-tile border-[1.5px] p-4 ${
        highlight
          ? "border-ember bg-ember-tint shadow-sketch"
          : "border-topo bg-paper"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </p>
      <p className="mt-1 font-serif text-3xl leading-none">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-ink-3">{delta}</p>
    </li>
  );
}

function SourceClientChip({ source }: { source: string }) {
  const styles =
    source === "claude.ai" || source.startsWith("claude")
      ? "bg-sky-tint text-sky"
      : source === "chatgpt.com" || source.startsWith("chatgpt")
        ? "bg-sage-tint text-sage"
        : source === "machine"
          ? "bg-stone text-ink-2"
          : source === "staff"
            ? "bg-ember-tint text-ember"
            : "bg-paper border border-topo text-ink-3";
  return (
    <span
      className={`rounded-pill px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${styles}`}
    >
      via {source}
    </span>
  );
}
