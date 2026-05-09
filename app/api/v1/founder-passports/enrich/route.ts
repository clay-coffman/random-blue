import { ApiError, errorResponse } from "@/lib/api-error";
import { EnrichRequest } from "@/schemas/recommend";
import { enrichWebsite } from "@/lib/website-enrich";

export const runtime = "edge";

// Hosts where the founder probably pasted a profile/social, not a business
// site. Brief: defer LinkedIn enrichment; require a real business website.
const DENYLIST = [
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "tiktok.com",
  "github.com",
];

function isDenylisted(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return DENYLIST.some((bad) => host === bad || host.endsWith(`.${bad}`));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = EnrichRequest.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Invalid enrich request — provide a `website_url`.",
        status: 400,
        details: parsed.error.format(),
      });
    }
    const url = parsed.data.website_url;

    if (isDenylisted(url)) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message:
          "Use a business website. Social and profile sites are not supported here.",
        status: 400,
      });
    }

    const result = await enrichWebsite(url);
    return Response.json(result);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    console.error("[enrich POST]", err);
    return errorResponse("INTERNAL", "Unexpected error", 500);
  }
}
