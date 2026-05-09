// Source-bound LLM synthesis pass. Given the top-N scored resources,
// asks Anthropic for ONE plan-scoped paragraph that hedges adjacency,
// names specific orgs, and uses the founder's chosen labels (no
// snake_case bleed). Never throws — on timeout / error / parse failure,
// returns a deterministic templated paragraph so the plan page always
// has a synthesis block.
//
// Per-resource humanized one-liners (the `because` field on each rec)
// come from `humanizeReason` here too — purely deterministic, label-
// translated; lives next to the LLM code so the same vocabulary maps
// are imported once.

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ANTHROPIC_MODEL, anthropic, cachedSystem } from "./anthropic";
import type { ResourceRow, Scored } from "./recommend";
import type { FounderPassportInput } from "@/schemas/founder-passport";
import {
  COMMUNITY_TAGS,
  INDUSTRIES,
  STAGES,
  communityLabel,
  goalLabel,
  industryLabel,
  labelFor,
  needLabel,
  stageLabel,
  urgencyLabel,
} from "./intake-options";

const HARD_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 250;

const NarrativeSchema = z.object({ narrative: z.string().min(1) });

const SYSTEM = `You write a one-paragraph synthesis explaining a Utah founder's recommended resources.
The structured scoring already produced the bullet list of reasons — your job is the cross-cutting story, not a paraphrase.

Rules — non-negotiable:
- Use ONLY the resources, founder labels, and match_signals provided. Cite resources by title (not ID). Never invent eligibility.
- Use the founder's labels verbatim from \`founder.labels\` — e.g. "B2B SaaS", not "software/IT"; "Seed round", not "raise_seed_round". Never output snake_case enums (raise_seed_round, paying_customers, b2b_saas, etc).
- When most retrieved items have \`match_signals.stage === "adjacent"\`, hedge explicitly in plain English (e.g. "built for growth-stage founders — close enough to your paying-customers stage to still apply"). Don't pretend partial matches are clean fits.
- Name 3–5 specific orgs and what each uniquely brings (capital, mentorship, network, geographic specificity). If two orgs play the same role, group them ("[A] and [B] are network plays for warm intros").
- 60–100 words. ONE paragraph. No headers, no bullets, no second-person scolding ("you should consider…").
- Do NOT echo the structured \`reasons\` bullets back. Do NOT start with "Because".

Return JSON only, matching this shape:
{ "narrative": "..." }`;

// ─── Per-resource humanizer ────────────────────────────────────────────
//
// Translates the deterministic reason strings produced by `lib/recommend.ts`
// into prose suitable for the wire `because` field. Closed set of
// patterns — anything unrecognised falls through unchanged so we don't
// silently swallow new reason formats added by the scorer.

function humanizeReasonInner(
  reason: string,
  passport: FounderPassportInput,
): string {
  // "Matches stage: paying_customers"
  let m = reason.match(/^Matches stage:\s*(.+)$/i);
  if (m) return `Matches your ${stageLabel(m[1].trim())} stage`;

  // "Adjacent stage tagged (growth)"
  m = reason.match(/^Adjacent stage tagged \((.+)\)$/i);
  if (m) {
    const adjacent = stageLabel(m[1].trim());
    const founder = passport.stage ? stageLabel(passport.stage) : "your";
    return `Built for ${adjacent}-stage founders (close to your ${founder} stage)`;
  }

  // "Tagged customers (matches your goal: find_customers)"
  m = reason.match(/^Tagged (.+) \(matches your goal:\s*(.+)\)$/i);
  if (m) return `Tagged ${m[1].trim()} — matches your ${goalLabel(m[2].trim())} goal`;

  // "Tagged software and information technology" (industry)
  m = reason.match(/^Tagged (.+)$/i);
  if (m) return `Tagged ${m[1].trim()}`;

  // "For women-focused founders" → use COMMUNITY_TAGS label.
  m = reason.match(/^For (.+)-focused founders$/i);
  if (m) {
    const raw = m[1].trim();
    return `For ${communityLabel(raw)} founders`;
  }

  return reason;
}

