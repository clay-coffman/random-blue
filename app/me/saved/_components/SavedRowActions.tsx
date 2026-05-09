"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SavedRowActions({
  companyId,
  initialNote,
}: {
  companyId: string;
  initialNote: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = note !== savedNote;

  async function saveNote() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/saved-companies", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company_id: companyId, note: note || null }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setError(err?.error?.message ?? `Save failed (${res.status}).`);
      } else {
        setSavedNote(note);
        setEditing(false);
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function unsave() {
    if (!confirm("Remove from saved?")) return;
    setBusy(true);
    setError(null);
    try {
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
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {editing ? (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Why this company?"
          className="w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-2 text-sm focus:border-ember focus:outline-none"
        />
      ) : (
        <p
          className="cursor-text whitespace-pre-wrap text-sm text-ink-2"
          onClick={() => setEditing(true)}
        >
          {savedNote ? (
            savedNote
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
              Add a private note…
            </span>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={saveNote}
              disabled={busy || !dirty}
              className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill bg-ink px-3 font-mono text-[11px] uppercase tracking-wider text-paper hover:-translate-y-0.5 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save note"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNote(savedNote);
                setEditing(false);
                setError(null);
              }}
              disabled={busy}
              className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink/40 px-3 font-mono text-[11px] uppercase tracking-wider text-ink-2 hover:bg-paper-2"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink/40 px-3 font-mono text-[11px] uppercase tracking-wider text-ink-2 hover:bg-paper-2"
            >
              {savedNote ? "Edit note" : "Add note"}
            </button>
            <button
              type="button"
              onClick={unsave}
              disabled={busy}
              className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-danger/50 px-3 font-mono text-[11px] uppercase tracking-wider text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              {busy ? "…" : "Unsave"}
            </button>
          </>
        )}
      </div>
      {error ? (
        <p className="rounded border border-danger bg-danger/10 px-2 py-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
