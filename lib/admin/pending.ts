import "server-only";
import { cache } from "react";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions } from "@/db/schema";

// react.cache dedupes per-request — admin/layout and admin/page can
// both call this and share a single D1 query.
export const getPendingSubmissionsCount = cache(async (): Promise<number> => {
  const [{ n }] = await db()
    .select({ n: count() })
    .from(businessOwnershipSubmissions)
    .where(eq(businessOwnershipSubmissions.status, "pending"));
  return n;
});
