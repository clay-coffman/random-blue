import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companies,
  introRequests,
  investorProfiles,
} from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { ScribbleDivider } from "@/components/brand";
import { ReviewActions } from "./_actions";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  pending:
    "rounded-pill bg-ember-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ember",
  accepted:
    "rounded-pill bg-sage-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sage",
  declined:
    "rounded-pill border border-danger bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-danger",
  introduced:
    "rounded-pill bg-stone px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3",
};

export default async function AdminIntroReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db()
    .select()
    .from(introRequests)
    .where(eq(introRequests.id, id))
    .limit(1);
  if (!row) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-2xl">Intro request not found.</h1>
        <Link
          href="/admin/intros"
          className="mt-3 inline-block text-ember underline-offset-4 hover:underline"
        >
          ← Back to queue
        </Link>
      </div>
    );
  }

  const [requester] = await db()
    .select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name,
      role: userTable.role,
    })
    .from(userTable)
    .where(eq(userTable.id, row.requesterUserId))
    .limit(1);

  let targetName = "(unknown)";
  let targetUrl: string | null = null;
  let targetEmail: string | null = null;
  const targetExtra: { label: string; value: string }[] = [];

  if (row.targetInvestorId) {
    const [inv] = await db()
      .select({
        id: investorProfiles.id,
        slug: investorProfiles.slug,
        displayName: investorProfiles.displayName,
        firmName: investorProfiles.firmName,
        verificationStatus: investorProfiles.verificationStatus,
        userId: investorProfiles.userId,
      })
      .from(investorProfiles)
      .where(eq(investorProfiles.id, row.targetInvestorId))
      .limit(1);
    if (inv) {
      targetName = inv.displayName ?? inv.firmName ?? "Investor";
      if (inv.slug) targetUrl = `/investors/${inv.slug}`;
      targetExtra.push({ label: "Type", value: "Investor" });
      targetExtra.push({
        label: "Verification",
        value: inv.verificationStatus,
      });
      const [tu] = await db()
        .select({ email: userTable.email, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, inv.userId))
        .limit(1);
      if (tu) {
        targetEmail = tu.email;
        if (tu.name) targetExtra.push({ label: "Owner name", value: tu.name });
      }
    }
  } else if (row.targetCompanyId) {
    const [co] = await db()
      .select({
        id: companies.id,
        slug: companies.slug,
        name: companies.name,
        sector: companies.sector,
        claimedByUserId: companies.claimedByUserId,
      })
      .from(companies)
      .where(eq(companies.id, row.targetCompanyId))
      .limit(1);
    if (co) {
      targetName = co.name;
      targetUrl = `/startups/${co.slug}`;
      targetExtra.push({ label: "Type", value: "Company" });
      if (co.sector) targetExtra.push({ label: "Sector", value: co.sector });
      if (co.claimedByUserId) {
        const [tu] = await db()
          .select({ email: userTable.email, name: userTable.name })
          .from(userTable)
          .where(eq(userTable.id, co.claimedByUserId))
          .limit(1);
        if (tu) {
          targetEmail = tu.email;
          if (tu.name) targetExtra.push({ label: "Owner", value: tu.name });
        }
      } else {
        targetExtra.push({ label: "Claimed", value: "unclaimed" });
      }
    }
  }

  let reviewerName: string | null = null;
  if (row.reviewedByUserId) {
    const [reviewer] = await db()
      .select({ name: userTable.name, email: userTable.email })
      .from(userTable)
      .where(eq(userTable.id, row.reviewedByUserId))
      .limit(1);
    reviewerName = reviewer?.name ?? reviewer?.email ?? null;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Intro review
          </p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            {requester?.name ?? requester?.email ?? "(unknown)"} → {targetName}
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            submitted{" "}
            {row.submittedAt
              ? new Date(row.submittedAt).toLocaleString()
              : "—"}{" "}
            ·{" "}
            <span className={STATUS_CHIP[row.status] ?? STATUS_CHIP.pending}>
              {row.status}
            </span>
          </p>
        </div>
        <Link
          href="/admin/intros"
          className="font-mono text-[11px] uppercase tracking-wider text-ink-3 underline-offset-2 hover:underline"
        >
          ← Back to queue
        </Link>
      </header>

      <ScribbleDivider />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card label="Requester">
          <Row label="Name" value={requester?.name ?? "—"} />
          <Row label="Email" value={requester?.email ?? "—"} mono />
          <Row label="Role at request" value={row.requesterRole} />
          <Row
            label="Current role"
            value={requester?.role ?? "—"}
          />
        </Card>
        <Card label="Target">
          <Row label="Name" value={targetName} />
          {targetUrl ? (
            <Row
              label="Profile"
              value={
                <Link
                  href={targetUrl}
                  className="text-ember underline-offset-2 hover:underline"
                >
                  {targetUrl}
                </Link>
              }
            />
          ) : null}
          <Row label="Contact email" value={targetEmail ?? "(unclaimed)"} mono />
          {targetExtra.map((e) => (
            <Row key={e.label} label={e.label} value={e.value} />
          ))}
        </Card>
      </div>

      <section>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          Message
        </p>
        <blockquote className="whitespace-pre-wrap rounded-tile border-[1.5px] border-ink/30 bg-paper-2 p-4 font-serif text-base leading-relaxed">
          {row.messageText}
        </blockquote>
      </section>

      <ReviewActions id={row.id} currentStatus={row.status} />

      {row.status !== "pending" ? (
        <section className="rounded-tile border border-topo bg-paper-2 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
            Review history
          </p>
          <p className="mt-1 text-sm">
            Status: <strong>{row.status}</strong> ·{" "}
            {row.reviewedAt ? new Date(row.reviewedAt).toLocaleString() : "—"}
            {reviewerName ? ` · by ${reviewerName}` : ""}
          </p>
          {row.adminNotes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-2">
              <strong>Note:</strong> {row.adminNotes}
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-tile border-[1.5px] border-topo bg-paper p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </p>
      <dl className="mt-2 grid gap-2">{children}</dl>
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
