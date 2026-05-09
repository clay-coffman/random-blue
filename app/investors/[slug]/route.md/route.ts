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
    return new NextResponse("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new NextResponse(result.markdown, {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
