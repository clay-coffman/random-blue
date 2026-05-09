import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/auth";
import { db } from "@/lib/db";
import { founderPassports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ScribbleDivider } from "@/components/brand";

export const dynamic = "force-dynamic";

const COPY: Record<
  string,
  { title: string; lede: string; cta: { label: string; href: string } }
> = {
  founder: {
    title: "Welcome, founder.",
    lede: "Your passport is saved. Here's your 90-day plan.",
    cta: { label: "See my 90-day plan →", href: "/founder" },
  },
  owner: {
    title: "Welcome, owner.",
    lede: "Verify your domain to publish updates to your company profile.",
    cta: { label: "Find my company →", href: "/onboarding/owner" },
  },
  investor: {
    title: "Welcome, investor.",
    lede: "Your map is filtered to match your preferences.",
    cta: { label: "Open the map →", href: "/map" },
  },
};

export default async function OnboardingDonePage() {
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/onboarding/done");

  const role = (session.user as { role?: string }).role ?? "founder";
  const copy = COPY[role] ?? COPY.founder;

  // Founders: if they already have a passport, link to that plan.
  let ctaHref = copy.cta.href;
  if (role === "founder") {
    const [latest] = await db()
      .select({ id: founderPassports.id })
      .from(founderPassports)
      .where(eq(founderPassports.userId, session.user.id))
      .orderBy(desc(founderPassports.createdAt))
      .limit(1);
    if (latest) ctaHref = `/plan/${latest.id}`;
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-180px)] max-w-md flex-col items-center px-4 py-16 text-center sm:px-7">
      <span
        aria-hidden
        className="mb-4 grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-sage bg-sage-tint font-serif text-4xl text-sage"
      >
        ✓
      </span>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        {role.toUpperCase()} · all set
      </p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">{copy.lede}</p>
      <ScribbleDivider className="my-6" />
      <Link
        href={ctaHref}
        className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover"
      >
        {copy.cta.label}
      </Link>
      <Link
        href="/settings"
        className="mt-4 font-mono text-xs uppercase tracking-wider text-ink-3 hover:text-ember"
      >
        Or visit settings →
      </Link>
    </section>
  );
}
