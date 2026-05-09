"use client";

import { useRouter } from "next/navigation";
import { ScribbleDivider } from "@/components/brand";
import { InvestorPreferencesForm } from "@/components/auth/InvestorPreferencesForm";

export default function InvestorOnboardingPage() {
  const router = useRouter();

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-180px)] max-w-2xl flex-col px-4 py-10 sm:px-7">
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        What kind of deal flow?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Used to personalize map briefs, weekly digests, and saved filters. You
        can still see everything.
      </p>
      <ScribbleDivider className="my-6" />
      <InvestorPreferencesForm onSaved={() => router.push("/onboarding/done")} />
    </section>
  );
}
