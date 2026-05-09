import { NextResponse } from "next/server";
import { canSeeInvestor, investorCard } from "@/lib/investor-card";
import { getApiSession } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
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
  const session = await getApiSession(req);
  if (
    !canSeeInvestor(
      result.row,
      session?.user.id ?? null,
      session?.user.role ?? null,
    )
  ) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Investor not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json(result.card);
}
