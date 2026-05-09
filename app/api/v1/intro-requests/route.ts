import { NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companies,
  introRequests,
  investorProfiles,
} from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { authorizeSessionWrite, getApiSession } from "@/lib/auth-utils";
import { sendIntroPendingEmail } from "@/lib/email";
import { IntroRequestCreateSchema } from "@/schemas/intro-request";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const sessionUser = auth.user;

  const raw = await req.json().catch(() => null);
  const parsed = IntroRequestCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid intro request.",
      400,
      parsed.error.flatten(),
    );
  }
  const body = parsed.data;

  // Resolve target. Don't allow intros to unpublished investors —
  // their slug is the published-state signal.
  let targetInvestorId: string | null = null;
  let targetCompanyId: string | null = null;
  let targetName = "";
  if (body.target.type === "investor") {
    const [inv] = await db()
      .select({
        id: investorProfiles.id,
        slug: investorProfiles.slug,
        displayName: investorProfiles.displayName,
        firmName: investorProfiles.firmName,
        userId: investorProfiles.userId,
        verificationStatus: investorProfiles.verificationStatus,
      })
      .from(investorProfiles)
      .where(eq(investorProfiles.id, body.target.id))
      .limit(1);
    // Gate intros on verified investors only — unverified profiles are
    // owner-previewable, not a public intro target.
    if (
      !inv ||
      !inv.slug ||
      inv.verificationStatus !== "verified"
    ) {
      return errorResponse("not_found", "Investor not found.", 404);
    }
    if (inv.userId === sessionUser.id) {
      return errorResponse(
        "bad_request",
        "Can't request an intro to yourself.",
        400,
      );
    }
    targetInvestorId = inv.id;
    targetName = inv.displayName ?? inv.firmName ?? "Investor";
  } else {
    const [co] = await db()
      .select({
        id: companies.id,
        name: companies.name,
        claimedByUserId: companies.claimedByUserId,
      })
      .from(companies)
      .where(eq(companies.id, body.target.id))
      .limit(1);
    if (!co) {
      return errorResponse("not_found", "Company not found.", 404);
    }
    if (co.claimedByUserId && co.claimedByUserId === sessionUser.id) {
      return errorResponse(
        "bad_request",
        "Can't request an intro to your own company.",
        400,
      );
    }
    targetCompanyId = co.id;
    targetName = co.name;
  }

  // Per-(requester, target) duplicate guard. Don't allow stacking
  // pending requests at the same target — admin would see noise and
  // recipients would get a low-effort harassment channel after accept.
  // We collapse to one pending per (requester, target) pair; once
  // admin moves the prior request to a terminal state, a new request
  // is allowed.
  const dupConditions = [
    eq(introRequests.requesterUserId, sessionUser.id),
    eq(introRequests.status, "pending"),
    targetInvestorId
      ? eq(introRequests.targetInvestorId, targetInvestorId)
      : isNull(introRequests.targetInvestorId),
    targetCompanyId
      ? eq(introRequests.targetCompanyId, targetCompanyId)
      : isNull(introRequests.targetCompanyId),
  ];
  const [existing] = await db()
    .select({ id: introRequests.id })
    .from(introRequests)
    .where(and(...dupConditions))
    .limit(1);
  if (existing) {
    return errorResponse(
      "conflict",
      "You already have a pending intro request to this target.",
      409,
    );
  }

  const [{ id }] = await db()
    .insert(introRequests)
    .values({
      requesterUserId: sessionUser.id,
      requesterRole: sessionUser.role,
      targetInvestorId,
      targetCompanyId,
      messageText: body.message_text,
      status: "pending",
      submittedAt: new Date(),
    })
    .returning({ id: introRequests.id });

  // Confirmation email — fire-and-forget, don't fail the request if
  // mail dispatch errors.
  try {
    await sendIntroPendingEmail({
      to: sessionUser.email,
      name: sessionUser.name ?? sessionUser.email,
      targetName,
    });
  } catch (err) {
    console.warn("[intro-requests] confirmation email failed:", err);
  }

  return NextResponse.json({ id, status: "pending" }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getApiSession(req);
  if (!session) {
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const userId = session.user.id;

  // Outbound: any status, requester is me.
  const outboundRows = await db()
    .select({
      intro: introRequests,
      targetInvestorSlug: investorProfiles.slug,
      targetInvestorName: investorProfiles.displayName,
      targetInvestorFirm: investorProfiles.firmName,
      targetCompanySlug: companies.slug,
      targetCompanyName: companies.name,
    })
    .from(introRequests)
    .leftJoin(
      investorProfiles,
      eq(introRequests.targetInvestorId, investorProfiles.id),
    )
    .leftJoin(companies, eq(introRequests.targetCompanyId, companies.id))
    .where(eq(introRequests.requesterUserId, userId))
    .orderBy(desc(introRequests.submittedAt));

  // Inbound: I'm the target. Visible only after admin moves to
  // accepted/introduced — don't expose pending intros to recipients.
  // Look up the caller's investor profile + claimed companies.
  const [investor] = await db()
    .select({ id: investorProfiles.id })
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, userId))
    .limit(1);

  const claimedCompanies = await db()
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.claimedByUserId, userId));

  const targetInvestorIds = investor ? [investor.id] : [];
  const targetCompanyIds = claimedCompanies.map((c) => c.id);

  const inboundConditions = [];
  if (targetInvestorIds.length) {
    inboundConditions.push(
      inArray(introRequests.targetInvestorId, targetInvestorIds),
    );
  }
  if (targetCompanyIds.length) {
    inboundConditions.push(
      inArray(introRequests.targetCompanyId, targetCompanyIds),
    );
  }

  const inboundRows =
    inboundConditions.length === 0
      ? []
      : await db()
          .select({
            intro: introRequests,
            requesterEmail: userTable.email,
            requesterName: userTable.name,
          })
          .from(introRequests)
          .leftJoin(userTable, eq(introRequests.requesterUserId, userTable.id))
          .where(
            and(
              or(...inboundConditions),
              inArray(introRequests.status, ["accepted", "introduced"]),
            ),
          )
          .orderBy(desc(introRequests.submittedAt));

  return NextResponse.json({
    outbound: outboundRows.map((r) => ({
      id: r.intro.id,
      status: r.intro.status,
      submitted_at: toIso(r.intro.submittedAt),
      reviewed_at: toIso(r.intro.reviewedAt),
      admin_notes: r.intro.adminNotes,
      message_text: r.intro.messageText,
      target_type: r.intro.targetInvestorId ? "investor" : "company",
      target_id: r.intro.targetInvestorId ?? r.intro.targetCompanyId,
      target_name:
        r.targetInvestorName ??
        r.targetInvestorFirm ??
        r.targetCompanyName ??
        "(unknown)",
      target_url: r.targetInvestorSlug
        ? `/investors/${r.targetInvestorSlug}`
        : r.targetCompanySlug
          ? `/startups/${r.targetCompanySlug}`
          : null,
    })),
    inbound: inboundRows.map((r) => ({
      id: r.intro.id,
      status: r.intro.status,
      submitted_at: toIso(r.intro.submittedAt),
      reviewed_at: toIso(r.intro.reviewedAt),
      admin_notes: r.intro.adminNotes,
      message_text: r.intro.messageText,
      requester_role: r.intro.requesterRole,
      requester_name: r.requesterName ?? "(unknown)",
      requester_email: r.requesterEmail,
    })),
  });
}

function toIso(d: Date | null): string | null {
  return d ? d.toISOString?.() ?? null : null;
}
