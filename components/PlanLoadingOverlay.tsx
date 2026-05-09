"use client";

import { useEffect, useId, useState } from "react";

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
  const headingId = useId();

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => {
        const next = Math.min(i + 1, messages.length - 1);
        // Stop ticking once we reach the last message instead of
        // re-firing every intervalMs forever until unmount.
        if (next === messages.length - 1) clearInterval(t);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(t);
  }, [messages.length, intervalMs]);

  return (
    <div
      role="status"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-paper/95 px-4 backdrop-blur-sm"
    >
      <div className="max-w-sm rounded-tile border-[1.5px] border-ink bg-paper-2 px-8 py-10 text-center shadow-sketch">
        <Spinner />
        <h2 id={headingId} className="mt-6 font-serif text-2xl">
          Writing your plan…
        </h2>
        <p
          key={idx}
          className="mt-3 animate-in fade-in font-hand text-base text-ink-3 duration-500 motion-reduce:animate-none"
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
      className="mx-auto h-12 w-12 animate-spin text-ember motion-reduce:animate-none"
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
