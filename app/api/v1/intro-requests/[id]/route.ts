import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companies,
  introRequests,
  investorProfiles,
} from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import {
  authorizeSessionWrite,
  getApiSession,
  isAdminRole,
} from "@/lib/auth-utils";
import {
  sendIntroAcceptedEmail,
  sendIntroDeclinedEmail,
  sendIntroIntroducedEmail,
} from "@/lib/email";
import { IntroRequestPatchSchema } from "@/schemas/intro-request";

export const dynamic = "force-dynamic";

async function loadIntroBundle(id: string) {
  const [row] = await db()
    .select()
    .from(introRequests)
    .where(eq(introRequests.id, id))
    .limit(1);
  if (!row) return null;

  const [requester] = await db()
    .select({ id: userTable.id, email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, row.requesterUserId))
    .limit(1);

  let targetInvestor: {
    id: string;
    slug: string | null;
    displayName: string | null;
    firmName: string | null;
    userId: string;
    email: string | null;
    name: string | null;
  } | null = null;
  let targetCompany: {
    id: string;
    name: string;
    slug: string;
    claimedByUserId: string | null;
    email: string | null;
    ownerName: string | null;
  } | null = null;

  if (row.targetInvestorId) {
    const [inv] = await db()
      .select({
        id: investorProfiles.id,
        slug: investorProfiles.slug,
        displayName: investorProfiles.displayName,
        firmName: investorProfiles.firmName,
        userId: investorProfiles.userId,
        email: userTable.email,
        name: userTable.name,
      })
      .from(investorProfiles)
      .leftJoin(userTable, eq(userTable.id, investorProfiles.userId))
      .where(eq(investorProfiles.id, row.targetInvestorId))
      .limit(1);
    targetInvestor = inv ?? null;
  }
  if (row.targetCompanyId) {
    const [co] = await db()
      .select({
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        claimedByUserId: companies.claimedByUserId,
        email: userTable.email,
        ownerName: userTable.name,
      })
      .from(companies)
      .leftJoin(userTable, eq(userTable.id, companies.claimedByUserId))
      .where(eq(companies.id, row.targetCompanyId))
      .limit(1);
    targetCompany = co ?? null;
  }

  return { row, requester, targetInvestor, targetCompany };
}

