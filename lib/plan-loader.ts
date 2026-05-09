// Shared plan-loading utilities used by:
//   - GET /api/v1/founder-passports/[id]/plan (cached read)
//   - POST /api/v1/resources/recommend (existing — not refactored yet)
//   - app/plan/[id]/page.tsx (server-side render)
//
// Extracted from app/api/v1/resources/recommend/route.ts so the plan
// page can render real LLM-generated plans for personas instead of
// short-circuiting to recommendMock.

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { founderPassports, recommendations, resources } from "@/db/schema";
import { newId } from "@/lib/ids";
import {
  FounderGoal,
  FounderPassportInput,
  FounderStage,
  FounderUrgency,
} from "@/schemas/founder-passport";
import {
  bucketize,
  scoreResource,
  type Scored,
} from "@/lib/recommend";
import { loadAllResourceRows } from "@/lib/resources-loader";
import {
  bestPositiveBecause,
  explainSkip,
  resourceRowToSkipFacets,
  synthesizeNarrative,
} from "@/lib/recommend-explain";
import { safeParseJson } from "@/lib/json-safe";
import { Bucket } from "@/schemas/recommend";
import type { RecommendResult, RecommendedResource } from "@/types/passport";

export type CachedPlan = {
  passport: FounderPassportInput;
  result: RecommendResult;
};

/**
 * Load a passport plus its cached recommendations from D1. Returns
 * `null` if the passport does not exist. `result.recommendations`
 * is empty when the passport exists but has never been run through
 * /recommend (e.g. a freshly-seeded persona).
 */
export async function loadCachedPlan(id: string): Promise<CachedPlan | null> {
  const d = db();

  const passportRows = await d
    .select()
    .from(founderPassports)
    .where(eq(founderPassports.id, id))
    .limit(1);
  if (passportRows.length === 0) return null;
  const row = passportRows[0];

  const stage = FounderStage.safeParse(row.stage);
  const goal = FounderGoal.safeParse(row.goal);
  if (!stage.success || !goal.success) return null;
  const urgency = row.urgency ? FounderUrgency.safeParse(row.urgency) : null;

  const passport: FounderPassportInput = {
    county: row.county ?? undefined,
    city: row.city ?? undefined,
    stage: stage.data,
    industry: row.industry ?? "",
    communities: safeParseJson<string[]>(row.communitiesJson, []),
    goal: goal.data,
    urgency: urgency && urgency.success ? urgency.data : undefined,
    business_size: row.businessSize ?? undefined,
    business_type: row.businessType ?? undefined,
    needs: safeParseJson<string[]>(row.needsJson, []),
    constraints: safeParseJson<string[]>(row.constraintsJson, []),
    website_url: row.websiteUrl ?? undefined,
  };

  const recRows = await d
    .select({ rec: recommendations, res: resources })
    .from(recommendations)
    .innerJoin(resources, eq(recommendations.resourceId, resources.id))
    .where(eq(recommendations.passportId, id))
    .orderBy(desc(recommendations.score));

  const recs: RecommendedResource[] = [];
  for (const r of recRows) {
    const bucketParsed = Bucket.safeParse(r.rec.bucket);
    if (!bucketParsed.success) continue;
    recs.push({
      resourceId: r.res.id,
      title: r.res.title,
      score: r.rec.score,
      bucket: bucketParsed.data,
      reasons: safeParseJson<string[]>(r.rec.reasonsJson, []),
      because: r.rec.actionText ?? "",
      actionText: "",
      kind: r.res.kind ?? undefined,
      sourceUrl: r.res.sourceUrl ?? undefined,
      contactEmail: r.res.contactEmail ?? undefined,
    });
  }

  return {
    passport,
    result: {
      passportId: id,
      narrative: row.narrativeText ?? "",
      recommendations: recs,
      generatedAt: new Date().toISOString(),
      degraded: row.narrativeDegraded === true,
    },
  };
}

/**
 * Run the full recommend pipeline (score → LLM synthesis → persist)
 * against a saved passport id. Same logic as the POST recommend route
 * when called with `{ passport_id }`. Returns the generated plan;
 * throws if the passport does not exist.
 */
export async function generatePlanForPassport(id: string): Promise<CachedPlan> {
  const cached = await loadCachedPlan(id);
  if (!cached) {
    throw new Error(`Passport ${id} not found`);
  }
  const { passport } = cached;
  const d = db();

  const allResources = await loadAllResourceRows();
  const scored: Scored[] = allResources.map((resource) => ({
    resource,
    ...scoreResource(resource, passport),
  }));
  const buckets = bucketize(scored);

  type LabelledScored = Scored & { bucket: "now" | "next" | "ignore" };
  const labelled: LabelledScored[] = [
    ...buckets.now.map((s) => ({ ...s, bucket: "now" as const })),
    ...buckets.next.map((s) => ({ ...s, bucket: "next" as const })),
    ...buckets.ignore.map((s) => ({ ...s, bucket: "ignore" as const })),
  ];

  const topForLLM = labelled.filter((s) => s.bucket !== "ignore");
  const { narrative, degraded } = await synthesizeNarrative(passport, topForLLM);

  const becauseFor = (s: LabelledScored): string =>
    s.bucket === "ignore"
      ? explainSkip(resourceRowToSkipFacets(s.resource), passport)
      : bestPositiveBecause(s, passport);

  await d.delete(recommendations).where(eq(recommendations.passportId, id));
  if (labelled.length > 0) {
    await d.insert(recommendations).values(
      labelled.map((s) => ({
        id: newId("rec"),
        passportId: id,
        resourceId: s.resource.id,
        score: s.score,
        reasonsJson: JSON.stringify(s.reasons),
        actionText: becauseFor(s),
        bucket: s.bucket,
        createdAt: new Date(),
      })),
    );
  }
  await d
    .update(founderPassports)
    .set({ narrativeText: narrative, narrativeDegraded: degraded })
    .where(eq(founderPassports.id, id));

  const recs: RecommendedResource[] = labelled.map((s) => ({
    resourceId: s.resource.id,
    title: s.resource.title,
    score: s.score,
    bucket: s.bucket,
    reasons: s.reasons,
    because: becauseFor(s),
    actionText: "",
    kind: s.resource.kind ?? undefined,
    sourceUrl: s.resource.sourceUrl ?? undefined,
    contactEmail: s.resource.contactEmail ?? undefined,
  }));

  return {
    passport,
    result: {
      passportId: id,
      narrative,
      recommendations: recs,
      generatedAt: new Date().toISOString(),
      degraded,
    },
  };
}
