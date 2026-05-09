// Output formatters for CLI subcommands. Three modes:
//   - JSON (`--json`): pretty-printed, parseable by tools
//   - Compact (`--compact`): one line per record, agent-friendly
//   - Human (default): multi-line, terminal-friendly

import type {
  CompanySummary,
  RecommendResponse,
  RecommendedResource,
  ResourceSummary,
  SearchResult,
} from "./atlas-client";

export type OutputMode = "json" | "compact" | "human";

export function pickMode(opts: {
  json?: boolean;
  compact?: boolean;
}): OutputMode {
  if (opts.json) return "json";
  if (opts.compact) return "compact";
  return "human";
}

function bucketGlyph(b: RecommendedResource["bucket"]) {
  if (b === "now") return "[now]   ";
  if (b === "next") return "[next]  ";
  return "[ignore]";
}

export function formatRecommendations(
  res: RecommendResponse,
  mode: OutputMode,
): string {
  if (mode === "json") return JSON.stringify(res, null, 2);

  const recs = res.recommendations;
  if (recs.length === 0) {
    if (mode === "compact") return `# no recommendations for ${res.passport_id}`;
    return `No recommendations for ${res.passport_id} yet.\nGenerated at ${res.generated_at}.`;
  }

  if (mode === "compact") {
    const lines = recs.map((r) => {
      const bg = bucketGlyph(r.bucket).trim();
      const because = r.because || r.reasons[0] || "";
      return `${r.resource_id} ${String(r.score).padStart(3)} ${bg} ${r.title} — ${because}`;
    });
    return [`# passport=${res.passport_id} generated_at=${res.generated_at}`, ...lines].join(
      "\n",
    );
  }

  const lines: string[] = [];
  lines.push(`Recommendations for ${res.passport_id}`);
  lines.push(`Generated ${res.generated_at}`);
  lines.push("");
  for (const r of recs) {
    lines.push(`${bucketGlyph(r.bucket)} ${String(r.score).padStart(3)} — ${r.title}  (${r.resource_id})`);
    if (r.because) lines.push(`           ${r.because}`);
    if (r.reasons.length > 0) {
      lines.push(`           reasons: ${r.reasons.slice(0, 4).join("; ")}`);
    }
    if (r.source_url) lines.push(`           ${r.source_url}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatCompanyList(
  companies: CompanySummary[],
  mode: OutputMode,
): string {
  if (mode === "json") return JSON.stringify({ companies }, null, 2);
  if (companies.length === 0) return "No companies matched.";
  if (mode === "compact") {
    return companies
      .map(
        (c) =>
          `${c.slug.padEnd(20)} ${(c.sector ?? "").padEnd(16)} ${(c.stage ?? "").padEnd(14)} ${c.name} — ${c.status}`,
      )
      .join("\n");
  }
  const lines: string[] = [];
  for (const c of companies) {
    lines.push(`${c.name}  (${c.slug})`);
    if (c.sector || c.stage || c.employee_count) {
      lines.push(
        `  ${c.sector ?? "—"} · ${c.stage ?? "—"} · ${c.employee_count ?? "—"} employees`,
      );
    }
    if (c.website) lines.push(`  ${c.website}`);
    lines.push(`  status: ${c.status}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatCompany(
  company: Record<string, unknown>,
  mode: OutputMode,
): string {
  if (mode === "json") return JSON.stringify({ company }, null, 2);
  const name = String(company.name ?? "");
  const slug = String(company.slug ?? "");
  const lines = [`${name}  (${slug})`];
  if (company.description) lines.push(`\n${String(company.description)}`);
  for (const k of [
    "website",
    "sector",
    "stage",
    "employee_count",
    "founding_year",
    "address_text",
    "linkedin",
  ]) {
    const v = (company as Record<string, unknown>)[k];
    if (v !== null && v !== undefined && v !== "") {
      lines.push(`  ${k}: ${String(v)}`);
    }
  }
  return lines.join("\n");
}

export function formatResourceList(
  resources: ResourceSummary[],
  mode: OutputMode,
): string {
  if (mode === "json") return JSON.stringify({ resources }, null, 2);
  if (resources.length === 0) return "No resources matched.";
  if (mode === "compact") {
    return resources
      .map(
        (r) =>
          `${r.id.padEnd(10)} ${(r.kind ?? "").padEnd(14)} ${r.title}`,
      )
      .join("\n");
  }
  const lines: string[] = [];
  for (const r of resources) {
    lines.push(`${r.title}  (${r.id})`);
    if (r.kind) lines.push(`  kind: ${r.kind}`);
    if (r.source_url) lines.push(`  ${r.source_url}`);
    if (r.contact_email) lines.push(`  ${r.contact_email}`);
    if (r.description)
      lines.push(`  ${String(r.description).slice(0, 200)}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatSearch(results: SearchResult[], mode: OutputMode): string {
  if (mode === "json") return JSON.stringify({ results }, null, 2);
  if (results.length === 0) return "No results.";
  if (mode === "compact") {
    return results
      .map(
        (r) =>
          `${r.kind.padEnd(8)} ${r.id.padEnd(20)} score=${String(r.score).padStart(3)}  ${r.title}`,
      )
      .join("\n");
  }
  const lines: string[] = [];
  for (const r of results) {
    lines.push(`[${r.kind}]  ${r.title}  (${r.id})`);
    if (r.summary) lines.push(`   ${r.summary}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