function serializeIntro(
  bundle: NonNullable<Awaited<ReturnType<typeof loadIntroBundle>>>,
) {
  const { row, targetInvestor, targetCompany } = bundle;
  return {
    id: row.id,
    status: row.status,
    submitted_at: row.submittedAt ? row.submittedAt.toISOString?.() ?? null : null,
    reviewed_at: row.reviewedAt ? row.reviewedAt.toISOString?.() ?? null : null,
    admin_notes: row.adminNotes,
    message_text: row.messageText,
    requester_role: row.requesterRole,
    requester_user_id: row.requesterUserId,
    target_type: row.targetInvestorId ? "investor" : "company",
    target_id: row.targetInvestorId ?? row.targetCompanyId,
    target_name:
      targetInvestor?.displayName ??
      targetInvestor?.firmName ??
      targetCompany?.name ??
      null,
    target_url: targetInvestor?.slug
      ? `/investors/${targetInvestor.slug}`
      : targetCompany?.slug
        ? `/startups/${targetCompany.slug}`
        : null,
  };
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getApiSession(req);
  if (!session) {
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const bundle = await loadIntroBundle(id);
  if (!bundle) return errorResponse("not_found", "Intro not found.", 404);

  const userId = session.user.id;
  const isAdmin = isAdminRole(session.user.role);
  const isRequester = bundle.row.requesterUserId === userId;
  const isInvestorTarget =
    bundle.targetInvestor?.userId === userId &&
    (bundle.row.status === "accepted" || bundle.row.status === "introduced");
  const isCompanyTarget =
    bundle.targetCompany?.claimedByUserId === userId &&
    (bundle.row.status === "accepted" || bundle.row.status === "introduced");

  if (!isAdmin && !isRequester && !isInvestorTarget && !isCompanyTarget) {
    return errorResponse(
      "forbidden",
      "You can't view this intro request.",
      403,
    );
  }

  return NextResponse.json({ intro: serializeIntro(bundle) });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  if (!isAdminRole(auth.user.role)) {
    return errorResponse("forbidden", "Admin role required.", 403);
  }

  const bundle = await loadIntroBundle(id);
  if (!bundle) return errorResponse("not_found", "Intro not found.", 404);

  // Concurrent-action guard: only `pending` intros are actionable.
  // Two admins could otherwise double-fire emails.
  if (bundle.row.status !== "pending") {
    return errorResponse(
      "conflict",
      `Intro already ${bundle.row.status}.`,
      409,
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = IntroRequestPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid PATCH body.",
      400,
      parsed.error.flatten(),
    );
  }
  const { status, admin_notes } = parsed.data;

  const now = new Date();
  await db()
    .update(introRequests)
    .set({
      status,
      adminNotes: admin_notes ?? null,
      reviewedByUserId: auth.user.id,
      reviewedAt: now,
    })
    .where(eq(introRequests.id, id));

  // Refresh.
  const refreshed = await loadIntroBundle(id);
  if (!refreshed) {
    return errorResponse("internal", "Intro vanished after update.", 500);
  }

  // Email dispatch — fire-and-forget. Mail failures shouldn't roll
  // back the status flip; admins can re-send out-of-band.
  try {
    await dispatchEmails({
      bundle: refreshed,
      status,
      adminNote: admin_notes ?? null,
      reviewerName: auth.user.name ?? auth.user.email,
    });
  } catch (err) {
    console.warn("[intro-requests] email dispatch failed:", err);
  }

  return NextResponse.json({ intro: serializeIntro(refreshed) });
}

async function dispatchEmails(args: {
  bundle: NonNullable<Awaited<ReturnType<typeof loadIntroBundle>>>;
  status: "accepted" | "declined" | "introduced";
  adminNote: string | null;
  reviewerName: string;
}) {
  const { bundle, status, adminNote, reviewerName } = args;
  const { row, requester, targetInvestor, targetCompany } = bundle;
  const targetName =
    targetInvestor?.displayName ??
    targetInvestor?.firmName ??
    targetCompany?.name ??
    "the recipient";

  if (status === "declined") {
    if (!requester?.email) return;
    await sendIntroDeclinedEmail({
      to: requester.email,
      name: requester.name ?? requester.email,
      targetName,
      adminNote,
      reviewerName,
    });
    return;
  }

  if (status === "introduced") {
    if (!requester?.email) return;
    await sendIntroIntroducedEmail({
      to: requester.email,
      name: requester.name ?? requester.email,
      targetName,
      adminNote,
      reviewerName,
    });
    return;
  }

  // accepted: email both parties with each other's contact info.
  // For investor targets, the target user is investorProfiles.userId.
  // For company targets, it's companies.claimed_by_user_id (may be null
  // if unclaimed — in that case we email only the requester with a note).
  const otherEmail = targetInvestor?.email ?? targetCompany?.email ?? null;
  const otherName =
    targetInvestor?.name ??
    targetCompany?.ownerName ??
    targetInvestor?.displayName ??
    targetCompany?.name ??
    null;
  const otherProfileUrl = targetInvestor?.slug
    ? `/investors/${targetInvestor.slug}`
    : targetCompany?.slug
      ? `/startups/${targetCompany.slug}`
      : null;

  if (!requester?.email) return;

  if (otherEmail && otherName) {
    // Email both parties.
    await sendIntroAcceptedEmail({
      to: requester.email,
      recipientName: requester.name ?? requester.email,
      otherName,
      otherEmail,
      otherProfileUrl,
      messageText: row.messageText,
      adminNote,
      reviewerName,
    });
    await sendIntroAcceptedEmail({
      to: otherEmail,
      recipientName: otherName,
      otherName: requester.name ?? requester.email,
      otherEmail: requester.email,
      otherProfileUrl: null,
      messageText: row.messageText,
      adminNote,
      reviewerName,
    });
  } else {
    // Target unreachable (unclaimed company). Email only the requester
    // with a note that GOEO will follow up out-of-band.
    await sendIntroAcceptedEmail({
      to: requester.email,
      recipientName: requester.name ?? requester.email,
      otherName: targetName,
      otherEmail: "(GOEO will reach out directly)",
      otherProfileUrl,
      messageText: row.messageText,
      adminNote:
        (adminNote ? adminNote + "\n\n" : "") +
        "Note: this target hasn't claimed their profile yet. GOEO will reach out to them directly and bridge the introduction.",
      reviewerName,
    });
  }
}
