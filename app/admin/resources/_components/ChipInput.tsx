"use client";

import { useMemo, useState } from "react";

type Mode = "free-form" | "fixed";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  // free-form: user types arbitrary tags (industries / communities / topics).
  // fixed:    user picks from `options` (counties).
  mode: Mode;
  options?: string[];
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  // Visual size (chip text). Defaults to 11px.
  className?: string;
  // For fixed mode: how to compare user-typed entries to options. Defaults
  // to case-insensitive.
  caseInsensitive?: boolean;
}

export function ChipInput({
  value,
  onChange,
  mode,
  options = [],
  suggestions = [],
  placeholder,
  disabled = false,
  className = "",
  caseInsensitive = true,
}: Props) {
  const [draft, setDraft] = useState("");

  const norm = (s: string): string =>
    caseInsensitive ? s.trim().toLowerCase() : s.trim();
  const has = (set: string[], item: string): boolean =>
    set.some((v) => norm(v) === norm(item));

  const remaining = useMemo(() => {
    const matches = (set: string[], item: string): boolean =>
      set.some((v) =>
        caseInsensitive
          ? v.trim().toLowerCase() === item.trim().toLowerCase()
          : v.trim() === item.trim(),
      );
    if (mode === "fixed") {
      return options.filter((o) => !matches(value, o));
    }
    return suggestions.filter((s) => !matches(value, s));
  }, [mode, options, suggestions, value, caseInsensitive]);

  function add(raw: string) {
    const s = raw.trim();
    if (!s) return;
    if (has(value, s)) return;
    if (mode === "fixed") {
      const match = options.find((o) => norm(o) === norm(s));
      if (!match) return;
      onChange([...value, match]);
    } else {
      onChange([...value, s.toLowerCase()]);
    }
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-tile border-[1.5px] px-2 py-1.5 ${
          disabled ? "border-topo bg-paper-2 opacity-60" : "border-ink bg-paper"
        }`}
      >
        {value.length === 0 && !draft ? (
          <span className="px-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {placeholder ?? "none"}
          </span>
        ) : null}
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-pill border-[1.5px] border-ink bg-stone px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-ink"
          >
            {v}
            {!disabled ? (
              <button
                type="button"
                onClick={() => remove(v)}
                aria-label={`Remove ${v}`}
                className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-ink-3 hover:bg-ember hover:text-paper"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
        {!disabled ? (
          mode === "free-form" ? (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  add(draft);
                  setDraft("");
                } else if (
                  e.key === "Backspace" &&
                  draft === "" &&
                  value.length > 0
                ) {
                  e.preventDefault();
                  remove(value[value.length - 1]!);
                }
              }}
              onBlur={() => {
                if (draft.trim()) {
                  add(draft);
                  setDraft("");
                }
              }}
              placeholder={value.length === 0 ? "" : "Add…"}
              className="min-w-[6rem] flex-1 border-0 bg-transparent px-1 py-1 font-mono text-[11px] uppercase tracking-wider outline-none placeholder:text-ink-3"
            />
          ) : null
        ) : null}
      </div>

      {!disabled && remaining.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
            {mode === "fixed" ? "Add:" : "Suggestions:"}
          </span>
          {remaining.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => add(opt)}
              className="inline-flex items-center rounded-pill border border-topo bg-paper-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:border-ember hover:text-ember"
            >
              + {opt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
