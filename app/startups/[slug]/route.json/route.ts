import { NextResponse } from "next/server";
import { companyCard } from "@/lib/company-card";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const result = await companyCard(slug);
  if (!result) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Company not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json(result.card);
}
