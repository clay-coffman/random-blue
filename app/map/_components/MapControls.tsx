"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Bottom-center zoom widget + reset + share-view button. The MapLibre
// NavigationControl handles the actual zoom in/out; this row is the
// brand-styled overlay UX (per wireframe).
export function MapControls() {
  const router = useRouter();
  const [shared, setShared] = useState(false);

  function shareView() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      },
      () => {
        setShared(false);
      },
    );
  }

  function resetView() {
    router.push("/map");
  }

  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-pill border-[1.5px] border-ink/30 bg-paper-2/95 px-3 py-1.5 shadow-sketch backdrop-blur-sm">
        <button
          type="button"
          onClick={resetView}
          className="inline-flex h-8 min-h-[36px] items-center rounded-pill px-3 font-mono text-[11px] uppercase tracking-wider text-ink-2 transition hover:bg-paper"
        >
          Reset view
        </button>
        <span className="h-4 w-px bg-ink/20" aria-hidden />
        <button
          type="button"
          onClick={shareView}
          className="inline-flex h-8 min-h-[36px] items-center gap-1.5 rounded-pill px-3 font-mono text-[11px] uppercase tracking-wider text-ink-2 transition hover:bg-paper"
        >
          {shared ? "✓ Copied" : "Share view"}
        </button>
      </div>
    </div>
  );
}
