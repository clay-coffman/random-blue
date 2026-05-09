import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { founderPassports, recommendations } from "@/db/schema";
import { newId } from "@/lib/ids";
import { ApiError, errorResponse } from "@/lib/api-error";
import { RecommendRequest } from "@/schemas/recommend";
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
import { explainRecommendations } from "@/lib/recommend-explain";
import { safeParseJson } from "@/lib/json-safe";
import type {
  Bucket,
  RecommendResponseWire,
  RecommendedResourceWire,
} from "@/types/api";

export const runtime = "edge";
// Note: `maxDuration` (Vercel Functions config) is intentionally omitted —
// the deploy target is Cloudflare Workers, where it has no effect. The
// real long-tail caps are the AbortController timeouts in
// explainRecommendations (12s) and enrichWebsite (8s fetch + 10s LLM).

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = RecommendRequest.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Invalid recommend request",
        status: 400,
        details: parsed.error.format(),
      });
    }
    const input = parsed.data;
    const d = db();

    // 1. Resolve or create passport.
    let passportId: string;
    let passport: FounderPassportInput;

    if (input.passport_id) {
      // When `passport_id` is provided, the saved passport wins. Sending a
      // full body alongside is a client mistake — reject so callers don't
      // silently lose fields. (Documented in openapi-additions.md.)
      const sentExtraFields =
        input.stage !== undefined ||
        input.industry !== undefined ||
        input.goal !== undefined;
      if (sentExtraFields) {
        throw new ApiError({
          code: "BAD_REQUEST",
          message:
            "Send either `passport_id` (use saved passport) OR a full passport body, not both.",
          status: 400,
        });
      }

      const rows = await d
        .select()
        .from(founderPassports)
        .where(eq(founderPassports.id, input.passport_id))
        .limit(1);
      const row = rows[0];
      if (!row) {
        throw new ApiError({
          code: "NOT_FOUND",
          message: `Passport ${input.passport_id} not found`,
          status: 404,
        });
      }
      passportId = row.id;

      // Validate enum-typed columns at the boundary. The DB stores text
      // without CHECK constraints, so a corrupt or out-of-vocab value is
      // possible. Asymmetric handling on purpose:
      //   - stage / goal are required for scoring → hard-fail with
      //     INTERNAL so the corrupt row surfaces loudly.
      //   - urgency is optional in the schema → coerce to undefined on
      //     unknown values rather than 500.
      const stage = FounderStage.safeParse(row.stage);
      const goal = FounderGoal.safeParse(row.goal);
      if (!stage.success || !goal.success) {
        throw new ApiError({
          code: "INTERNAL",
          message: `Stored passport ${row.id} has invalid stage/goal`,
          status: 500,
        });
      }
      const urgency = row.urgency
        ? FounderUrgency.safeParse(row.urgency)
        : null;

      passport = {
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
    } else {
      // Validate the body as a full passport input.
      const fullParsed = FounderPassportInput.safeParse(input);
      if (!fullParsed.success) {
        throw new ApiError({
          code: "BAD_REQUEST",
          message:
            "Either passport_id or a full passport body is required",
          status: 400,
          details: fullParsed.error.format(),
        });
      }
      passport = fullParsed.data;
      passportId = newId("fp");
      const createdAt = new Date();
      await d.insert(founderPassports).values({
        id: passportId,
        county: passport.county ?? null,
        city: passport.city ?? null,
        stage: passport.stage,
        industry: passport.industry,
        communitiesJson: JSON.stringify(passport.communities),
        goal: passport.goal,
        urgency: passport.urgency ?? null,
        businessSize: passport.business_size ?? null,
        businessType: passport.business_type ?? null,
        needsJson: JSON.stringify(passport.needs),
        constraintsJson: JSON.stringify(passport.constraints),
        websiteUrl: passport.website_url ?? null,
        // Mirror POST /founder-passports: stamp enrich provenance only
        // when the front-end opts in via `enrichment_source`.
        enrichmentSource: passport.enrichment_source ?? null,
        enrichedAt: passport.enrichment_source ? createdAt : null,
        createdAt,
      });
    }

    // 2. Score every resource in memory.
    const allResources = await loadAllResourceRows();
    const scored: Scored[] = allResources.map((resource) => ({
      resource,
      ...scoreResource(resource, passport),
    }));
    const buckets = bucketize(scored);

    const labelled: Array<Scored & { bucket: Bucket }> = [
      ...buckets.now.map((s) => ({ ...s, bucket: "now" as const })),
      ...buckets.next.map((s) => ({ ...s, bucket: "next" as const })),
      ...buckets.ignore.map((s) => ({ ...s, bucket: "ignore" as const })),
    ];

    // 3. Source-bound LLM "Because…" for top 6 (now + next).
    const topForLLM = labelled.filter((s) => s.bucket !== "ignore");
    const explanations = await explainRecommendations(passport, topForLLM);

    // 4. Persist (idempotent: replace). The DB column `actionText` carries
    // the "Because…" sentence today; if a future iteration wants a separate
    // suggested-action field, add a `because_text` column and migrate.
    await d
      .delete(recommendations)
      .where(eq(recommendations.passportId, passportId));
    if (labelled.length > 0) {
      await d.insert(recommendations).values(
        labelled.map((s) => ({
          id: newId("rec"),
          passportId,
          resourceId: s.resource.id,
          score: s.score,
          reasonsJson: JSON.stringify(s.reasons),
          actionText: explanations.get(s.resource.id) ?? null,
          bucket: s.bucket,
          createdAt: new Date(),
        })),
      );
    }

    // 5. Shape response.
    const recs: RecommendedResourceWire[] = labelled.map((s) => ({
      resource_id: s.resource.id,
      title: s.resource.title,
      score: s.score,
      bucket: s.bucket,
      reasons: s.reasons,
      because: explanations.get(s.resource.id) ?? "",
      action_text: "",
      kind: s.resource.kind ?? undefined,
      source_url: s.resource.sourceUrl ?? undefined,
      contact_email: s.resource.contactEmail ?? undefined,
    }));

    const payload: RecommendResponseWire = {
      passport_id: passportId,
      recommendations: recs,
      generated_at: new Date().toISOString(),
    };
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("[recommend POST]", err);
    return errorResponse("INTERNAL", "Unexpected error", 500);
  }
}
