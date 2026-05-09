"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function deleteAccount() {
    setSubmitting(true);
    setError(null);
    try {
      const r = await authClient.deleteUser();
      if (r.error) {
        setError(r.error.message ?? "Couldn't delete account.");
        setSubmitting(false);
        return;
      }
      router.push("/?deleted=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-tile border-[1.5px] border-danger bg-paper-2 p-5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-danger">
        Delete account
      </p>
      <p className="mt-1 text-sm text-ink-2">
        Companies you&rsquo;ve claimed are released back to GOEO review. This
        cannot be undone.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-danger bg-paper px-4 py-2 text-sm font-medium text-danger"
        >
          Delete →
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={deleteAccount}
            disabled={submitting}
            className="rounded-tile border-[1.5px] border-danger bg-danger px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
          >
            {submitting ? "Deleting…" : "Yes, delete forever"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={submitting}
            className="rounded-tile border border-topo bg-paper px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
      {error ? (
        <p className="mt-3 rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
