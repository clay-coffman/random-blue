"use client";

import { useState } from "react";

export function SaveButton({
  companyId,
  initialSaved,
}: {
  companyId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (!saved) {
        const res = await fetch("/api/v1/saved-companies", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ company_id: companyId }),
        });
        if (!res.ok && res.status !== 409) {
          const err = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          setError(err?.error?.message ?? `Save failed (${res.status}).`);
        } else {
          setSaved(true);
        }
      } else {
        const res = await fetch(
          `/api/v1/saved-companies?company_id=${encodeURIComponent(companyId)}`,
          { method: "DELETE" },
        );
        if (!res.ok && res.status !== 204) {
          const err = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          setError(err?.error?.message ?? `Unsave failed (${res.status}).`);
        } else {
          setSaved(false);
        }
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        className={
          saved
            ? "inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-sage bg-sage-tint px-4 font-mono text-xs uppercase tracking-wider text-sage transition hover:-translate-y-0.5 disabled:opacity-50"
            : "inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper px-4 font-mono text-xs uppercase tracking-wider transition hover:-translate-y-0.5 disabled:opacity-50"
        }
      >
        {busy ? "…" : saved ? "✓ Saved" : "+ Save"}
      </button>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
