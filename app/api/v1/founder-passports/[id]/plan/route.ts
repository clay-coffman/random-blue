import { ApiError, errorResponse } from "@/lib/api-error";
import { loadCachedPlan } from "@/lib/plan-loader";
import { toWireRecommendResponse } from "@/lib/api-codec";
import type { RecommendResponseWire } from "@/types/api";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const cached = await loadCachedPlan(id);
    if (!cached) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: `Passport ${id} not found`,
        status: 404,
      });
    }
    const payload: RecommendResponseWire = toWireRecommendResponse(
      cached.result,
    );
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("[plan GET]", err);
    return errorResponse("INTERNAL", "Unexpected error", 500);
  }
}
