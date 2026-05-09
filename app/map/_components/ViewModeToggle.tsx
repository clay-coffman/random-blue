"use client";

import { cn } from "@/lib/utils";

export type ViewMode = "companies" | "clusters" | "heat";

const OPTIONS: { value: ViewMode; label: string; icon: string }[] = [
  { value: "companies", label: "Companies", icon: "•" },
  { value: "clusters", label: "Clusters", icon: "◯" },
  { value: "heat", label: "Heat", icon: "▒" },
];

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Map view"
      className="inline-flex h-10 min-h-[44px] items-center gap-1 rounded-pill border-[1.5px] border-ink/30 bg-paper-2 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-8 min-h-[36px] items-center gap-1.5 rounded-pill px-2 font-mono text-[11px] uppercase tracking-wider transition sm:px-3",
              active
                ? "bg-ink text-paper"
                : "text-ink-3 hover:text-ink-2",
            )}
            title={opt.label}
            aria-label={opt.label}
          >
            <span aria-hidden>{opt.icon}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
