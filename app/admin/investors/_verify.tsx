"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VerifyInvestorButton({
  slug,
  currentStatus,
  canVerify,
}: {
  slug: string;
  currentStatus: string;
  canVerify: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function flip(toStatus: "verified" | "unverified") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/investor-profiles/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ verification_status: toStatus }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setError(err?.error?.message ?? `Action failed (${res.status}).`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {currentStatus === "verified" ? (
        <button
          type="button"
          onClick={() => flip("unverified")}
          disabled={busy}
          className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-danger px-3 font-mono text-[10px] uppercase tracking-wider text-danger hover:bg-danger/10 disabled:opacity-50"
        >
          {busy ? "…" : "Unverify"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => flip("verified")}
          disabled={busy || !canVerify}
          title={!canVerify ? "Profile needs a display name + slug first." : undefined}
          className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill bg-ember px-3 font-mono text-[10px] uppercase tracking-wider text-paper hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "…" : "Verify"}
        </button>
      )}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
