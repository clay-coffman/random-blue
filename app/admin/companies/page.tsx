import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions, companies } from "@/db/schema";
import { ScribbleDivider } from "@/components/brand";

export const dynamic = "force-dynamic";

const FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "claimed", label: "Claimed" },
  { id: "unclaimed", label: "Unclaimed" },
  { id: "pending", label: "Pending" },
];

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "all";

  // Get all companies + pending submission set in parallel.
  const [allRows, pendingRows] = await Promise.all([
    db()
      .select({
        id: companies.id,
        slug: companies.slug,
        name: companies.name,
        sector: companies.sector,
        stage: companies.stage,
        claimedByUserId: companies.claimedByUserId,
        claimedAt: companies.claimedAt,
      })
      .from(companies)
      .orderBy(desc(companies.claimedAt)),
    db()
      .select({ companyId: businessOwnershipSubmissions.companyId })
      .from(businessOwnershipSubmissions)
      .where(eq(businessOwnershipSubmissions.status, "pending")),
  ]);
  const pendingSet = new Set(pendingRows.map((r) => r.companyId));

  function statusOf(
    r: (typeof allRows)[number],
  ): "claimed" | "pending" | "unclaimed" {
    if (r.claimedByUserId) return "claimed";
    if (pendingSet.has(r.id)) return "pending";
    return "unclaimed";
  }

  const counts = {
    all: allRows.length,
    claimed: allRows.filter((r) => statusOf(r) === "claimed").length,
    pending: allRows.filter((r) => statusOf(r) === "pending").length,
    unclaimed: allRows.filter((r) => statusOf(r) === "unclaimed").length,
  };
  const visible = allRows.filter(
    (r) => filter === "all" || statusOf(r) === filter,
  );

  return (
    <div>
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Content
        </p>
        <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          Manage companies
        </h1>
        <p className="mt-1 text-sm text-ink-3">{counts.all} total</p>
      </header>
      <ScribbleDivider className="my-5" />
      <ul className="mb-5 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider">
        {FILTERS.map((f) => (
          <li key={f.id}>
            <a
              href={`/admin/companies?filter=${f.id}`}
              className={
                filter === f.id
                  ? "rounded-pill border-[1.5px] border-ember bg-ember-tint px-3 py-1 text-ember"
                  : "rounded-pill border border-topo bg-paper px-3 py-1 text-ink-3 hover:border-ink"
              }
            >
              {f.label} · {counts[f.id as keyof typeof counts]}
            </a>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="rounded-tile border border-dashed border-topo bg-paper-2 p-6 text-center text-sm text-ink-3">
          No companies match this filter.
        </p>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto rounded-tile border-[1.5px] border-topo">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-paper">
                <tr className="text-left">
                  <Th>Company</Th>
                  <Th>Sector</Th>
                  <Th>Stage</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const status = statusOf(c);
                  return (
                    <tr key={c.id} className="border-t border-topo bg-paper-2">
                      <Td>
                        <Link
                          href={`/companies/${c.slug}/edit`}
                          className="font-medium hover:text-ember"
                        >
                          {c.name}
                        </Link>
                      </Td>
                      <Td>{c.sector ?? "—"}</Td>
                      <Td>{c.stage ?? "—"}</Td>
                      <Td>
                        <StatusChip status={status} />
                      </Td>
                      <Td>
                        {status === "pending" ? (
                          <Link
                            href={`/admin/submissions?company=${c.slug}`}
                            className="rounded-pill border border-ember px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ember hover:bg-ember-tint"
                          >
                            Review
                          </Link>
                        ) : (
                          <Link
                            href={`/companies/${c.slug}/edit`}
                            className="rounded-pill border border-ink px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ink hover:bg-stone"
                          >
                            Edit
                          </Link>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-2 lg:hidden">
            {visible.map((c) => {
              const status = statusOf(c);
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-tile border-[1.5px] border-topo bg-paper p-4"
                >
                  <span className="flex-1 min-w-0">
                    <Link
                      href={`/companies/${c.slug}/edit`}
                      className="block font-serif text-lg leading-tight hover:text-ember"
                    >
                      {c.name}
                    </Link>
                    <span className="mt-0.5 block text-xs text-ink-3">
                      {c.sector ?? "—"} · {c.stage ?? "—"}
                    </span>
                  </span>
                  <StatusChip status={status} />
                  {status === "pending" ? (
                    <Link
                      href={`/admin/submissions?company=${c.slug}`}
                      className="inline-flex min-h-[44px] items-center rounded-pill border border-ember px-4 py-2 font-mono text-xs uppercase tracking-wider text-ember hover:bg-ember-tint"
                    >
                      Review
                    </Link>
                  ) : (
                    <Link
                      href={`/companies/${c.slug}/edit`}
                      className="inline-flex min-h-[44px] items-center rounded-pill border border-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-stone"
                    >
                      Edit
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function StatusChip({
  status,
}: {
  status: "claimed" | "pending" | "unclaimed";
}) {
  const cls =
    status === "claimed"
      ? "bg-sage-tint text-sage"
      : status === "pending"
        ? "bg-ember-tint text-ember"
        : "bg-stone text-ink-3";
  return (
    <span
      className={`rounded-pill px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
