import { NextResponse, type NextRequest } from "next/server";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import {
  ANTHROPIC_MODEL,
  anthropic,
  cachedSystem,
} from "@/lib/anthropic";
import { ApiError, errorResponse } from "@/lib/api-error";
import { db } from "@/lib/db";
import { companies } from "@/db/schema";

export const runtime = "edge";
// No `maxDuration` export — that's Vercel-only. On Workers the real
// ceiling is the AbortController on the Anthropic call below (12s).

const MAX_SLUGS = 80;

const RequestSchema = z.object({
  filter: z
    .object({
      sector: z.string().nullable().optional(),
      stage: z.string().nullable().optional(),
      county: z.string().nullable().optional(),
      hiring: z.enum(["true", "false"]).nullable().optional(),
      q: z.string().optional(),
    })
    .optional()
    .default({}),
  slugs: z.array(z.string()).max(MAX_SLUGS),
});

const ClusterSchema = z.object({
  title: z.string(),
  count: z.number().int().nonnegative(),
  slugs: z.array(z.string()),
  summary: z.string(),
});

const ResponseSchema = z.object({
  filter_summary: z.string(),
  clusters: z.array(ClusterSchema).max(8),
  hiring_summary: z.string().nullable().optional(),
});

const SYSTEM = `You summarize a filtered subset of Utah startups for an investor.

Rules:
- Use ONLY the companies in the <companies> block. Never invent names.
- Identify 3 to 5 distinct clusters or themes that group these companies.
- Each cluster lists between 1 and 8 company slugs that belong to it (drawn verbatim from the input).
- Each cluster's "count" must equal the length of its "slugs" array.
- Keep summaries concrete: one sentence per cluster (≤ 22 words).
- If the set is too small for clustering, return 1–2 clusters that describe the whole set.
- "filter_summary" is a single sentence (≤ 18 words) describing what the filter selects.
- "hiring_summary" optionally calls out aggregate hiring activity in one short clause; omit if nothing to say.

Return JSON ONLY in this shape:
{
  "filter_summary": string,
  "clusters": [
    { "title": string, "count": number, "slugs": [string], "summary": string }
  ],
  "hiring_summary"?: string
}`;

function describeFilter(f: z.infer<typeof RequestSchema>["filter"]): string {
  const parts: string[] = [];
  if (f?.sector) parts.push(`sector=${f.sector}`);
  if (f?.stage) parts.push(`stage=${f.stage}`);
  if (f?.county) parts.push(`county=${f.county}`);
  if (f?.hiring === "true") parts.push("hiring");
  if (f?.q) parts.push(`q="${f.q}"`);
  return parts.length ? parts.join(" · ") : "all Utah startups";
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError({
        code: "invalid_request",
        message: "Invalid brief request",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const { filter, slugs } = parsed.data;

    if (slugs.length === 0) {
      return NextResponse.json({
        filter_summary: describeFilter(filter),
        total_in_view: 0,
        clusters: [],
        hiring_summary: null,
      });
    }

    const cleanSlugs = Array.from(new Set(slugs)).slice(0, MAX_SLUGS);

    const rows = await db()
      .select({
        slug: companies.slug,
        name: companies.name,
        sector: companies.sector,
        stage: companies.stage,
        employeeCount: companies.employeeCount,
        hiringStatus: companies.hiringStatus,
        description: companies.description,
      })
      .from(companies)
      .where(inArray(companies.slug, cleanSlugs))
      .limit(MAX_SLUGS);

    if (rows.length === 0) {
      return NextResponse.json({
        filter_summary: describeFilter(filter),
        total_in_view: 0,
        clusters: [],
        hiring_summary: null,
      });
    }

    const companiesBlock = rows
      .map((r) => {
        const desc = (r.description ?? "")
          .replace(/\s+/g, " ")
          .slice(0, 200);
        return `- ${r.slug} | ${r.name} | sector=${r.sector ?? "?"} | stage=${
          r.stage ?? "?"
        } | employees=${r.employeeCount ?? "?"} | hiring=${
          r.hiringStatus ? "yes" : "no"
        } | ${desc}`;
      })
      .join("\n");

    const userText = `<filter>
${describeFilter(filter)}
</filter>

<companies>
${companiesBlock}
</companies>

Output JSON only.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);

    let parsedJson: unknown = null;
    let degraded = false;

    try {
      const client = anthropic();
      const resp = await client.messages.create(
        {
          model: ANTHROPIC_MODEL,
          max_tokens: 900,
          system: cachedSystem(SYSTEM),
          messages: [{ role: "user", content: userText }],
        },
        { signal: controller.signal },
      );
      const textBlock = resp.content.find((c) => c.type === "text");
      const raw = textBlock && "text" in textBlock ? textBlock.text : "";
      parsedJson = extractJson(raw);
    } catch (err) {
      console.error("brief anthropic error", err);
      degraded = true;
    } finally {
      clearTimeout(timer);
    }

    const validated = parsedJson
      ? ResponseSchema.safeParse(parsedJson)
      : null;
    const briefBody = validated?.success ? validated.data : null;

    if (!briefBody) {
      return NextResponse.json({
        filter_summary: describeFilter(filter),
        total_in_view: rows.length,
        clusters: [],
        hiring_summary: null,
        degraded: true,
      });
    }

    // Defensive: drop slugs that aren't actually in the input set.
    const inputSet = new Set(rows.map((r) => r.slug));
    const safeClusters = briefBody.clusters.map((c) => {
      const safeSlugs = c.slugs.filter((s) => inputSet.has(s));
      // Trust the filtered list, never the model's count — otherwise
      // a cluster that lost every slug to the input-set check would
      // still display the model's invented count with zero links.
      return { ...c, slugs: safeSlugs, count: safeSlugs.length };
    });

    return NextResponse.json({
      filter_summary: briefBody.filter_summary,
      total_in_view: rows.length,
      clusters: safeClusters,
      hiring_summary: briefBody.hiring_summary ?? null,
      degraded,
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("brief error", err);
    return errorResponse("internal_error", "Failed to generate brief", 500);
  }
}

function extractJson(text: string): unknown | null {
  if (!text) return null;
  const trimmed = text.trim();
  // Try as-is first.
  try {
    return JSON.parse(trimmed);
  } catch {
    // fallthrough
  }
  // Find first {...} block.
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
