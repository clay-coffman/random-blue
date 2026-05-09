import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions, companies } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { authorizeSessionWrite, getApiSession } from "@/lib/auth-utils";
import { newId } from "@/lib/ids";
import { env } from "@/lib/cf";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function extFromMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

// POST /api/v1/ownership-submissions — owner uploads a verification doc
// for a company. Multipart with `company_slug` + `file`.
export async function POST(req: Request) {
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const session = { user: auth.user };

  // Per-IP rate limit on uploads (10 / minute). Cloudflare's native
  // ratelimit binding is fixed-window in-edge — no DB writes, no
  // KV calls. The auth gate above already drops unauthenticated
  // callers; this throttle's job is bounding *authenticated* upload
  // abuse (stolen session, misbehaving owner) before we pay the
  // multipart-parse + R2 cost.
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await env().UPLOAD_LIMIT.limit({ key: ip });
  if (!success) {
    return errorResponse(
      "rate_limited",
      "Too many uploads. Try again in a minute.",
      429,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errorResponse("bad_request", "Multipart form-data required.", 400);
  }

  const slug = String(form.get("company_slug") ?? "").trim();
  const file = form.get("file");
  if (!slug || !(file instanceof File)) {
    return errorResponse(
      "bad_request",
      "Required fields: company_slug, file.",
      400,
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return errorResponse(
      "unsupported_media_type",
      `File type not accepted. Use PDF, PNG, JPEG, or WebP.`,
      415,
    );
  }
  if (file.size === 0) {
    return errorResponse("bad_request", "File is empty.", 400);
  }
  if (file.size > MAX_BYTES) {
    return errorResponse(
      "payload_too_large",
      "File exceeds the 10 MB limit.",
      413,
    );
  }

  const [company] = await db()
    .select({ id: companies.id, claimedByUserId: companies.claimedByUserId })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) return errorResponse("not_found", "Company not found.", 404);

  if (
    company.claimedByUserId &&
    company.claimedByUserId !== session.user.id
  ) {
    return errorResponse(
      "conflict",
      "This company is already claimed by another account. Contact GOEO to dispute.",
      409,
    );
  }

  // Reject duplicate pending submissions for the same user+company.
  const [existing] = await db()
    .select({ id: businessOwnershipSubmissions.id })
    .from(businessOwnershipSubmissions)
    .where(
      and(
        eq(businessOwnershipSubmissions.userId, session.user.id),
        eq(businessOwnershipSubmissions.companyId, company.id),
        eq(businessOwnershipSubmissions.status, "pending"),
      ),
    )
    .limit(1);
  if (existing) {
    return NextResponse.json({
      submission_id: existing.id,
      status: "pending",
      duplicate: true,
    });
  }

  const submissionId = newId("bos");
  const ext = extFromMime(file.type);
  const r2Key = `submissions/${session.user.id}/${submissionId}.${ext}`;

  // Upload to OWNERSHIP_DOCS bucket.
  const bytes = await file.arrayBuffer();
  await env().OWNERSHIP_DOCS.put(r2Key, bytes, {
    httpMetadata: { contentType: file.type },
  });

  await db().insert(businessOwnershipSubmissions).values({
    id: submissionId,
    userId: session.user.id,
    companyId: company.id,
    r2Key,
    mimeType: file.type,
    fileSize: file.size,
    status: "pending",
  });

  return NextResponse.json(
    { submission_id: submissionId, status: "pending" },
    { status: 201 },
  );
}

// GET /api/v1/ownership-submissions — caller's own submissions.
export async function GET(req: Request) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);

  const rows = await db()
    .select({
      id: businessOwnershipSubmissions.id,
      companyId: businessOwnershipSubmissions.companyId,
      r2Key: businessOwnershipSubmissions.r2Key,
      mimeType: businessOwnershipSubmissions.mimeType,
      fileSize: businessOwnershipSubmissions.fileSize,
      submittedAt: businessOwnershipSubmissions.submittedAt,
      status: businessOwnershipSubmissions.status,
      reviewedAt: businessOwnershipSubmissions.reviewedAt,
      reviewNotes: businessOwnershipSubmissions.reviewNotes,
      companySlug: companies.slug,
      companyName: companies.name,
    })
    .from(businessOwnershipSubmissions)
    .leftJoin(
      companies,
      eq(businessOwnershipSubmissions.companyId, companies.id),
    )
    .where(eq(businessOwnershipSubmissions.userId, session.user.id))
    .orderBy(desc(businessOwnershipSubmissions.submittedAt));

  return NextResponse.json({ submissions: rows });
}
