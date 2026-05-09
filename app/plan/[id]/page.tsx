import { notFound } from "next/navigation";
import {
  personaFixtures,
  personaIdFromPassport,
} from "@/lib/intake-fixtures";
import { recommendMock } from "@/lib/recommend-mock";
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

  // TODO(agent-2): when `/api/v1/founder-passports/[id]/plan` ships,
  // call the loader directly here (not via fetch) — same Worker, no
  // network round-trip. Until then, we synthesise from fixtures.

  // Persona fixture? (`fp_jordan`, `fp_priya`, …)
  const personaId = personaIdFromPassport(id);
  if (personaId) {
    const input = personaFixtures[personaId];
    const result = recommendMock(input, id);
    return <ResultsView passportId={id} input={input} result={result} />;
  }

  // Synthetic local id from the form fallback. Hydrate from
  // sessionStorage on the client.
  if (id.startsWith("fp_")) {
    return <LocalPlanLoader passportId={id} />;
  }

  notFound();
}
