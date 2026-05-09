// Source-bound LLM explanation pass. Given the top-N scored resources,
// asks Anthropic for a one-sentence "Because…" per resource, citing only
// the resource_ids we provide. Never throws — on timeout / error / parse
// failure, returns an empty map and the route handler falls back to the
// deterministic reasons[].

import { z } from "zod";
import { ANTHROPIC_MODEL, anthropic, cachedSystem } from "./anthropic";
import type { ResourceRow, Scored } from "./recommend";
import type { FounderPassportInput } from "@/schemas/founder-passport";
import { COMMUNITY_TAGS, INDUSTRIES, STAGES, labelFor } from "./intake-options";

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

// ---------------------------------------------------------------------------
// Deterministic skip-bucket explainer.
//
// The "things you don't need" disclosure on /plan/[id] needs reasons that
// read as *negative* — why this resource was filtered out — not the
// scorer's positive match strings ("Covers what you need: capital").
// Picks the strongest negative signal (community → industry → geo → stage),
// falls back to "already covered" when a higher-ranked option claimed the
// same capability, otherwise a generic "low fit" line.

export type SkipFacets = {
  industries?: string[];
  communities?: string[];
  counties?: string[];
  statewide?: boolean;
  stages?: string[];
  needs?: string[];
};

// Minimal passport shape — `FounderPassportInput` from `schemas/` (snake_case)
// and from `types/passport.ts` (camelCase) both satisfy this, since the four
// fields we need have identical names in both.
export type SkipPassport = {
  county?: string;
  stage?: string;
  industry?: string;
  communities: string[];
};

export function explainSkip(
  facets: SkipFacets,
  passport: SkipPassport,
  opts?: { alreadyCoveredNeeds?: Set<string> },
): string {
  // 1. Community mismatch — strongest negative. The mock scorer applies a
  //    -100 here for a reason: a women-only fund is a hard "no" for a
  //    veteran founder regardless of any other match.
  if (facets.communities && facets.communities.length > 0) {
    const founderCommunities = new Set(passport.communities);
    const overlap = facets.communities.some((c) => founderCommunities.has(c));
    if (!overlap) {
      const labels = facets.communities
        .map((c) => labelFor(COMMUNITY_TAGS, c) ?? c)
        .join(" / ");
      return `Built for ${labels} founders — that's not your profile.`;
    }
  }

  // 2. Industry mismatch — only when the resource is narrowly scoped
  //    (≤ 2 industries). Wide industry lists ("general", many sectors)
  //    aren't a real constraint.
  if (
    facets.industries &&
    facets.industries.length > 0 &&
    facets.industries.length <= 2 &&
    passport.industry &&
    !facets.industries.includes(passport.industry)
  ) {
    const labels = facets.industries
      .map((i) => labelFor(INDUSTRIES, i) ?? i)
      .join(" / ");
    return `Industry-specific to ${labels}.`;
  }

  // 3. Geo mismatch — county-restricted resource, founder is elsewhere.
  if (
    !facets.statewide &&
    facets.counties &&
    facets.counties.length > 0 &&
    passport.county &&
    !facets.counties.includes(passport.county)
  ) {
    return `Limited to ${facets.counties.join(", ")} (you're in ${passport.county}).`;
  }

  // 4. Stage mismatch.
  if (
    facets.stages &&
    facets.stages.length > 0 &&
    passport.stage &&
    !facets.stages.includes(passport.stage)
  ) {
    const labels = facets.stages
      .map((s) => labelFor(STAGES, s)?.toLowerCase() ?? s)
      .join(" / ");
    return `Built for ${labels} stage founders.`;
  }

  // 5. Capability already covered by a higher-ranked option.
  if (opts?.alreadyCoveredNeeds && facets.needs && facets.needs.length > 0) {
    const overlap = facets.needs.some((n) => opts.alreadyCoveredNeeds!.has(n));
    if (overlap) return "Already covered by higher-ranked options.";
  }

  // 6. Final fallback — partial match, nothing strongly disqualifying.
  return "Low fit on your passport — only a partial match.";
}

// ResourceRow → SkipFacets adapter for the production recommend route.
// Three of explainSkip's signals are wired up: community, industry, and
// geo. `stages` is intentionally omitted — stage info on a `ResourceRow`
// lives in `topics` (CSV `Topics` lifecycle markers, not a structured
// enum), and decoding it for negative matching is more nuance than the
// other three signals warrant. `needs` is mock-only for now (Catalogue
// has `matches.needs`; ResourceRow does not), so the "already covered"
// branch of explainSkip never fires from production traffic.
export function resourceRowToSkipFacets(r: ResourceRow): SkipFacets {
  const counties = r.locations
    .map((l) => l.county)
    .filter((c): c is string => c !== null);
  const statewide = r.locations.some((l) => l.statewide);
  return {
    industries: r.industries,
    communities: r.communities,
    counties: counties.length > 0 ? counties : undefined,
    statewide,
  };
}
