import { db } from "@/lib/db";
import { founderPassports } from "@/db/schema";
import { newId } from "@/lib/ids";
import { ApiError, errorResponse } from "@/lib/api-error";
import { FounderPassportInput } from "@/schemas/founder-passport";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = FounderPassportInput.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Invalid passport input",
        status: 400,
        details: parsed.error.format(),
      });
    }
    const input = parsed.data;
    const id = newId("fp");

    await db()
      .insert(founderPassports)
      .values({
        id,
        county: input.county ?? null,
        city: input.city ?? null,
        stage: input.stage,
        industry: input.industry,
        communitiesJson: JSON.stringify(input.communities),
        goal: input.goal,
        urgency: input.urgency ?? null,
        businessSize: input.business_size ?? null,
        businessType: input.business_type ?? null,
        needsJson: JSON.stringify(input.needs),
        constraintsJson: JSON.stringify(input.constraints),
        websiteUrl: input.website_url ?? null,
        createdAt: new Date(),
      });

    return Response.json({ passport_id: id }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("[founder-passports POST]", err);
    return errorResponse("INTERNAL", "Unexpected error", 500);
  }
}
