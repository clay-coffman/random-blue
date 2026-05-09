"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "pending" | "accepted" | "declined" | "introduced";

export function ReviewActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentStatus !== "pending") {
    return null;
  }

  async function patch(status: Exclude<Status, "pending">) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/intro-requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          admin_notes: note.trim() || null,
        }),
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
    <section className="rounded-tile border-[1.5px] border-ink/30 bg-paper p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
        Decide
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Optional admin note (visible to recipients)…"
        className="mt-3 w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 text-sm focus:border-ember focus:outline-none"
      />
      {error ? (
        <p className="mt-2 rounded-tile border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => patch("accepted")}
          disabled={busy}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-sage px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          ✓ Accept &amp; connect
        </button>
        <button
          type="button"
          onClick={() => patch("introduced")}
          disabled={busy}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink bg-paper px-4 font-mono text-xs uppercase tracking-wider text-ink hover:bg-paper-2 disabled:opacity-50"
        >
          Mark introduced
        </button>
        <button
          type="button"
          onClick={() => patch("declined")}
          disabled={busy}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-danger px-4 font-mono text-xs uppercase tracking-wider text-danger hover:bg-danger/10 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-3">
        <strong>Accept</strong> connects both parties by email.{" "}
        <strong>Mark introduced</strong> closes the loop without sharing
        contact info (use when you&apos;ve already made the intro out-of-band).{" "}
        <strong>Decline</strong> notifies the requester only.
      </p>
    </section>
  );
}
