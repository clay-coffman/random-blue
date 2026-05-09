// Source-bound investor-brief generator. Given a filtered set of
// companies, asks Claude for a structured cluster narrative (themes,
// notable raises, hiring snapshot). Mirrors lib/recommend-explain.ts:
// timeout, regex JSON extract, zod validate, hallucination filter,
// graceful fallback to a degraded result. Never throws.

import { z } from "zod";
import { ANTHROPIC_MODEL, anthropic, cachedSystem } from "./anthropic";
import type { CompanyListItem } from "./companies-list";

const HARD_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 1200;

const ThemeSchema = z.object({
  title: z.string().min(1),
  slugs: z.array(z.string()).default([]),
  summary: z.string().min(1),
});

const RaiseSchema = z.object({
  slug: z.string(),
  amount: z.string(),
  date: z.string().nullable().optional(),
});

const HiringSchema = z.object({
  open_roles: z.number().int().nonnegative(),
  top_hirers: z.array(z.string()).default([]),
});

export const InvestorBriefSchema = z.object({
  headline: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  themes: z.array(ThemeSchema).default([]),
  notable_raises: z.array(RaiseSchema).default([]),
  hiring: HiringSchema.nullable().optional(),
});

export type InvestorBriefResult = {
  headline: string | null;
  metadata: string | null;
  themes: { title: string; slugs: string[]; summary: string }[];
  notable_raises: { slug: string; amount: string; date: string | null }[];
  hiring: { open_roles: number; top_hirers: string[] } | null;
  degraded: boolean;
};

const SYSTEM = `You write investor-grade cluster narratives for a curated set of Utah startups.
Use ONLY the companies I provide. Cite each by its slug verbatim.
Do not invent companies, raises, customers, or eligibility.
Do not recommend anything outside the provided set.

Identify 3–5 distinct cluster themes (sub-categories within the filtered set), with 1–2 companies
each. Note 1–2 likely partner-company relationships across themes. Aggregate the hiring snapshot
from the data provided. Notable raises are derived from descriptions only — if no raise info is
present, return an empty array.

Output JSON only — no prose, no code fences — matching this schema:
{
  "headline": "<one-line cluster headline, e.g. 'Utah seed-stage fintech'>",
  "metadata": "<short summary line: 'N companies · counties · employees · vibe'>",
  "themes": [
    {
      "title": "<theme name>",
      "slugs": ["<slug>", "<slug>"],
      "summary": "<1-sentence theme summary>"
    }
  ],
  "notable_raises": [{ "slug": "<slug>", "amount": "<e.g. $8M>", "date": "<YYYY-MM or null>" }],
  "hiring": { "open_roles": <number>, "top_hirers": ["<slug>"] }
}`;

function buildUser(
  filter: Record<string, unknown>,
  companies: CompanyListItem[],
): string {
  const items = companies.slice(0, 80).map((c) => ({
    slug: c.slug,
    name: c.name,
    sector: c.sector,
    stage: c.stage,
    description: c.summary,
    employees: c.employee_count,
    hiring: c.hiring_status,
    city: c.city,
    county: c.county,
  }));
  return [
    "<filter>",
    JSON.stringify(filter, null, 2),
    "</filter>",
    "<companies>",
    JSON.stringify(items, null, 2),
    "</companies>",
  ].join("\n");
}

export async function generateInvestorBrief(
  filter: Record<string, unknown>,
  companies: CompanyListItem[],
): Promise<InvestorBriefResult> {
  const empty: InvestorBriefResult = {
    headline: null,
    metadata: null,
    themes: [],
    notable_raises: [],
    hiring: null,
    degraded: true,
  };
  if (companies.length === 0) return empty;

  const validSlugs = new Set(companies.map((c) => c.slug));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

  try {
    const client = anthropic();
    const response = await client.messages.create(
      {
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: cachedSystem(SYSTEM),
        messages: [
          { role: "user", content: buildUser(filter, companies) },
        ],
      },
      { signal: controller.signal },
    );

    const text = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return empty;
    const parsed = InvestorBriefSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) return empty;
    const data = parsed.data;

    const cleanThemes = data.themes
      .map((t) => ({
        title: t.title,
        slugs: t.slugs.filter((s) => validSlugs.has(s)),
        summary: t.summary,
      }))
      // Drop themes whose slug list collapsed to zero — usually means
      // the model invented slugs.
      .filter((t) => t.slugs.length > 0);

    const cleanRaises = data.notable_raises
      .filter((r) => validSlugs.has(r.slug))
      .map((r) => ({
        slug: r.slug,
        amount: r.amount,
        date: r.date ?? null,
      }));

    const cleanHiring = data.hiring
      ? {
          open_roles: data.hiring.open_roles,
          top_hirers: data.hiring.top_hirers.filter((s) => validSlugs.has(s)),
        }
      : null;

    return {
      headline: data.headline ?? null,
      metadata: data.metadata ?? null,
      themes: cleanThemes,
      notable_raises: cleanRaises,
      hiring: cleanHiring,
      degraded: false,
    };
  } catch (err) {
    console.warn("[investor-brief] generation failed", err);
    return empty;
  } finally {
    clearTimeout(timer);
  }
}
