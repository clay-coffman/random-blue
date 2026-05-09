import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { getApiSession, isAdminRole } from "@/lib/auth-utils";
import { InvestorPublicEditor } from "./_components/InvestorPublicEditor";

export const dynamic = "force-dynamic";

export default async function InvestorEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const headerStore = await headers();
  const fakeReq = new Request(`https://startup.utah.gov/investors/${slug}/edit`, {
    headers: headerStore,
  });
  const session = await getApiSession(fakeReq);
  if (!session) redirect(`/sign-in?next=/investors/${slug}/edit`);

  const [profile] = await db()
    .select()
    .from(investorProfiles)
    .where(eq(investorProfiles.slug, slug))
    .limit(1);
  if (!profile) notFound();

  const isOwner = profile.userId === session.user.id;
  const isAdmin = isAdminRole(session.user.role);
  if (!isOwner && !isAdmin) {
    redirect(`/investors/${slug}`);
  }

  const isVerified = profile.verificationStatus === "verified";
  const canEditSlug = !isVerified || isAdmin;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-7 sm:pt-8">
      <header className="border-b-[1.5px] border-ink/30 pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Public profile editor
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl">
          Edit your public profile
        </h1>
        <p className="mt-3 max-w-prose font-serif text-base text-ink-2">
          This is what founders, owners, and AI agents will see on{" "}
          <code className="rounded bg-paper-2 px-1 font-mono text-sm">
            /investors/{profile.slug}
          </code>
          . Email is never published.
        </p>
        {isVerified ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-pill border-[1.5px] border-sage bg-sage-tint px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-sage">
            ✓ Verified · changes to identity fields require re-review
          </p>
        ) : (
          <p className="mt-3 inline-flex items-center gap-2 rounded-pill border-[1.5px] border-ink/30 bg-paper-2 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            Unverified · GOEO will review and verify before listing in the
            directory
          </p>
        )}
      </header>

      <InvestorPublicEditor
        slug={profile.slug!}
        canEditSlug={canEditSlug}
        defaults={{
          slug: profile.slug ?? "",
          display_name: profile.displayName ?? profile.firmName ?? "",
          tagline: profile.tagline ?? "",
          bio: profile.bio ?? "",
          website: profile.website ?? "",
          linkedin: profile.linkedin ?? "",
        }}
      />
    </div>
  );
}
