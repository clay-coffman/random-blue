"use client";

import { useState } from "react";

type Props = {
  slug: string;
  name: string;
};

export function UpdateWithAIButton({ slug, name }: Props) {
  const [copied, setCopied] = useState(false);

  const prompt = `Help me update the Startup State Atlas profile for ${name}.

Read the canonical profile at:
- https://startup.utah.gov/startups/${slug}/route.md
- https://startup.utah.gov/api/v1/companies/${slug}

Then propose a corrected JSON patch (only the fields that need to change) for the Atlas API. Fields you can update include:
- description
- website
- sector
- stage
- employee_count
- hiring_status
- founder_team (array of { name, title, linkedin })
- linkedin
- logo_url

If you don't know a value, leave it out. When ready, output a fenced JSON block I can submit to the Atlas team for review.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5"
    >
      {copied ? "✓ Prompt copied" : "Update with Claude / ChatGPT"}
    </button>
  );
}
