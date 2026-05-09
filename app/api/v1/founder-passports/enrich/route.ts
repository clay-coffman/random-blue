import { ApiError, errorResponse } from "@/lib/api-error";
import { env } from "@/lib/cf";
import { EnrichRequest } from "@/schemas/recommend";
import { enrichWebsite, isDenylistedHost } from "@/lib/website-enrich";


export async function POST(req: Request) {
  try {
    // Per-IP rate limit before the website fetch + Anthropic extract
    // — each call costs real money (see lib/website-enrich.ts). Public
    // endpoint, intentionally tight.
    const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
    const { success } = await env().ENRICH_LIMIT.limit({ key: ip });
    if (!success) {
      return errorResponse(
        "rate_limited",
        "Too many enrich requests. Try again in a minute.",
        429,
      );
    }

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

    if (isDenylistedHost(url)) {
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
