import "server-only";
import { cache } from "react";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businessOwnershipSubmissions,
  introRequests,
  investorProfiles,
} from "@/db/schema";

// react.cache dedupes per-request — admin/layout and admin/page can
// both call this and share a single D1 query.
export const getPendingSubmissionsCount = cache(async (): Promise<number> => {
  const [{ n }] = await db()
    .select({ n: count() })
    .from(businessOwnershipSubmissions)
    .where(eq(businessOwnershipSubmissions.status, "pending"));
  return n;
});

export const getPendingIntrosCount = cache(async (): Promise<number> => {
  const [{ n }] = await db()
    .select({ n: count() })
    .from(introRequests)
    .where(eq(introRequests.status, "pending"));
  return n;
});

// Investor profiles eligible for verification review: unverified and
// publishable (slug set). Mirrors the "pending review" shape used by
// claims and intros so the sidebar pill stays consistent.
export const getPendingInvestorVerificationsCount = cache(
  async (): Promise<number> => {
    const [{ n }] = await db()
      .select({ n: count() })
      .from(investorProfiles)
      .where(
        and(
          eq(investorProfiles.verificationStatus, "unverified"),
          isNotNull(investorProfiles.slug),
        ),
      );
    return n;
  },
);
