"use client";

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
