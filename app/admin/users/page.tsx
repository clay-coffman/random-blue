import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema.auth";
import { getAuth } from "@/auth";
import { isSuperadmin } from "@/lib/auth-utils";
import { ScribbleDivider } from "@/components/brand";
import { UserRoleDropdown } from "./_dropdown";

export const dynamic = "force-dynamic";

const ROLE_FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "founder", label: "Founder" },
  { id: "owner", label: "Owner" },
  { id: "investor", label: "Investor" },
  { id: "admin", label: "Admin" },
];

const ROLE_CHIP: Record<string, string> = {
  founder: "rounded-pill bg-sky-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sky",
  owner: "rounded-pill bg-sage-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage",
  investor: "rounded-pill bg-ember-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember",
  goeo_admin: "rounded-pill bg-stone px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink",
  superadmin: "rounded-pill bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filter = params.role ?? "all";
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  const isSuper = isSuperadmin(
    (session?.user as { role?: string } | undefined)?.role,
  );

  const allRows = await db()
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      emailVerified: userTable.emailVerified,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .orderBy(desc(userTable.createdAt));

  const counts = {
    all: allRows.length,
    founder: allRows.filter((r) => r.role === "founder").length,
    owner: allRows.filter((r) => r.role === "owner").length,
    investor: allRows.filter((r) => r.role === "investor").length,
    admin: allRows.filter(
      (r) => r.role === "goeo_admin" || r.role === "superadmin",
    ).length,
  };
  const visible = allRows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "admin") return r.role === "goeo_admin" || r.role === "superadmin";
    return r.role === filter;
  });

  const myUserId = session?.user.id;

  return (
    <div>
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          People
        </p>
        <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          All users
        </h1>
        <p className="mt-1 text-sm text-ink-3">{allRows.length} total</p>
      </header>
      <ScribbleDivider className="my-5" />

      {/* Role filter chips */}
      <ul className="mb-5 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider">
        {ROLE_FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <li key={f.id}>
              <a
                href={`/admin/users?role=${f.id}`}
                className={
                  isActive
                    ? "rounded-pill border-[1.5px] border-ember bg-ember-tint px-3 py-1 text-ember"
                    : "rounded-pill border border-topo bg-paper px-3 py-1 text-ink-3 hover:border-ink"
                }
              >
                {f.label} · {counts[f.id as keyof typeof counts]}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="hidden lg:block overflow-x-auto rounded-tile border-[1.5px] border-topo">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper">
            <tr className="text-left">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th>{isSuper ? "Action" : ""}</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => {
              const isSelf = u.id === myUserId;
              return (
                <tr key={u.id} className="border-t border-topo bg-paper-2">
                  <Td>{u.name}</Td>
                  <Td className="font-mono text-xs">{u.email}</Td>
                  <Td>
                    <span
                      className={ROLE_CHIP[u.role] ?? ROLE_CHIP.founder}
                    >
                      {u.role}
                    </span>
                  </Td>
                  <Td>
                    {u.emailVerified ? (
                      <span className="rounded-pill bg-sage-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage">
                        verified
                      </span>
                    ) : (
                      <span className="rounded-pill bg-ember-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember">
                        pending
                      </span>
                    )}
                  </Td>
                  <Td className="text-xs text-ink-3">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </Td>
                  <Td>
                    {isSuper && !isSelf && u.role !== "superadmin" ? (
                      <UserRoleDropdown
                        userId={u.id}
                        currentRole={u.role}
                      />
                    ) : (
                      <span className="text-xs text-ink-3">
                        {isSelf ? "(you)" : ""}
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 lg:hidden">
        {visible.map((u) => {
          const isSelf = u.id === myUserId;
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-tile border-[1.5px] border-topo bg-paper p-4"
            >
              <span className="flex-1 min-w-0">
                <span className="block font-serif text-lg leading-tight">
                  {u.name}
                  {isSelf ? (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                      (you)
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block break-all font-mono text-xs text-ink-3">
                  {u.email}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                  {u.emailVerified ? (
                    <span className="rounded-pill bg-sage-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage">
                      verified
                    </span>
                  ) : (
                    <span className="rounded-pill bg-ember-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember">
                      pending
                    </span>
                  )}
                  <span>
                    joined{" "}
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </span>
              </span>
              <span className={ROLE_CHIP[u.role] ?? ROLE_CHIP.founder}>
                {u.role}
              </span>
              {isSuper && !isSelf && u.role !== "superadmin" ? (
                <UserRoleDropdown userId={u.id} currentRole={u.role} />
              ) : null}
            </li>
          );
        })}
      </ul>
      {!isSuper ? (
        <p className="mt-3 text-xs text-ink-3">
          Only superadmins can change roles. Use the bootstrap script for
          first-superadmin setup.
        </p>
      ) : null}
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
