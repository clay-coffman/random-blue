import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { founderPassports, recommendations, resources } from "@/db/schema";
import { ApiError, errorResponse } from "@/lib/api-error";
import type {
  Bucket,
  PlanResponse,
  RecommendedResource,
} from "@/types/api";

export const runtime = "edge";

function safeParseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const d = db();

    const passport = await d
      .select()
      .from(founderPassports)
      .where(eq(founderPassports.id, id))
      .limit(1);
    if (passport.length === 0) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: `Passport ${id} not found`,
        status: 404,
      });
    }

    const rows = await d
      .select({
        rec: recommendations,
        res: resources,
      })
      .from(recommendations)
      .innerJoin(resources, eq(recommendations.resourceId, resources.id))
      .where(eq(recommendations.passportId, id))
      .orderBy(recommendations.score);

    // Sort desc by score; rows came back asc so reverse.
    rows.reverse();

    const recs: RecommendedResource[] = rows.map((r) => ({
      resource_id: r.res.id,
      title: r.res.title,
      source_url: r.res.sourceUrl,
      score: r.rec.score,
      bucket: (r.rec.bucket ?? "next") as Bucket,
      reasons: safeParseJson<string[]>(r.rec.reasonsJson, []),
      why: r.rec.actionText ?? null,
      action: null,
    }));

    const payload: PlanResponse = {
      passport_id: id,
      recommendations: recs,
      llm_used: recs.some((r) => r.why !== null),
    };
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("[plan GET]", err);
    return errorResponse("INTERNAL", "Unexpected error", 500);
  }
}
