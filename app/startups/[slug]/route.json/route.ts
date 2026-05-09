import { NextResponse } from "next/server";
import { getCompanyCard, toWireCompanyCard } from "@/lib/company-card";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const card = await getCompanyCard(slug);
  if (!card) {
    return NextResponse.json(
      {
        error: {
          code: "company_not_found",
          message: `No company with slug ${slug}`,
        },
      },
      { status: 404 },
    );
  }
  return NextResponse.json(toWireCompanyCard(card), {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
