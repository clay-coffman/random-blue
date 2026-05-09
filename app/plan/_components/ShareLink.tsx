"use client";

import { useEffect, useState } from "react";

type Props = { passportId: string };

export function ShareLink({ passportId }: Props) {
  const [url, setUrl] = useState<string>(`/plan/${passportId}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUrl(`${window.location.origin}/plan/${passportId}`);
  }, [passportId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Older browsers / insecure contexts: select fallback
      const tmp = document.createElement("input");
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } finally {
        document.body.removeChild(tmp);
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="hidden max-w-[260px] truncate rounded-pill border-[1.5px] border-topo bg-paper-2 px-3 py-1.5 font-mono text-[11px] text-ink-3 sm:inline"
      >
        {url}
      </span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 items-center gap-2 rounded-pill border-[1.5px] border-ember bg-ember px-3 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
      >
        {copied ? "Copied!" : "Share plan"}
      </button>
    </div>
  );
}
