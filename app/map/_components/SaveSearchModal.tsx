"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  filters: Record<string, string>;
  // Optional pre-filled name (e.g. derived from active filters).
  defaultName?: string;
  signedIn: boolean;
};

const CADENCES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "off", label: "Don't email" },
] as const;

type Cadence = (typeof CADENCES)[number]["value"];

export function SaveSearchModal({ filters, defaultName, signedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName ?? "");
  const [cadence, setCadence] = useState<Cadence>("daily");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // After a successful save, flash a confirmation in the trigger
  // button (subtle, non-blocking) instead of yanking the user off
  // the map. Cleared after 3s.
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(false), 3000);
    return () => clearTimeout(t);
  }, [savedFlash]);

  // Disabled state: nothing to save (no filters at all).
  const filterKeys = Object.keys(filters).filter(
    (k) => !["view", "lat", "lng", "zoom", "brief"].includes(k),
  );
  const hasFilters = filterKeys.length > 0;

  if (!signedIn) {
    const next = encodeURIComponent(
      `/map?${new URLSearchParams(filters).toString()}`,
    );
    return (
      <a
        href={`/sign-in?next=${next}`}
        className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] border-ink/30 bg-paper px-3 font-mono text-[11px] uppercase tracking-wider text-ink-2 transition hover:-translate-y-0.5 hover:border-ink"
      >
        <span aria-hidden>★</span> Sign in to save
      </a>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cadence,
          filters,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      setOpen(false);
      setName("");
      // Stay on the map. The button shows "Saved ✓" for 3s; the user
      // can manage cadences from /settings#notifications when they
      // want to.
      setSavedFlash(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            disabled={!hasFilters}
            className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper px-3 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              hasFilters
                ? "Save these filters and get email when new matches appear"
                : "Set at least one filter first"
            }
          >
            <span aria-hidden>{savedFlash ? "✓" : "★"}</span>{" "}
            {savedFlash ? "Saved" : "Save search"}
          </button>
        }
      />
      <DialogContent className="bg-paper-2">
        <DialogTitle className="font-serif text-lg">
          Save this search
        </DialogTitle>
        <DialogDescription>
          Get an email when new Utah companies match these filters.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Name
            </span>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Series A fintech in Salt Lake"
              className="h-11 min-h-[44px] w-full rounded-md border-[1.5px] border-ink/30 bg-paper px-3 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ember/30"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Email me
            </legend>
            <div className="flex flex-wrap gap-2">
              {CADENCES.map((c) => (
                <label
                  key={c.value}
                  className={`inline-flex h-10 min-h-[44px] cursor-pointer items-center gap-2 rounded-pill border-[1.5px] px-3 font-mono text-[11px] uppercase tracking-wider transition ${
                    cadence === c.value
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 bg-paper text-ink-2 hover:border-ink/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="cadence"
                    value={c.value}
                    checked={cadence === c.value}
                    onChange={() => setCadence(c.value)}
                    className="sr-only"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-md border border-dashed border-topo bg-paper-2 p-3 text-xs text-ink-3">
            <p className="mb-1 font-mono uppercase tracking-wider">Filters</p>
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {filterKeys.map((k) => (
                <li key={k}>
                  <span className="text-ink-2">{k}</span>={filters[k]}
                </li>
              ))}
            </ul>
          </div>

          {error ? (
            <p className="text-sm text-ember">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 min-h-[44px] items-center rounded-pill border-[1.5px] border-ink/30 bg-paper px-3 font-mono text-[11px] uppercase tracking-wider hover:border-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="inline-flex h-10 min-h-[44px] items-center rounded-pill border-[1.5px] border-ink bg-ink px-3 font-mono text-[11px] uppercase tracking-wider text-paper hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
