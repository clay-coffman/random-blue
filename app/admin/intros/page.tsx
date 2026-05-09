import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, introRequests, investorProfiles } from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { ScribbleDivider } from "@/components/brand";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  pending:
    "rounded-pill bg-ember-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ember",
  accepted:
    "rounded-pill bg-sage-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sage",
  declined:
    "rounded-pill border border-danger bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-danger",
  introduced:
    "rounded-pill bg-stone px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3",
};

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  accepted: 1,
  introduced: 2,
  declined: 3,
};

export default async function AdminIntrosPage() {
  const rows = await db()
    .select({
      intro: introRequests,
      requesterEmail: userTable.email,
      requesterName: userTable.name,
      targetInvestorName: investorProfiles.displayName,
      targetInvestorFirm: investorProfiles.firmName,
      targetInvestorSlug: investorProfiles.slug,
      targetCompanyName: companies.name,
      targetCompanySlug: companies.slug,
    })
    .from(introRequests)
    .leftJoin(userTable, eq(introRequests.requesterUserId, userTable.id))
    .leftJoin(
      investorProfiles,
      eq(introRequests.targetInvestorId, investorProfiles.id),
    )
    .leftJoin(companies, eq(introRequests.targetCompanyId, companies.id))
    .orderBy(desc(introRequests.submittedAt));

  const sorted = [...rows].sort((a, b) => {
    const ra = STATUS_RANK[a.intro.status] ?? 99;
    const rb = STATUS_RANK[b.intro.status] ?? 99;
    if (ra !== rb) return ra - rb;
    const ad = a.intro.submittedAt?.getTime() ?? 0;
    const bd = b.intro.submittedAt?.getTime() ?? 0;
    return bd - ad;
  });

  const counts = {
    total: rows.length,
    pending: rows.filter((r) => r.intro.status === "pending").length,
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Brokerage
          </p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            Intro requests
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {counts.total} total · {counts.pending} pending
          </p>
        </div>
      </header>
      <ScribbleDivider className="my-5" />
      {sorted.length === 0 ? (
        <p className="rounded-tile border border-dashed border-topo bg-paper-2 p-6 text-center text-sm text-ink-3">
          No intro requests yet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {sorted.map((row) => {
            const targetName =
              row.targetInvestorName ??
              row.targetInvestorFirm ??
              row.targetCompanyName ??
              "(unknown target)";
            const targetType = row.intro.targetInvestorId ? "investor" : "company";
            const targetUrl = row.targetInvestorSlug
              ? `/investors/${row.targetInvestorSlug}`
              : row.targetCompanySlug
                ? `/startups/${row.targetCompanySlug}`
                : null;
            const preview = row.intro.messageText.slice(0, 80);
            return (
              <li
                key={row.intro.id}
                className="rounded-tile border-[1.5px] border-topo bg-paper p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/intros/${row.intro.id}`}
                      className="font-serif text-lg leading-tight hover:text-ember"
                    >
                      {row.requesterName ?? row.requesterEmail ?? "(unknown)"}
                      <span className="font-mono text-xs text-ink-3"> →</span>{" "}
                      {targetName}
                    </Link>
                    <span className="block text-xs text-ink-3">
                      {row.requesterEmail ?? "—"} ·{" "}
                      <span className="rounded bg-paper-2 px-1 font-mono">
                        {row.intro.requesterRole}
                      </span>{" "}
                      → {targetType}{" "}
                      {targetUrl ? (
                        <Link
                          href={targetUrl}
                          className="underline-offset-2 hover:underline"
                        >
                          (view profile)
                        </Link>
                      ) : null}{" "}
                      · submitted{" "}
                      {row.intro.submittedAt
                        ? new Date(row.intro.submittedAt).toLocaleString()
                        : "—"}
                    </span>
                    <p className="mt-2 text-sm text-ink-2">
                      &ldquo;{preview}
                      {row.intro.messageText.length > 80 ? "…" : ""}&rdquo;
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={STATUS_CHIP[row.intro.status] ?? STATUS_CHIP.pending}>
                      {row.intro.status}
                    </span>
                    <Link
                      href={`/admin/intros/${row.intro.id}`}
                      className="rounded-pill border border-ember px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ember hover:bg-ember-tint"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
