import { headers } from "next/headers";
import { desc, or, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminInvites } from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { getAuth } from "@/auth";
import { isSuperadmin } from "@/lib/auth-utils";
import { ScribbleDivider } from "@/components/brand";
import { InviteAdminForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isSuperadmin(role)) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-2xl">Superadmin only.</h1>
        <p className="mt-2 text-sm text-ink-2">
          This view manages who has admin access. You don&rsquo;t have
          permission.
        </p>
      </div>
    );
  }

  const [admins, invites] = await Promise.all([
    db()
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        role: userTable.role,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(or(eq(userTable.role, "goeo_admin"), eq(userTable.role, "superadmin")))
      .orderBy(desc(userTable.createdAt)),
    db()
      .select()
      .from(adminInvites)
      .orderBy(desc(adminInvites.createdAt))
      .limit(20),
  ]);

  return (
    <div>
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          People
        </p>
        <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          Admins
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          {admins.length} active · {invites.filter((i) => !i.consumedAt).length}{" "}
          pending invites
        </p>
      </header>
      <ScribbleDivider className="my-5" />

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-tile border-[1.5px] border-topo">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-paper">
              <tr className="text-left">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t border-topo bg-paper-2">
                  <Td>{a.name}</Td>
                  <Td className="font-mono text-xs">{a.email}</Td>
                  <Td>
                    <span
                      className={
                        a.role === "superadmin"
                          ? "rounded-pill bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper"
                          : "rounded-pill bg-stone px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink"
                      }
                    >
                      {a.role}
                    </span>
                  </Td>
                  <Td className="text-xs text-ink-3">
                    {a.createdAt
                      ? new Date(a.createdAt).toLocaleDateString()
                      : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="space-y-4">
          <div className="rounded-tile border-[1.5px] border-ember bg-ember-tint p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ember">
              + Invite admin
            </p>
            <InviteAdminForm />
          </div>
          <div className="rounded-tile border border-topo bg-paper-2 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Recent invites
            </p>
            <ul className="mt-2 grid gap-2 text-sm">
              {invites.length === 0 ? (
                <li className="text-ink-3">None yet.</li>
              ) : (
                invites.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center gap-2 border-t border-topo pt-2 first:border-0 first:pt-0"
                  >
                    <span className="flex-1 font-mono text-xs">{i.email}</span>
                    {i.consumedAt ? (
                      <span className="rounded-pill bg-sage-tint px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-sage">
                        accepted
                      </span>
                    ) : i.expiresAt && i.expiresAt.getTime() < Date.now() ? (
                      <span className="rounded-pill bg-stone px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-3">
                        expired
                      </span>
                    ) : (
                      <span className="rounded-pill bg-ember-tint px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ember">
                        pending
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
          <p className="text-xs text-ink-3">
            Superadmins are minted only via the bootstrap script
            (<code className="font-mono">npm run bootstrap-superadmin
            &lt;email&gt;</code>). Invites here grant{" "}
            <code className="font-mono">goeo_admin</code> only.
          </p>
        </aside>
      </section>
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
