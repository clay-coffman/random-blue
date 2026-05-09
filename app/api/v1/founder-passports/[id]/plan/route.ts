import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { founderPassports, recommendations, resources } from "@/db/schema";
import { ApiError, errorResponse } from "@/lib/api-error";
import { Bucket } from "@/schemas/recommend";
import { safeParseJson } from "@/lib/json-safe";
import type {
  RecommendResponseWire,
  RecommendedResourceWire,
} from "@/types/api";


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
    const narrative = passport[0].narrativeText ?? "";
    const degraded = passport[0].narrativeDegraded === true;

    const rows = await d
      .select({
        rec: recommendations,
        res: resources,
      })
      .from(recommendations)
      .innerJoin(resources, eq(recommendations.resourceId, resources.id))
      .where(eq(recommendations.passportId, id))
      .orderBy(desc(recommendations.score));

    const recs: RecommendedResourceWire[] = [];
    for (const r of rows) {
      // Validate the bucket value at the boundary; drop the row if it's
      // unrecognized rather than silently labeling it `next`.
      const bucketParsed = Bucket.safeParse(r.rec.bucket);
      if (!bucketParsed.success) continue;
      recs.push({
        resource_id: r.res.id,
        title: r.res.title,
        score: r.rec.score,
        bucket: bucketParsed.data,
        reasons: safeParseJson<string[]>(r.rec.reasonsJson, []),
        // `actionText` column carries the per-rec humanized `because`
        // (see recommend POST handler — humanizeReason output for
        // now/next, explainSkip output for ignore).
        because: r.rec.actionText ?? "",
        action_text: "",
        kind: r.res.kind ?? undefined,
        source_url: r.res.sourceUrl ?? undefined,
        contact_email: r.res.contactEmail ?? undefined,
      });
    }

    const payload: RecommendResponseWire = {
      passport_id: id,
      narrative,
      recommendations: recs,
      generated_at: new Date().toISOString(),
      degraded,
    };
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("[plan GET]", err);
    return errorResponse("INTERNAL", "Unexpected error", 500);
  }
}
