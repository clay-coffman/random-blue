import { NextResponse } from "next/server";
import { like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources, companies } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

type SearchResult = {
  kind: "resource" | "company";
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  score: number;
};

// Simple LIKE-based ranking: exact-prefix in title beats anywhere-in-title
// beats anywhere-in-description. Good enough until we move to FTS5.
function scoreText(haystack: string | null | undefined, needle: string) {
  if (!haystack) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(n)) return 50;
  return 0;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type") ?? "all";
  const limit = Math.min(
    50,
    Number(url.searchParams.get("limit") ?? "20") || 20,
  );

  if (!q) {
    return errorResponse("bad_request", "Query parameter `q` is required.", 400);
  }
  if (!["resources", "companies", "all"].includes(type)) {
    return errorResponse(
      "bad_request",
      "Parameter `type` must be one of: resources, companies, all.",
      400,
    );
  }

  const out: SearchResult[] = [];

  if (type === "resources" || type === "all") {
    const rRows = await db()
      .select({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        kind: resources.kind,
      })
      .from(resources)
      .where(
        or(
          like(resources.title, `%${q}%`),
          like(resources.description, `%${q}%`),
        ),
      )
      .limit(limit);

    for (const r of rRows) {
      const titleScore = scoreText(r.title, q);
      const descScore = Math.floor(scoreText(r.description, q) * 0.5);
      out.push({
        kind: "resource",
        id: r.id,
        title: r.title,
        summary: r.description ?? r.kind ?? undefined,
        score: Math.max(titleScore, descScore),
      });
    }
  }

  if (type === "companies" || type === "all") {
    const cRows = await db()
      .select({
        id: companies.id,
        slug: companies.slug,
        name: companies.name,
        website: companies.website,
        sector: companies.sector,
      })
      .from(companies)
      .where(
        or(
          like(companies.name, `%${q}%`),
          like(companies.slug, `%${q}%`),
          like(companies.website, `%${q}%`),
        ),
      )
      .limit(limit);

    for (const c of cRows) {
      const nameScore = scoreText(c.name, q);
      const slugScore = Math.floor(scoreText(c.slug, q) * 0.8);
      const webScore = Math.floor(scoreText(c.website, q) * 0.4);
      out.push({
        kind: "company",
        id: c.id,
        slug: c.slug,
        title: c.name,
        summary: c.sector ?? undefined,
        score: Math.max(nameScore, slugScore, webScore),
      });
    }
  }

  out.sort((a, b) => b.score - a.score);
  return NextResponse.json({ results: out.slice(0, limit) });
}
