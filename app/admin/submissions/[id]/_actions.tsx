"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "approved" | "rejected" | "needs_more_info";

export function ReviewActions({
  id,
  currentStatus,
  mode,
}: {
  id: string;
  currentStatus: string;
  mode: "auto" | "manual";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Status | null>(null);
  const [needsInfo, setNeedsInfo] = useState(false);
  const [notes, setNotes] = useState("");

  if (currentStatus !== "pending") {
    return (
      <span className="rounded-pill bg-stone px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
        already {currentStatus}
      </span>
    );
  }

  async function patch(status: Status) {
    setError(null);
    setSubmitting(status);
    try {
      const res = await fetch(`/api/v1/ownership-submissions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          review_notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(json?.error?.message ?? `HTTP ${res.status}`);
        setSubmitting(null);
        return;
      }
      router.refresh();
      setSubmitting(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => patch("rejected")}
          disabled={!!submitting}
          className="rounded-tile border-[1.5px] border-danger bg-paper px-4 py-2 text-sm text-danger disabled:opacity-60"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => setNeedsInfo((v) => !v)}
          className="rounded-tile border border-ink bg-paper px-4 py-2 text-sm"
        >
          Need more info
        </button>
        <button
          type="button"
          onClick={() => patch("approved")}
          disabled={!!submitting}
          className={`rounded-tile border-[1.5px] px-4 py-2 text-sm font-medium shadow-sketch disabled:opacity-60 ${
            mode === "auto"
              ? "border-sage bg-sage text-paper"
              : "border-ember bg-ember text-paper"
          }`}
        >
          {submitting === "approved" ? "Approving…" : "Approve →"}
        </button>
      </div>
      {needsInfo ? (
        <div className="grid w-full gap-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What more do you need from the claimant?"
            rows={3}
            className="w-full rounded-tile border-[1.5px] border-ink bg-paper-2 p-2 text-sm"
          />
          <button
            type="button"
            onClick={() => patch("needs_more_info")}
            disabled={!!submitting}
            className="self-end rounded-tile border border-ink bg-paper px-4 py-2 text-sm disabled:opacity-60"
          >
            Send note
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-tile border border-danger bg-paper-2 px-3 py-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
