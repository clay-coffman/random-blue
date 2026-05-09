import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions, companies } from "@/db/schema";
import { getAuth } from "@/auth";
import { ScribbleDivider } from "@/components/brand";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  pending:
    "rounded-pill bg-ember-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ember",
  approved:
    "rounded-pill bg-sage-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sage",
  rejected:
    "rounded-pill bg-paper-2 border border-danger px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-danger",
  needs_more_info:
    "rounded-pill bg-stone px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3",
};

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/me/submissions");
  const params = await searchParams;
  const justSubmitted = params.submitted === "1";

  const rows = await db()
    .select({
      submission: businessOwnershipSubmissions,
      company: companies,
    })
    .from(businessOwnershipSubmissions)
    .leftJoin(companies, eq(businessOwnershipSubmissions.companyId, companies.id))
    .where(eq(businessOwnershipSubmissions.userId, session.user.id))
    .orderBy(desc(businessOwnershipSubmissions.submittedAt));

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-7">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        My submissions
      </p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Verification submissions
      </h1>
      <ScribbleDivider className="my-6" />
      {justSubmitted ? (
        <p className="mb-4 rounded-tile border border-sage bg-sage-tint px-3 py-2 text-sm text-sage">
          ✓ Submitted. A GOEO admin will review within 1–2 business days.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <div className="rounded-tile border border-dashed border-topo bg-paper-2 p-6 text-center">
          <p className="text-sm text-ink-2">No submissions yet.</p>
          <Link
            href="/onboarding/owner"
            className="mt-3 inline-block text-ember underline-offset-4 hover:underline"
          >
            Find your company →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map(({ submission, company }) => (
            <li
              key={submission.id}
              className="flex flex-wrap items-center gap-3 rounded-tile border-[1.5px] border-topo bg-paper-2 p-4"
            >
              <span className="flex-1">
                <span className="block font-serif text-lg leading-tight">
                  {company?.name ?? "(deleted company)"}
                </span>
                <span className="block text-xs text-ink-3">
                  Submitted{" "}
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleDateString()
                    : "—"}{" "}
                  · {submission.mimeType ?? "doc"} ·{" "}
                  {submission.fileSize
                    ? `${Math.round(submission.fileSize / 1024)} KB`
                    : "—"}
                </span>
                {submission.reviewNotes ? (
                  <span className="mt-2 block text-sm text-ink-2">
                    Review note: {submission.reviewNotes}
                  </span>
                ) : null}
              </span>
              <span
                className={
                  STATUS_CHIP[submission.status] ?? STATUS_CHIP.pending
                }
              >
                {submission.status}
              </span>
              {submission.status === "approved" && company ? (
                <Link
                  href={`/companies/${company.slug}/edit`}
                  className="rounded-pill border border-ember px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ember hover:bg-ember-tint"
                >
                  Edit profile →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
