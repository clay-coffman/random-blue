"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Cadence = "daily" | "weekly" | "off";

type SavedSearch = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  cadence: Cadence;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

const CADENCES: { value: Cadence; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "off", label: "Off" },
];

export function NotificationsSection() {
  const [items, setItems] = useState<SavedSearch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedSearch | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/saved-searches");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { saved_searches: SavedSearch[] };
        if (cancelled) return;
        setItems(body.saved_searches);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateCadence(id: string, cadence: Cadence) {
    const prev = items;
    setItems((current) =>
      current
        ? current.map((s) => (s.id === id ? { ...s, cadence } : s))
        : current,
    );
    try {
      const res = await fetch(`/api/v1/saved-searches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadence }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
      setItems(prev);
    }
  }

  async function performDelete(id: string) {
    setDeleting(true);
    const prev = items;
    setItems((current) => (current ? current.filter((s) => s.id !== id) : current));
    try {
      const res = await fetch(`/api/v1/saved-searches/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setItems(prev);
    } finally {
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <p className="rounded-tile border border-dashed border-danger bg-paper-2 p-4 text-sm text-danger">
        {error}
      </p>
    );
  }

  if (items === null) {
    return (
      <p className="rounded-tile border border-dashed border-topo bg-paper-2 p-4 text-sm text-ink-3">
        Loading…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-tile border border-dashed border-topo bg-paper-2 p-5">
        <p className="text-sm text-ink-2">
          No saved searches yet. Set filters on the{" "}
          <Link href="/map" className="text-ember underline-offset-4 hover:underline">
            map
          </Link>{" "}
          and click{" "}
          <span className="font-mono text-xs uppercase tracking-wider">
            ★ Save search
          </span>{" "}
          to get email when new Utah companies match.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-3">
        {items.map((s) => {
          const paused = s.cadence === "off";
          return (
            <li
              key={s.id}
              className={`flex flex-col gap-3 rounded-tile border-[1.5px] p-4 sm:flex-row sm:items-center ${
                paused
                  ? "border-topo/60 bg-paper-2/60"
                  : "border-topo bg-paper-2"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`font-serif text-lg leading-tight ${
                      paused ? "text-ink-3" : ""
                    }`}
                  >
                    {s.name}
                  </p>
                  {paused ? (
                    <span className="rounded-pill border border-ink/20 bg-stone px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                      Paused
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  {filtersSummary(s.filters)}
                </p>
                {s.last_run_at ? (
                  <p className="mt-1 text-xs text-ink-3">
                    last checked {new Date(s.last_run_at).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-ink-3">no checks yet</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  Email
                  <select
                    value={s.cadence}
                    onChange={(e) =>
                      updateCadence(s.id, e.target.value as Cadence)
                    }
                    className="ml-2 h-9 min-h-[44px] rounded-md border-[1.5px] border-ink/30 bg-paper px-2 text-sm focus:border-ink focus:outline-none"
                  >
                    {CADENCES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Link
                  href={mapUrlFromFilters(s.filters)}
                  className="inline-flex h-10 min-h-[44px] items-center rounded-pill border-[1.5px] border-ink/30 bg-paper px-3 font-mono text-[11px] uppercase tracking-wider hover:border-ink"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(s)}
                  className="inline-flex h-10 min-h-[44px] items-center rounded-pill border-[1.5px] border-danger px-3 font-mono text-[11px] uppercase tracking-wider text-danger hover:bg-danger hover:text-paper"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <DialogContent className="bg-paper-2">
          <DialogTitle className="font-serif text-lg">
            Delete saved search?
          </DialogTitle>
          <DialogDescription>
            {confirmDelete ? (
              <>
                You won&apos;t get more emails for{" "}
                <strong className="text-ink">{confirmDelete.name}</strong>. The
                filter itself isn&apos;t affected — you can save it again from
                the map.
              </>
            ) : null}
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="inline-flex h-10 min-h-[44px] items-center rounded-pill border-[1.5px] border-ink/30 bg-paper px-3 font-mono text-[11px] uppercase tracking-wider hover:border-ink"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmDelete) performDelete(confirmDelete.id);
              }}
              className="inline-flex h-10 min-h-[44px] items-center rounded-pill border-[1.5px] border-danger bg-danger px-3 font-mono text-[11px] uppercase tracking-wider text-paper hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function filtersSummary(f: Record<string, unknown>): string {
  const entries = Object.entries(f).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return "no filters";
  return entries.map(([k, v]) => `${k}=${String(v)}`).join(" · ");
}

function mapUrlFromFilters(f: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v == null || v === "") continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `/map?${qs}` : "/map";
}
