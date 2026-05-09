import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getAuth } from "@/auth";
import { db } from "@/lib/db";
import { founderPassports } from "@/db/schema";
import {
  personaFixtures,
  personaIdFromPassport,
} from "@/lib/intake-fixtures";
import { recommendMock } from "@/lib/recommend-mock";
import { ResultsView } from "../_components/ResultsView";
import { LocalPlanLoader } from "../_components/LocalPlanLoader";
import { SaveYourPlanCta } from "../_components/SaveYourPlanCta";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claim?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  // Persona fixtures get a friendly slug ("priya_founder_plan"); real
  // plans drop the random hash from the title since it isn't useful as
  // a tab label.
  const personaId = personaIdFromPassport(id);
  const planLabel = personaId ? `${personaId}_founder_plan` : null;
  return {
    title: planLabel
      ? `90-day plan · ${planLabel} — Atlas`
      : "90-day plan — Atlas",
    description:
      "Your personalized 90-day startup plan: do this now, do this next, ignore for now.",
  };
}

export default async function PlanPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { claim } = await searchParams;

  // TODO(agent-2): when `/api/v1/founder-passports/[id]/plan` ships,
  // call the loader directly here (not via fetch) — same Worker, no
  // network round-trip. Until then, we synthesise from fixtures.

  // Persona fixture branch — no auth, no DB. Render and return.
  const personaId = personaIdFromPassport(id);
  if (personaId) {
    const input = personaFixtures[personaId];
    const result = recommendMock(input, id);
    return <ResultsView passportId={id} input={input} result={result} />;
  }

  // Anything that doesn't start with `fp_` isn't a passport id at all —
  // 404 before we touch session, DB, or build CTA props.
  if (!id.startsWith("fp_")) {
    notFound();
  }

  // Real passport path. Resolve the current viewer so we can
  // (a) handle a `?claim={id}` from the post-signup redirect and
  // (b) decide whether to render the "Save your plan" CTA. Cookie
  // failures fall through to "anonymous".
  const session = await (await getAuth())
    .api.getSession({ headers: await headers() })
    .catch(() => null);
  const userId = session?.user?.id ?? null;

  // Server-side claim. Only when the URL came from sign-up
  // (?claim={id} matches the route id) AND the passport is unowned.
  // The `isNull(userId)` predicate in the WHERE makes the update
  // atomic — a concurrent claim that already set `user_id` won't be
  // silently overwritten here.
  if (claim === id && userId) {
    await db()
      .update(founderPassports)
      .set({ userId })
      .where(
        and(eq(founderPassports.id, id), isNull(founderPassports.userId)),
      );
    redirect(`/plan/${id}`);
  }

  // CTA visibility: hide when the viewer already owns this passport.
  let cta: React.ReactNode = null;
  let viewerOwnsPlan = false;
  if (userId) {
    const rows = await db()
      .select({ userId: founderPassports.userId })
      .from(founderPassports)
      .where(eq(founderPassports.id, id))
      .limit(1);
    viewerOwnsPlan = rows[0]?.userId === userId;
  }
  if (!viewerOwnsPlan) {
    cta = <SaveYourPlanCta passportId={id} />;
  }

  // Synthetic local id from the form fallback. Hydrate from
  // sessionStorage on the client.
  return <LocalPlanLoader passportId={id} cta={cta} />;
}
