import {
  formatCompanyCardMarkdown,
  getCompanyCard,
} from "@/lib/company-card";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const card = await getCompanyCard(slug);
  if (!card) {
    return new Response(`# Not found\n\nNo company with slug \`${slug}\`.\n`, {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
  return new Response(formatCompanyCardMarkdown(card), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
