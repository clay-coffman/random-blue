import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions, companies } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession, isAdminRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);

  const [row] = await db()
    .select({
      submission: businessOwnershipSubmissions,
      company: companies,
    })
    .from(businessOwnershipSubmissions)
    .leftJoin(
      companies,
      eq(businessOwnershipSubmissions.companyId, companies.id),
    )
    .where(eq(businessOwnershipSubmissions.id, id))
    .limit(1);
  if (!row) return errorResponse("not_found", "Submission not found.", 404);

  const isAdmin = isAdminRole(session.user.role);
  const isOwner = row.submission.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return errorResponse("forbidden", "You can only view your own submissions.", 403);
  }

  return NextResponse.json({
    submission: row.submission,
    company: row.company,
  });
}

// PATCH: admin-only approve / reject. On approve, transactionally
// stamp the company with claimed_by_user_id, verified_at, claimed_at.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);
  if (!isAdminRole(session.user.role)) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }

  const body = (await req.json().catch(() => null)) as {
    status?: "approved" | "rejected" | "needs_more_info";
    review_notes?: string | null;
  } | null;
  if (
    !body ||
    !["approved", "rejected", "needs_more_info"].includes(body.status ?? "")
  ) {
    return errorResponse(
      "bad_request",
      "status must be approved | rejected | needs_more_info.",
      400,
    );
  }

  const [submission] = await db()
    .select()
    .from(businessOwnershipSubmissions)
    .where(eq(businessOwnershipSubmissions.id, id))
    .limit(1);
  if (!submission) return errorResponse("not_found", "Submission not found.", 404);

  const now = new Date();
  await db()
    .update(businessOwnershipSubmissions)
    .set({
      status: body.status!,
      reviewedByUserId: session.user.id,
      reviewedAt: now,
      reviewNotes: body.review_notes ?? null,
    })
    .where(eq(businessOwnershipSubmissions.id, id));

  if (body.status === "approved") {
    await db()
      .update(companies)
      .set({
        claimedByUserId: submission.userId,
        verifiedAt: now,
        claimedAt: now,
        lastUpdatedBy: session.user.id,
        lastUpdatedAt: now,
      })
      .where(eq(companies.id, submission.companyId));
  }

  const [updated] = await db()
    .select()
    .from(businessOwnershipSubmissions)
    .where(eq(businessOwnershipSubmissions.id, id))
    .limit(1);
  return NextResponse.json({ submission: updated });
}
