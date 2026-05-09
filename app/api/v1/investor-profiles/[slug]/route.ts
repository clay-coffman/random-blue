import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import {
  authorizeWrite,
  getApiSession,
  isAdminRole,
} from "@/lib/auth-utils";
import { canSeeInvestor, investorCard } from "@/lib/investor-card";
import { InvestorPublicPatchSchema } from "@/schemas/investor-public";

export const dynamic = "force-dynamic";

// GET — returns the public card. Verified profiles are anonymous-
// readable; unverified profiles 404 unless the caller is the owner or
// an admin (so owners can preview before submitting for verification).
// Email is never included.
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const result = await investorCard(slug);
  if (!result) {
    return errorResponse("not_found", "Investor not found.", 404);
  }
  const session = await getApiSession(req);
  if (
    !canSeeInvestor(
      result.row,
      session?.user.id ?? null,
      session?.user.role ?? null,
    )
  ) {
    return errorResponse("not_found", "Investor not found.", 404);
  }
  return NextResponse.json(result.card);
}

// Owner-edit whitelist for the public-profile editor. Slug is allowed
// only when the profile is unverified (or caller is admin/machine).
const OWNER_WHITELIST = new Set<keyof typeof InvestorPublicPatchSchema.shape>([
  "slug",
  "display_name",
  "bio",
  "tagline",
  "website",
  "linkedin",
]);

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const auth = await authorizeWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse(
      "unauthorized",
      "Sign in with the owner account, an admin role, or use X-Atlas-Admin-Token.",
      401,
    );
  }
  const machine = auth.kind === "machine";
  const sessionUser = auth.kind === "session" ? auth.user : null;
  const isAdmin = !!sessionUser && isAdminRole(sessionUser.role);

  const [profile] = await db()
    .select()
    .from(investorProfiles)
    .where(eq(investorProfiles.slug, slug))
    .limit(1);
  if (!profile) {
    return errorResponse("not_found", "Investor not found.", 404);
  }

  const isOwner = !!sessionUser && profile.userId === sessionUser.id;
  if (!machine && !isAdmin && !isOwner) {
    return errorResponse(
      "forbidden",
      "You don't have permission to edit this investor profile.",
      403,
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = InvestorPublicPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid investor patch.",
      400,
      parsed.error.flatten(),
    );
  }
  const body = parsed.data;

  // Slug is locked after verification for owner edits. Admin/machine
  // can override.
  if (
    body.slug !== undefined &&
    body.slug !== profile.slug &&
    profile.verificationStatus === "verified" &&
    !machine &&
    !isAdmin
  ) {
    return errorResponse(
      "forbidden",
      "Slug is locked after verification.",
      403,
    );
  }

  // Owner edit: enforce whitelist; admin/machine: free.
  const allowedKeys = new Set<string>(OWNER_WHITELIST);
  if (machine || isAdmin) allowedKeys.add("verification_status");

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!allowedKeys.has(k)) continue;
    patch[k] = v;
  }

  if (Object.keys(patch).length === 0) {
    return errorResponse("bad_request", "No editable fields supplied.", 400);
  }

  // Slug-uniqueness check — return 409 instead of letting D1 surface
  // a generic constraint error.
  if (
    typeof patch.slug === "string" &&
    patch.slug !== profile.slug
  ) {
    const [taken] = await db()
      .select({ id: investorProfiles.id })
      .from(investorProfiles)
      .where(eq(investorProfiles.slug, patch.slug))
      .limit(1);
    if (taken) {
      return errorResponse("conflict", "Slug already taken.", 409);
    }
  }

  // Translate wire keys → DB column names.
  const dbPatch: Record<string, unknown> = {};
  if ("slug" in patch) dbPatch.slug = patch.slug;
  if ("display_name" in patch) dbPatch.displayName = patch.display_name;
  if ("bio" in patch) dbPatch.bio = patch.bio;
  if ("tagline" in patch) dbPatch.tagline = patch.tagline;
  if ("website" in patch) dbPatch.website = patch.website;
  if ("linkedin" in patch) dbPatch.linkedin = patch.linkedin;

  if ("verification_status" in patch) {
    dbPatch.verificationStatus = patch.verification_status;
    dbPatch.verifiedAt =
      patch.verification_status === "verified" ? new Date() : null;
  }

  // Auto-unverify on owner-edit of identity fields. Admins keep the
  // verified badge across edits intentionally.
  const isOwnerEdit = !machine && !isAdmin && isOwner;
  const willChangeIdentity =
    ("display_name" in patch && patch.display_name !== profile.displayName) ||
    ("website" in patch && patch.website !== profile.website);
  if (
    isOwnerEdit &&
    willChangeIdentity &&
    profile.verificationStatus === "verified"
  ) {
    dbPatch.verificationStatus = "unverified";
    dbPatch.verifiedAt = null;
  }

  dbPatch.lastUpdatedBy = sessionUser?.id ?? null;

  await db()
    .update(investorProfiles)
    .set(dbPatch)
    .where(eq(investorProfiles.id, profile.id));

  // Return the refreshed public card (looking up by the new slug if it
  // was changed).
  const finalSlug =
    typeof dbPatch.slug === "string" ? dbPatch.slug : profile.slug!;
  const refreshed = await investorCard(finalSlug);
  if (!refreshed) {
    return errorResponse("internal", "Profile vanished after update.", 500);
  }
  return NextResponse.json({ profile: refreshed.card });
}
