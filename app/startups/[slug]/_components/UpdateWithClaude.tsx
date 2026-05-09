"use client";

import { useState } from "react";
import { buildUpdatePrompt } from "@/lib/update-prompt";
import type { CompanyCard } from "@/lib/company-card";

export function UpdateWithClaude({ card }: { card: CompanyCard }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      const baseUrl =
        typeof window === "undefined" ? undefined : window.location.origin;
      const prompt = buildUpdatePrompt(card, baseUrl);
      await navigator.clipboard.writeText(prompt);
      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2200);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-paper/30 bg-paper/5 px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5 hover:bg-paper/15"
    >
      {state === "copied"
        ? "✓ Copied to clipboard"
        : state === "error"
          ? "Couldn't copy — try again"
          : "📋 Update with Claude / ChatGPT"}
    </button>
  );
}