export function humanizeReason(
  reason: string,
  passport: FounderPassportInput,
): string {
  const out = humanizeReasonInner(reason, passport);
  // Belt-and-suspenders: if any snake_case still slipped through,
  // titlecase the chunk so it never reaches the user as-is.
  if (/[a-z]_[a-z]/.test(out)) {
    return out.replace(/[a-z]+(?:_[a-z]+)+/g, (s) =>
      s
        .split("_")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" "),
    );
  }
  return out;
}

// Pick the best one-liner for a positive-bucket card. Prefer reasons in
// scorer order (stage → location → goal → industry → community); first
// non-empty humanized form wins.
export function bestPositiveBecause(
  s: Scored,
  passport: FounderPassportInput,
): string {
  for (const r of s.reasons) {
    const h = humanizeReason(r, passport);
    if (h.length > 0) return h;
  }
  return `Strong match for ${s.resource.title}`;
}

// ─── Match-signal extraction (for the LLM user prompt) ─────────────────
//
// The scorer encodes axis-level fit in the reason strings. We unpack
// that here so the LLM can hedge correctly without re-running the
// scorer.

type AxisSignal = "exact" | "adjacent" | "none";
type MatchSignals = {
  stage: AxisSignal;
  goal: AxisSignal;
  industry: AxisSignal;
  community: AxisSignal;
  geo: AxisSignal;
};

function signalsFromReasons(reasons: string[]): MatchSignals {
  const s: MatchSignals = {
    stage: "none",
    goal: "none",
    industry: "none",
    community: "none",
    geo: "none",
  };
  for (const r of reasons) {
    if (/^Matches stage:/i.test(r)) s.stage = "exact";
    else if (/^Adjacent stage tagged/i.test(r)) s.stage = "adjacent";
    else if (/matches your goal:/i.test(r)) s.goal = "exact";
    else if (/^Tagged (?!.*matches your goal)/i.test(r)) s.industry = "exact";
    else if (/^For .+-focused founders$/i.test(r)) s.community = "exact";
    else if (/^Statewide resource$/i.test(r) || /^Applies in /i.test(r))
      s.geo = "exact";
  }
  return s;
}

// ─── Narrative synthesis ───────────────────────────────────────────────

type LabeledPassport = {
  stage?: string;
  industry?: string;
  goal?: string;
  urgency?: string;
  county?: string;
  city?: string;
  communities: string[];
  needs: string[];
};

function passportLabels(p: FounderPassportInput): LabeledPassport {
  return {
    stage: p.stage ? stageLabel(p.stage) : undefined,
    industry: p.industry ? industryLabel(p.industry) : undefined,
    goal: p.goal ? goalLabel(p.goal) : undefined,
    urgency: p.urgency ? urgencyLabel(p.urgency) : undefined,
    county: p.county,
    city: p.city,
    communities: p.communities.map(communityLabel),
    needs: p.needs.map(needLabel),
  };
}

function buildNarrativeUserContent(
  passport: FounderPassportInput,
  retrieved: Scored[],
): string {
  const items = retrieved.map((s) => ({
    resource_id: s.resource.id,
    title: s.resource.title,
    kind: s.resource.kind,
    // Cap description tokens so input cost doesn't balloon when the
    // CSV happens to ship long descriptions.
    description: s.resource.description?.slice(0, 200) ?? null,
    industries: s.resource.industries,
    communities: s.resource.communities,
    locations: s.resource.locations,
    match_signals: signalsFromReasons(s.reasons),
  }));
  return [
    "<founder>",
    JSON.stringify(
      { raw: passport, labels: passportLabels(passport) },
      null,
      2,
    ),
    "</founder>",
    "<retrieved>",
    JSON.stringify(items, null, 2),
    "</retrieved>",
  ].join("\n");
}

