import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getAuth } from "@/auth";
import { db } from "@/lib/db";
import { founderPassports } from "@/db/schema";
import { personaIdFromPassport } from "@/lib/intake-fixtures";
import {
  generatePlanForPassport,
  loadCachedPlan,
} from "@/lib/plan-loader";
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

  // ── Persona branch ─────────────────────────────────────────────
  // Personas go through the same scoring + Claude synthesis as a real
  // intake. First hit ~5-7s; refresh is cache-hot from D1 (~100ms).
  // No auth, no claim, no "save your plan" CTA — they aren't claimable.
  // Run `npm run warm-personas` against prod before a demo to avoid
  // paying that latency in front of an audience.
  const personaId = personaIdFromPassport(id);
  if (personaId) {
    const cached = await loadCachedPlan(id);
    if (cached && cached.result.recommendations.length > 0) {
      return (
        <ResultsView
          passportId={id}
          input={cached.passport}
          result={cached.result}
        />
      );
    }
    try {
      const generated = await generatePlanForPassport(id);
      return (
        <ResultsView
          passportId={id}
          input={generated.passport}
          result={generated.result}
        />
      );
    } catch (err) {
      console.error("[plan/[id]] persona lazy-gen failed", err);
      // Demo safety net: hand off to the client-side sessionStorage path
      // so the page never hard-fails in front of a user.
      return <LocalPlanLoader passportId={id} />;
    }
  }

  // Anything that doesn't start with `fp_` isn't a passport id at all —
  // 404 before we touch session, DB, or build CTA props.
  if (!id.startsWith("fp_")) {
    notFound();
  }

  // ── Real passport path ─────────────────────────────────────────
  // Resolve the current viewer so we can (a) handle a `?claim={id}`
  // from the post-signup redirect and (b) decide whether to render
  // the "Save your plan" CTA. Cookie failures fall through to
  // "anonymous".
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

  // Cached plan? Render server-side from D1 — survives refresh and
  // works for shared links. Falls through to LocalPlanLoader on a
  // sessionStorage hydration if the passport hasn't been recommended
  // yet (e.g. the API call failed and the form-fallback path stashed
  // a mock locally).
  const cached = await loadCachedPlan(id);
  if (cached && cached.result.recommendations.length > 0) {
    return (
      <ResultsView
        passportId={id}
        input={cached.passport}
        result={cached.result}
        cta={cta}
      />
    );
  }

  return <LocalPlanLoader passportId={id} cta={cta} />;
}
