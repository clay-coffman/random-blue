import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions, companies } from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { ScribbleDivider } from "@/components/brand";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  pending:
    "rounded-pill bg-ember-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ember",
  approved:
    "rounded-pill bg-sage-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sage",
  rejected:
    "rounded-pill border border-danger bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-danger",
  needs_more_info:
    "rounded-pill bg-stone px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3",
};

export default async function AdminSubmissionsPage() {
  const rows = await db()
    .select({
      submission: businessOwnershipSubmissions,
      company: companies,
      userEmail: userTable.email,
      userName: userTable.name,
    })
    .from(businessOwnershipSubmissions)
    .leftJoin(
      companies,
      eq(businessOwnershipSubmissions.companyId, companies.id),
    )
    .leftJoin(
      userTable,
      eq(businessOwnershipSubmissions.userId, userTable.id),
    )
    .orderBy(
      desc(businessOwnershipSubmissions.status),
      desc(businessOwnershipSubmissions.submittedAt),
    );

  const pendingFirst = [...rows].sort((a, b) => {
    if (a.submission.status === "pending" && b.submission.status !== "pending")
      return -1;
    if (a.submission.status !== "pending" && b.submission.status === "pending")
      return 1;
    const ad = a.submission.submittedAt?.getTime() ?? 0;
    const bd = b.submission.submittedAt?.getTime() ?? 0;
    return bd - ad;
  });

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Moderation
          </p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            Claim queue
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {rows.length} total · {rows.filter((r) => r.submission.status === "pending").length}{" "}
            pending
          </p>
        </div>
      </header>
      <ScribbleDivider className="my-5" />
      {pendingFirst.length === 0 ? (
        <p className="rounded-tile border border-dashed border-topo bg-paper-2 p-6 text-center text-sm text-ink-3">
          No submissions yet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {pendingFirst.map(({ submission, company, userEmail, userName }) => (
            <li
              key={submission.id}
              className="flex flex-wrap items-center gap-3 rounded-tile border-[1.5px] border-topo bg-paper p-4"
            >
              <span className="flex-1">
                <Link
                  href={`/admin/submissions/${submission.id}`}
                  className="font-serif text-lg leading-tight hover:text-ember"
                >
                  {company?.name ?? "(unknown company)"}
                </Link>
                <span className="block text-xs text-ink-3">
                  {userName ?? "(unknown)"} · {userEmail ?? "—"} · submitted{" "}
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleString()
                    : "—"}
                </span>
              </span>
              <span className={STATUS_CHIP[submission.status] ?? STATUS_CHIP.pending}>
                {submission.status}
              </span>
              <Link
                href={`/admin/submissions/${submission.id}`}
                className="rounded-pill border border-ember px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ember hover:bg-ember-tint"
              >
                Review →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