export type NarrativeResult = { narrative: string; degraded: boolean };

export async function synthesizeNarrative(
  passport: FounderPassportInput,
  retrieved: Scored[],
  client?: Anthropic,
): Promise<NarrativeResult> {
  if (retrieved.length === 0) return { narrative: "", degraded: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

  try {
    const c = client ?? anthropic();
    const response = await c.messages.create(
      {
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: cachedSystem(SYSTEM),
        messages: [
          {
            role: "user",
            content: buildNarrativeUserContent(passport, retrieved),
          },
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
    if (!jsonMatch) {
      console.error("[recommend-explain] LLM returned no JSON object", { text });
      return { narrative: deterministicNarrative(passport, retrieved), degraded: true };
    }
    const parsed = NarrativeSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) {
      console.error(
        "[recommend-explain] LLM JSON failed schema",
        parsed.error.format(),
      );
      return { narrative: deterministicNarrative(passport, retrieved), degraded: true };
    }
    return { narrative: parsed.data.narrative.trim(), degraded: false };
  } catch (err) {
    console.error("[recommend-explain] generation failed", err);
    return { narrative: deterministicNarrative(passport, retrieved), degraded: true };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Deterministic templated fallback ──────────────────────────────────
//
// Mechanical synthesis used when the LLM call fails (network, timeout,
// invalid JSON, schema mismatch). Never empty, never snake_case. The
// shape mirrors the LLM's brief: name a few orgs, hedge adjacency,
// mention the founder's profile in their own words.

export function deterministicNarrative(
  passport: FounderPassportInput,
  retrieved: Scored[],
): string {
  if (retrieved.length === 0) return "";

  const labels = passportLabels(passport);
  const profileBits: string[] = [];
  if (labels.industry) profileBits.push(labels.industry);
  if (labels.stage) profileBits.push(`${labels.stage.toLowerCase()} stage`);
  if (labels.goal) profileBits.push(`focused on ${labels.goal.toLowerCase()}`);
  const profile =
    profileBits.length > 0
      ? `your profile (${profileBits.join(", ")})`
      : "your profile";

  const communityClause =
    labels.communities.length > 0
      ? ` and ${labels.communities.map((c) => c.toLowerCase()).join(" / ")} communities`
      : "";

  // Split top items into the first batch (now-equivalent) vs the rest.
  const firstBatch = retrieved.slice(0, 3).map((s) => s.resource.title);
  const restBatch = retrieved.slice(3, 6).map((s) => s.resource.title);

  const firstSentence =
    firstBatch.length > 0
      ? `Based on ${profile}${communityClause}, the strongest matches are ${firstBatch.join(", ")}` +
        (restBatch.length > 0
          ? `, with ${restBatch.join(", ")} to follow.`
          : ".")
      : `Based on ${profile}${communityClause}, no strong matches surfaced.`;

  // Hedge if the majority of retrieved items show stage adjacency.
  const adjacents: string[] = [];
  for (const s of retrieved) {
    const sig = signalsFromReasons(s.reasons);
    if (sig.stage === "adjacent") {
      const m = s.reasons
        .find((r) => /^Adjacent stage tagged/i.test(r))
        ?.match(/^Adjacent stage tagged \((.+)\)$/i);
      if (m) adjacents.push(stageLabel(m[1].trim()).toLowerCase());
    }
  }
  let hedge = "";
  if (adjacents.length >= Math.ceil(retrieved.length / 2)) {
    const adjLabel = mostCommon(adjacents) ?? adjacents[0];
    const founderStage = labels.stage?.toLowerCase() ?? "your";
    hedge = ` Most are tagged for ${adjLabel}-stage founders rather than ${founderStage} — the fit is adjacent.`;
  }

  return `${firstSentence}${hedge}`.trim();
}

function mostCommon(xs: string[]): string | null {
  if (xs.length === 0) return null;
  const counts = new Map<string, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
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
