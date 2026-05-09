import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { ensureInvestorSlug } from "@/lib/investor-card";
import { getApiSession } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// Bootstrap entry: ensures the calling investor has a slug, then
// redirects to /investors/<slug>/edit. Linked from /settings.
export default async function MyInvestorPage() {
  const headerStore = await headers();
  const fakeReq = new Request("https://startup.utah.gov/me/investor", {
    headers: headerStore,
  });
  const session = await getApiSession(fakeReq);
  if (!session) redirect("/sign-in?next=/me/investor");

  const [profile] = await db()
    .select()
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, session.user.id))
    .limit(1);
  if (!profile) redirect("/onboarding/investor");

  const slug = profile.slug ?? (await ensureInvestorSlug(profile));
  redirect(`/investors/${slug}/edit`);
}
