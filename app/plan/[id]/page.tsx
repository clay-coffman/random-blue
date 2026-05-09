import { notFound } from "next/navigation";
import { personaIdFromPassport } from "@/lib/intake-fixtures";
import {
  generatePlanForPassport,
  loadCachedPlan,
} from "@/lib/plan-loader";
import { ResultsView } from "../_components/ResultsView";
import { LocalPlanLoader } from "../_components/LocalPlanLoader";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `90-day plan · ${id} — Atlas`,
    description:
      "Your personalized 90-day startup plan: do this now, do this next, ignore for now.",
  };
}

export default async function PlanPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Cached plan? Render from D1.
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

  // 2. Persona id with no cached plan? Lazy-generate inline (calls Claude).
  //    First hit ~3-6s; every refresh is cache-hot from D1. Run
  //    `npm run warm-personas` against prod before a demo to avoid
  //    paying that latency in front of an audience.
  const personaId = personaIdFromPassport(id);
  if (personaId) {
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
      // Fall through to LocalPlanLoader so the demo never hard-fails.
    }
  }

  // 3. Synthetic id from the form fallback path. Hydrate from
  //    sessionStorage on the client.
  if (id.startsWith("fp_")) {
    return <LocalPlanLoader passportId={id} />;
  }

  notFound();
}
