"use client";

import { useEffect, useState } from "react";

// Full-viewport overlay rendered while a plan is being generated.
// Used by:
//   - app/founder/_components/IntakeForm.tsx (during the form-submit
//     POST → /api/v1/resources/recommend, which takes ~5–7s for the
//     LLM call)
//   - app/plan/[id]/loading.tsx (during SSR navigation when a persona
//     plan needs lazy generation; ~3–6s with sonnet)
//
// The button-text swap on IntakeForm.tsx was too easy to miss
// (sticky-bottom small text); user-reported the UI looked broken.
// This overlay is impossible to miss + announces itself to screen
// readers via role="status" + aria-live="polite".

const DEFAULT_STAGES = [
  "Reading your profile",
  "Scoring 226 Utah resources",
  "Asking Claude for the synthesis",
  "Almost there — formatting your plan",
];

export function PlanLoadingOverlay({
  messages = DEFAULT_STAGES,
  intervalMs = 2000,
}: {
  messages?: string[];
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(
      () => setIdx((i) => Math.min(i + 1, messages.length - 1)),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [messages.length, intervalMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Writing your plan"
      className="fixed inset-0 z-50 flex items-center justify-center bg-paper/95 px-4 backdrop-blur-sm"
    >
      <div className="max-w-sm rounded-tile border-[1.5px] border-ink bg-paper-2 px-8 py-10 text-center shadow-sketch">
        <Spinner />
        <h2 className="mt-6 font-serif text-2xl">Writing your plan…</h2>
        <p
          // re-key on idx so the swap fades in instead of being a hard cut
          key={idx}
          className="mt-3 animate-in fade-in font-hand text-base text-ink-3 duration-500"
        >
          {messages[idx]}
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden
      className="mx-auto h-12 w-12 animate-spin text-ember"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
