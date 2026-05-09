"use client";

import Link from "next/link";
import { useState } from "react";
import {
  InvestorPreferencesDefaults,
  InvestorPreferencesForm,
} from "@/components/auth/InvestorPreferencesForm";

export function InvestorSection({
  defaults,
}: {
  defaults?: InvestorPreferencesDefaults;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <div className="mb-5 rounded-tile border-[1.5px] border-ink/30 bg-paper-2 p-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
          Public profile
        </p>
        <p className="mt-2 font-serif text-base leading-snug">
          Manage what founders, business owners, and AI agents see on
          your public investor page.
        </p>
        <Link
          href="/me/investor"
          className="mt-3 inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
        >
          Manage your public profile →
        </Link>
      </div>
      <InvestorPreferencesForm
        defaults={defaults}
        onSaved={() => setSaved(true)}
        submitLabel="Save preferences"
      />
      {saved ? (
        <p className="mt-3 rounded-tile border border-sage bg-sage-tint px-3 py-2 text-sm text-sage">
          ✓ Saved.
        </p>
      ) : null}
    </div>
  );
}
