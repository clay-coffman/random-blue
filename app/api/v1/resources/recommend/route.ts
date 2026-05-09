import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { founderPassports, recommendations } from "@/db/schema";
import { newId } from "@/lib/ids";
import { ApiError, errorResponse } from "@/lib/api-error";
import { RecommendRequest } from "@/schemas/recommend";
import { FounderPassportInput } from "@/schemas/founder-passport";
import {
  bucketize,
  scoreResource,
  type Scored,
} from "@/lib/recommend";
import { loadAllResourceRows } from "@/lib/resources-loader";
import { explainRecommendations } from "@/lib/recommend-explain";
import type {
  Bucket,
  RecommendResponse,
  RecommendedResource,
} from "@/types/api";

export const runtime = "edge";
export const maxDuration = 30;

function safeParseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

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
      passport = {
        county: row.county ?? undefined,
        city: row.city ?? undefined,
        stage: row.stage as FounderPassportInput["stage"],
        industry: row.industry ?? "",
        communities: safeParseJson<string[]>(row.communitiesJson, []),
        goal: row.goal as FounderPassportInput["goal"],
        urgency:
          (row.urgency as FounderPassportInput["urgency"]) ?? undefined,
        business_size: row.businessSize ?? undefined,
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
        needsJson: JSON.stringify(passport.needs),
        constraintsJson: JSON.stringify(passport.constraints),
        websiteUrl: passport.website_url ?? null,
        createdAt: new Date(),
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
    const llmUsed = explanations.size > 0;

    // 4. Persist (idempotent: replace).
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
    const recs: RecommendedResource[] = labelled.map((s) => ({
      resource_id: s.resource.id,
      title: s.resource.title,
      source_url: s.resource.sourceUrl,
      score: s.score,
      bucket: s.bucket,
      reasons: s.reasons,
      why: explanations.get(s.resource.id) ?? null,
      action: null,
    }));

    const payload: RecommendResponse = {
      passport_id: passportId,
      recommendations: recs,
      llm_used: llmUsed,
    };
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("[recommend POST]", err);
    return errorResponse("INTERNAL", "Unexpected error", 500);
  }
}
