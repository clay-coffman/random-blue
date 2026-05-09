import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { getAuth } from "@/auth";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions } from "@/db/schema";
import { ScribbleDivider } from "@/components/brand";

export const dynamic = "force-dynamic";

type Card = {
  href: string;
  title: string;
  desc: string;
  badge?: string;
};

export default async function MeHubPage() {
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/me");
  const user = session.user as {
    name?: string | null;
    email: string;
    role?: string | null;
  };
  const role = user.role ?? "founder";
  const display = (user.name ?? "").trim() || user.email.split("@")[0];

  // Pending-submission count drives the badge on the verification card.
  // Counted across all roles since claiming isn't role-gated.
  const pending = await db()
    .select({ id: businessOwnershipSubmissions.id })
    .from(businessOwnershipSubmissions)
    .where(
      and(
        eq(businessOwnershipSubmissions.userId, session.user.id),
        inArray(businessOwnershipSubmissions.status, [
          "pending",
          "needs_more_info",
        ]),
      ),
    );
  const pendingCount = pending.length;

  const cards: Card[] = [];

  if (role === "founder") {
    cards.push({
      href: "/me/plan",
      title: "Your 90-day plan",
      desc: "The most recent passport you submitted, plus your matched resources.",
    });
  }
  if (role === "investor") {
    cards.push(
      {
        href: "/me/investor",
        title: "Your investor profile",
        desc: "Edit the public-facing version that shows on the directory.",
      },
      {
        href: "/me/saved",
        title: "Saved companies",
        desc: "Companies you’ve bookmarked from the map.",
      },
      {
        href: "/me/intros",
        title: "Intros",
        desc: "Track intro requests and responses from GOEO.",
      },
    );
  }
  // Owner-leaning users get a "find your company" card. We surface it
  // for every non-investor / non-admin role since claiming isn't gated.
  if (role === "founder" || role === "owner") {
    cards.push({
      href: "/onboarding/owner",
      title: "Find your company",
      desc: "Search the Atlas index and start a verification claim.",
    });
  }
  if (role === "goeo_admin" || role === "superadmin") {
    cards.push({
      href: "/admin",
      title: "Admin dashboard",
      desc: "Submissions queue, intro requests, companies CRUD, users.",
    });
  }

  // Verification submissions card is universal for non-admins so anyone
  // who's started a claim can find it back.
  if (role !== "goeo_admin" && role !== "superadmin") {
    cards.push({
      href: "/me/submissions",
      title: "Verification submissions",
      desc: "Status of every claim you’ve uploaded a document for.",
      badge: pendingCount > 0 ? `${pendingCount} pending` : undefined,
    });
  }

  cards.push({
    href: "/settings",
    title: "Settings",
    desc: "Profile, security, notifications, agent tokens.",
  });

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-7">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        You
      </p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Hi, {display}.
      </h1>
      <ScribbleDivider className="my-6" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block h-full rounded-tile border-[1.5px] border-topo bg-paper-2 p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-sketch"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-serif text-lg font-medium leading-snug">
                  {c.title}
                </p>
                {c.badge ? (
                  <span className="rounded-pill bg-ember-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember">
                    {c.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-3">
                {c.desc}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
