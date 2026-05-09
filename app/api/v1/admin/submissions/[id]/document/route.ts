import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, isAdminRole } from "@/lib/auth-utils";
import { env } from "@/lib/cf";

export const dynamic = "force-dynamic";

// Admin-only proxy that streams the ownership document directly through
// the OWNERSHIP_DOCS R2 binding. Used as a dev fallback when R2 S3
// credentials aren't configured (so presigned URLs can't be issued).
// Signed URLs remain the default in prod because they offload serving
// to R2's edge. Read-only GET, so no CSRF guard — same-origin policy
// already prevents a hostile page from reading the bytes.
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);
  if (!isAdminRole(session.user.role)) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }

  const { id } = await ctx.params;
  const [row] = await db()
    .select({
      r2Key: businessOwnershipSubmissions.r2Key,
      mimeType: businessOwnershipSubmissions.mimeType,
    })
    .from(businessOwnershipSubmissions)
    .where(eq(businessOwnershipSubmissions.id, id))
    .limit(1);
  if (!row) return errorResponse("not_found", "Submission not found.", 404);

  const obj = await env().OWNERSHIP_DOCS.get(row.r2Key);
  if (!obj) {
    return errorResponse("not_found", "Document not found in R2.", 404);
  }

  return new Response(obj.body, {
    headers: {
      "content-type":
        obj.httpMetadata?.contentType ?? row.mimeType ?? "application/octet-stream",
      "cache-control": "private, no-store",
      "x-r2-source": "binding",
    },
  });
}
