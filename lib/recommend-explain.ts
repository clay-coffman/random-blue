// Source-bound LLM explanation pass. Given the top-N scored resources,
// asks Anthropic for a one-sentence "Because…" per resource, citing only
// the resource_ids we provide. Never throws — on timeout / error / parse
// failure, returns an empty map and the route handler falls back to the
// deterministic reasons[].

import { z } from "zod";
import { ANTHROPIC_MODEL, anthropic, cachedSystem } from "./anthropic";
import type { Scored } from "./recommend";
import type { FounderPassportInput } from "@/types/api";

const HARD_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 800;

const ExplanationSchema = z.object({
  explanations: z.array(
    z.object({
      resource_id: z.string(),
      because: z.string().min(1),
    }),
  ),
});

const SYSTEM = `You explain why retrieved resources match a Utah founder's profile.
Use ONLY the resources I provide. Cite each by its resource_id verbatim.
Do not invent eligibility. Do not recommend anything outside the retrieved set.

For each resource, output one sentence (≤25 words) starting with "Because"
that cites the matching fields. Return JSON only, matching this shape:
{ "explanations": [ { "resource_id": "r_…", "because": "Because …" }, ... ] }`;

function buildUserContent(
  passport: FounderPassportInput,
  retrieved: Scored[],
): string {
  const items = retrieved.map((s) => ({
    resource_id: s.resource.id,
    title: s.resource.title,
    industries: s.resource.industries,
    communities: s.resource.communities,
    topics: s.resource.topics,
    locations: s.resource.locations,
    matched_reasons: s.reasons,
  }));
  return [
    "<founder>",
    JSON.stringify(passport, null, 2),
    "</founder>",
    "<retrieved>",
    JSON.stringify(items, null, 2),
    "</retrieved>",
  ].join("\n");
}

export async function explainRecommendations(
  passport: FounderPassportInput,
  retrieved: Scored[],
): Promise<Map<string, string>> {
  if (retrieved.length === 0) return new Map();

  const validIds = new Set(retrieved.map((r) => r.resource.id));
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
          {
            role: "user",
            content: buildUserContent(passport, retrieved),
          },
        ],
      },
      { signal: controller.signal },
    );

    // Extract text blocks
    const text = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    // Tolerate code fences / leading prose; pull the first JSON object.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return new Map();
    const parsed = ExplanationSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) return new Map();

    const out = new Map<string, string>();
    for (const e of parsed.data.explanations) {
      // Drop any hallucinated IDs that weren't in the retrieved set.
      if (!validIds.has(e.resource_id)) continue;
      out.set(e.resource_id, e.because);
    }
    return out;
  } catch {
    return new Map();
  } finally {
    clearTimeout(timer);
  }
}
