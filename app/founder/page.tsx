import { headers } from "next/headers";
import Link from "next/link";
import { getAuth } from "@/auth";
import { SectionHeader } from "@/components/brand";
import { isPersonaId, personaFixtures } from "@/lib/intake-fixtures";
import { personaById } from "@/lib/personas";
import type { FounderPassportInput } from "@/types/passport";
import { IntakeForm } from "./_components/IntakeForm";
import { PersonaButtons } from "./_components/PersonaButtons";

type PageProps = {
  searchParams: Promise<{ persona?: string | string[] }>;
};

export const metadata = {
  title: "Start your plan — Atlas",
  description:
    "Tell Atlas where in Utah you're building, what stage you're at, and what you need now. Six questions, one 90-day plan.",
};

export default async function FounderPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawPersona = Array.isArray(sp.persona) ? sp.persona[0] : sp.persona;
  const personaId =
    rawPersona && isPersonaId(rawPersona) ? rawPersona : undefined;
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  // Persona quick-test fixtures short-circuit submit to a seeded
  // passport (fp_priya etc). For a signed-in user that means landing
  // on someone else's plan, which is misleading. Hide the bar (and the
  // ?persona prefill) for authenticated visitors — it's a "quick tour"
  // surface, not their flow.
  const showFixtures = !session?.user;
  const effectivePersonaId = showFixtures ? personaId : undefined;
  const initial: FounderPassportInput | undefined = effectivePersonaId
    ? personaFixtures[effectivePersonaId]
    : undefined;
  const persona = effectivePersonaId
    ? personaById(effectivePersonaId)
    : undefined;

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-8 sm:px-7">
      <SectionHeader
        kicker="FOUNDER PASSPORT"
        kickerTone="ember"
        title="Tell us who you're building."
        sub="Six questions. We'll match your situation against every state-vetted resource and return a ranked 90-day plan."
      />

      {showFixtures ? (
        <div className="mt-8 rounded-tile border-[1.5px] border-topo bg-paper-2 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ember">
                Test fixtures
              </p>
              <p className="mt-1 font-serif text-lg leading-snug">
                Try the plan as one of six Utah founders.
              </p>
              <p className="mt-1 text-sm text-ink-3">
                Loads a sample passport and skips intake — useful for a quick
                tour before filling out your own.
              </p>
            </div>
            {persona ? (
              <Link
                href="/founder"
                className="inline-flex h-9 items-center gap-2 self-start rounded-pill border-[1.5px] border-ink bg-paper px-3 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
              >
                Clear {persona.displayName.split(",")[0]}
              </Link>
            ) : null}
          </div>
          <div className="mt-4">
            <PersonaButtons activeId={effectivePersonaId} />
          </div>
        </div>
      ) : null}

      <div className="mt-10">
        <IntakeForm initial={initial} personaId={effectivePersonaId} />
      </div>
    </div>
  );
}
