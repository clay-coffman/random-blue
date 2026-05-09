import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, businessOwnershipSubmissions } from "@/db/schema";
import { getAuth } from "@/auth";
import { ScribbleDivider } from "@/components/brand";
import { ClaimUploadForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/sign-in?next=/companies/${slug}/claim`);
  }

  const [company] = await db()
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-7">
        <h1 className="font-serif text-2xl">Company not found.</h1>
        <Link
          href="/onboarding/owner"
          className="mt-4 inline-block text-ember underline-offset-4 hover:underline"
        >
          Search again →
        </Link>
      </div>
    );
  }

  // Check existing claim or pending submission for this user.
  const [pending] = await db()
    .select()
    .from(businessOwnershipSubmissions)
    .where(
      and(
        eq(businessOwnershipSubmissions.userId, session.user.id),
        eq(businessOwnershipSubmissions.companyId, company.id),
        eq(businessOwnershipSubmissions.status, "pending"),
      ),
    )
    .limit(1);

  const alreadyClaimedByOther =
    company.claimedByUserId && company.claimedByUserId !== session.user.id;
  const alreadyClaimedByMe =
    company.claimedByUserId === session.user.id;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-7">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        Claim · {company.name}
      </p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Verify ownership of {company.name}.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Upload a Secretary-of-State filing, business license, EIN letter, or
        similar. A GOEO admin will review within 1–2 business days.
      </p>
      <ScribbleDivider className="my-6" />

      {alreadyClaimedByMe ? (
        <div className="rounded-tile border-[1.5px] border-sage bg-sage-tint p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage">
            ✓ already verified
          </p>
          <p className="mt-2 text-base">
            You own this company. Edit the profile.
          </p>
          <Link
            href={`/companies/${slug}/edit`}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
          >
            Edit profile →
          </Link>
        </div>
      ) : alreadyClaimedByOther ? (
        <div className="rounded-tile border-[1.5px] border-danger bg-paper-2 p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-danger">
            already claimed
          </p>
          <p className="mt-2 text-base text-ink-2">
            This profile is already claimed by another account. If you believe
            this is an error, email{" "}
            <a
              href={`mailto:atlas@goed.utah.gov?subject=Claim%20dispute:%20${company.slug}`}
              className="text-ember underline-offset-4 hover:underline"
            >
              atlas@goed.utah.gov
            </a>
            .
          </p>
        </div>
      ) : pending ? (
        <div className="rounded-tile border-[1.5px] border-ember bg-ember-tint p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ember">
            pending review
          </p>
          <p className="mt-2 text-base">
            Your verification document was submitted on{" "}
            {pending.submittedAt
              ? new Date(pending.submittedAt).toLocaleDateString()
              : "(unknown)"}
            . You&rsquo;ll get an email when it&rsquo;s reviewed.
          </p>
          <Link
            href="/me/submissions"
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-5 py-3"
          >
            See all my submissions →
          </Link>
        </div>
      ) : (
        <ClaimUploadForm slug={slug} />
      )}
    </section>
  );
}
