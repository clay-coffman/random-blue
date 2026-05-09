import { notFound } from "next/navigation";
import {
  isPersonaId,
  personaFixtures,
  personaIdFromPassport,
} from "@/lib/intake-fixtures";
import { recommendMock } from "@/lib/recommend-mock";
import type {
  FounderPassportInput,
  RecommendResponse,
} from "@/types/api";
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

async function fetchRealPlan(
  id: string,
): Promise<{ input: FounderPassportInput; response: RecommendResponse } | null> {
  // The /api/v1/founder-passports/:id/plan route belongs to Agent 2.
  // Try it; if it 404s or fails, fall back to fixtures or sessionStorage.
  try {
    const res = await fetch(
      `${getOrigin()}/api/v1/founder-passports/${id}/plan`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      input: FounderPassportInput;
      response: RecommendResponse;
    };
    return data;
  } catch {
    return null;
  }
}

function getOrigin(): string {
  // Build-time tolerant: in dev/preview the same-origin call is fine,
  // but Next's server fetch needs an absolute URL when not invoked via
  // a request context. Default to localhost so this never throws at
  // build time.
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export default async function PlanPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Try the real endpoint (Agent 2). Will 404 until they ship.
  const real = await fetchRealPlan(id);
  if (real) {
    return <ResultsView passportId={id} input={real.input} response={real.response} />;
  }

  // 2. Persona fixture? (`fp_jordan`, `fp_priya`, …)
  const personaId = personaIdFromPassport(id);
  if (personaId && isPersonaId(personaId)) {
    const input = personaFixtures[personaId];
    const response = recommendMock(input, id);
    return <ResultsView passportId={id} input={input} response={response} />;
  }

  // 3. Synthetic local id from the form fallback. Hydrate from
  //    sessionStorage on the client.
  if (id.startsWith("fp_local_") || id.startsWith("fp_")) {
    return <LocalPlanLoader passportId={id} />;
  }

  notFound();
}
