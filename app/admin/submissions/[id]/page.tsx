import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessOwnershipSubmissions, companies } from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { presignOwnershipDocGet } from "@/lib/r2-presign";
import { isSubdomainOf } from "@/lib/url";
import { ScribbleDivider } from "@/components/brand";
import { ReviewActions } from "./_actions";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db()
    .select({
      submission: businessOwnershipSubmissions,
      company: companies,
      userEmail: userTable.email,
      userName: userTable.name,
      userCreatedAt: userTable.createdAt,
    })
    .from(businessOwnershipSubmissions)
    .leftJoin(
      companies,
      eq(businessOwnershipSubmissions.companyId, companies.id),
    )
    .leftJoin(userTable, eq(businessOwnershipSubmissions.userId, userTable.id))
    .where(eq(businessOwnershipSubmissions.id, id))
    .limit(1);
  if (!row) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-2xl">Submission not found.</h1>
        <Link
          href="/admin/submissions"
          className="mt-3 inline-block text-ember underline-offset-4 hover:underline"
        >
          ← Back to queue
        </Link>
      </div>
    );
  }
  const { submission, company, userEmail, userName } = row;

  // Compute domain match (company.website host vs submitter email domain).
  const submitterDomain = userEmail?.split("@")[1]?.toLowerCase();
  const websiteHost = (() => {
    if (!company?.website) return null;
    try {
      return new URL(company.website).host.replace(/^www\./, "").toLowerCase();
    } catch {
      return null;
    }
  })();
  // Strict suffix match — websiteHost must equal submitterDomain or be
  // a true subdomain (`.crew.com`), so "evilcrew.com" doesn't read as
  // a `crew.com` match.
  const domainMatch =
    !!submitterDomain &&
    !!websiteHost &&
    isSubdomainOf(websiteHost, submitterDomain);
  const mode = domainMatch ? "auto" : "manual";

  // 60-second signed URL for the doc preview.
  let docUrl: string | null = null;
  let docError: string | null = null;
  try {
    docUrl = await presignOwnershipDocGet(submission.r2Key, 60);
  } catch (err) {
    docError = err instanceof Error ? err.message : "Doc preview unavailable.";
  }

  const isPdf = (submission.mimeType ?? "").includes("pdf");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
              mode === "auto" ? "text-sage" : "text-danger"
            }`}
          >
            Claim review · {mode}
          </p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            {company?.name ?? "(unknown)"}
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            submitted by {userEmail ?? "—"} ·{" "}
            {submission.submittedAt
              ? new Date(submission.submittedAt).toLocaleString()
              : "—"}
          </p>
        </div>
        <ReviewActions
          id={submission.id}
          currentStatus={submission.status}
          mode={mode}
        />
      </header>

      <ScribbleDivider />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          label="Claimant"
          caption="Domain check compares the submitter's email host against the company website host. One signal among several."
        >
          <Row label="Email" value={userEmail ?? "—"} />
          <Row
            label="Domain match"
            value={
              <DomainChip
                ok={domainMatch}
                detail={
                  websiteHost
                    ? domainMatch
                      ? `Submitter email domain (@${submitterDomain}) matches the company website domain (${websiteHost}).`
                      : `Submitter email domain (@${submitterDomain ?? "?"}) does not match the company website domain (${websiteHost}).`
                    : "Company has no website on file, so no domain comparison is possible."
                }
              />
            }
          />
          <Row label="Name on file" value={userName ?? "—"} />
        </Card>
        <Card label="Company">
          <Row label="Slug" value={company?.slug ?? "—"} mono />
          <Row label="Website" value={company?.website ?? "—"} mono />
          <Row label="Sector" value={company?.sector ?? "—"} />
          <Row
            label="Existing claim"
            value={
              company?.claimedByUserId
                ? "claimed (override allowed)"
                : "none"
            }
          />
        </Card>
      </div>

      <section>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          Document preview · 60-sec signed URL
        </p>
        <div className="overflow-hidden rounded-tile border-[1.5px] border-ink bg-paper">
          {docError ? (
            <p className="p-6 text-sm text-danger">
              Preview unavailable: {docError}
            </p>
          ) : !docUrl ? (
            <p className="p-6 text-sm text-ink-3">No URL.</p>
          ) : isPdf ? (
            <iframe
              src={docUrl}
              className="h-[600px] w-full"
              title="Verification document preview"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={docUrl}
              alt="Verification document preview"
              className="max-h-[600px] w-full object-contain"
            />
          )}
        </div>
        <p className="mt-2 text-xs text-ink-3">
          {submission.mimeType ?? "—"} ·{" "}
          {submission.fileSize
            ? `${Math.round(submission.fileSize / 1024)} KB`
            : "—"}{" "}
          · signed link expires in 60s
        </p>
      </section>

      {submission.status !== "pending" ? (
        <section className="rounded-tile border border-topo bg-paper-2 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
            Review history
          </p>
          <p className="mt-1 text-sm">
            Status: <strong>{submission.status}</strong> ·{" "}
            {submission.reviewedAt
              ? new Date(submission.reviewedAt).toLocaleString()
              : "—"}
          </p>
          {submission.reviewNotes ? (
            <p className="mt-2 text-sm text-ink-2">
              Note: {submission.reviewNotes}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Card({
  label,
  children,
  caption,
}: {
  label: string;
  children: React.ReactNode;
  caption?: React.ReactNode;
}) {
  return (
    <div className="rounded-tile border-[1.5px] border-topo bg-paper p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </p>
      <dl className="mt-2 grid gap-2">{children}</dl>
      {caption ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-0.5 text-sm">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className={mono ? "font-mono text-sm break-all" : ""}>{value}</dd>
    </div>
  );
}

function DomainChip({ ok, detail }: { ok: boolean; detail: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        ok ? "bg-sage-tint text-sage" : "bg-paper border border-danger text-danger"
      }`}
      title={detail}
    >
      {ok ? "domain ✓" : "domain mismatch"}
    </span>
  );
}
