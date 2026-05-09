import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/db/schema";
import { ScribbleDivider } from "@/components/brand";

export const dynamic = "force-dynamic";

const STATUS_CHIP = (lastUpdatedAt: Date | null) => {
  if (!lastUpdatedAt)
    return "rounded-pill bg-stone px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3";
  const ageDays = Math.floor(
    (Date.now() - lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (ageDays < 30)
    return "rounded-pill bg-sage-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage";
  if (ageDays < 180)
    return "rounded-pill bg-ember-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember";
  return "rounded-pill border border-danger bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-danger";
};

const statusLabel = (lastUpdatedAt: Date | null) => {
  if (!lastUpdatedAt) return "draft";
  const ageDays = Math.floor(
    (Date.now() - lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (ageDays < 30) return "live";
  if (ageDays < 180) return "stale";
  return "outdated";
};

export default async function AdminResourcesPage() {
  const rows = await db()
    .select()
    .from(resources)
    .orderBy(desc(resources.lastUpdatedAt))
    .limit(100);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Content
          </p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            Manage resources
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {rows.length} shown · 100 max per page
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className="rounded-tile border-[1.5px] border-ember bg-ember px-3 py-2 text-sm font-medium text-paper shadow-sketch"
        >
          + New resource
        </Link>
      </header>
      <ScribbleDivider className="my-5" />
      {rows.length === 0 ? (
        <p className="rounded-tile border border-dashed border-topo bg-paper-2 p-6 text-center text-sm text-ink-3">
          No resources yet.
        </p>
      ) : (
        <>
      <div className="hidden lg:block overflow-x-auto rounded-tile border-[1.5px] border-topo">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper">
            <tr className="text-left">
              <Th>Title</Th>
              <Th>Kind</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-topo bg-paper-2">
                <Td>
                  <Link
                    href={`/admin/resources/${r.id}`}
                    className="font-medium hover:text-ember"
                  >
                    {r.title}
                  </Link>
                </Td>
                <Td>{r.kind ?? "—"}</Td>
                <Td>
                  <span className={STATUS_CHIP(r.lastUpdatedAt)}>
                    {statusLabel(r.lastUpdatedAt)}
                  </span>
                </Td>
                <Td className="text-xs text-ink-3">
                  {r.lastUpdatedAt
                    ? new Date(r.lastUpdatedAt).toLocaleDateString()
                    : "—"}
                </Td>
                <Td>
                  <Link
                    href={`/admin/resources/${r.id}`}
                    className="rounded-pill border border-ink px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ink hover:bg-stone"
                  >
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 lg:hidden">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-tile border-[1.5px] border-topo bg-paper p-4"
          >
            <span className="flex-1 min-w-0">
              <Link
                href={`/admin/resources/${r.id}`}
                className="block font-serif text-lg leading-tight hover:text-ember"
              >
                {r.title}
              </Link>
              <span className="mt-0.5 block text-xs text-ink-3">
                {r.kind ?? "—"} · updated{" "}
                {r.lastUpdatedAt
                  ? new Date(r.lastUpdatedAt).toLocaleDateString()
                  : "—"}
              </span>
            </span>
            <span className={STATUS_CHIP(r.lastUpdatedAt)}>
              {statusLabel(r.lastUpdatedAt)}
            </span>
            <Link
              href={`/admin/resources/${r.id}`}
              className="inline-flex min-h-[44px] items-center rounded-pill border border-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-stone"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
        </>
      )}
    </div>
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
