import { NextResponse } from "next/server";
import { investorCard } from "@/lib/investor-card";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const result = await investorCard(slug);
  if (!result) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Investor not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json(result.card);
}
