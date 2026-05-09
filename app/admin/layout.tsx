import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/auth";
import { isAdminRole, isSuperadmin } from "@/lib/auth-utils";
import { getPendingSubmissionsCount } from "@/lib/admin/pending";

export const dynamic = "force-dynamic";

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; superadminOnly?: boolean }>;
}> = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Moderation",
    items: [
      { href: "/admin/submissions", label: "Claim queue" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/resources", label: "Resources" },
      { href: "/admin/companies", label: "Companies" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", superadminOnly: true },
      { href: "/admin/admins", label: "Admins", superadminOnly: true },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/admin");
  const role = (session.user as { role?: string }).role ?? "founder";
  if (!isAdminRole(role)) redirect("/?error=forbidden");
  const isSuper = isSuperadmin(role);

  const user = session.user as { name: string; email: string };
  const pendingSubmissions = await getPendingSubmissionsCount();
  const pendingByRoute: Record<string, number> = {
    "/admin/submissions": pendingSubmissions,
  };

  return (
    <div className="grid min-h-[calc(100dvh-100px)] grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="bg-ink text-paper">
        <div className="flex h-full flex-col gap-6 p-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-topo">
              Atlas · Admin
            </p>
            <p className="mt-1 font-serif text-2xl leading-tight">Console</p>
          </div>
          <nav aria-label="Admin sections" className="flex-1 space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-topo">
                  {group.label}
                </p>
                <ul className="mt-2 grid gap-1">
                  {group.items
                    .filter((it) => !it.superadminOnly || isSuper)
                    .map((it) => {
                      const pending = pendingByRoute[it.href] ?? 0;
                      return (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            className="flex items-center gap-2 rounded-tile px-2 py-1.5 text-sm hover:bg-ink-2"
                          >
                            <span className="flex-1">◇ {it.label}</span>
                            {pending > 0 ? (
                              <span
                                aria-label={`${pending} pending`}
                                className="h-1.5 w-1.5 rounded-full bg-ember"
                              />
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="rounded-tile border border-ink-2 bg-ink-2 p-3 text-xs">
            <p className="font-mono uppercase tracking-wider text-topo">
              Signed in as
            </p>
            <p className="mt-1 truncate font-medium">{user.name}</p>
            <p className="truncate text-[10px] text-topo">{user.email}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ember-tint">
              {role}
            </p>
            <Link
              href="/"
              className="mt-3 block text-[11px] text-paper underline-offset-4 hover:underline"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </aside>
      <main className="bg-paper-2 px-4 py-6 sm:px-7">{children}</main>
    </div>
  );
}
