import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businessOwnershipSubmissions,
  companies,
  companyLocations,
} from "@/db/schema";
import { getAuth } from "@/auth";
import { ScribbleDivider, Tile } from "@/components/brand";

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

const STATUS_LABEL: Record<string, string> = {
  pending: "pending review",
  approved: "approved",
  rejected: "not approved",
  needs_more_info: "needs more info",
};

type SubmissionRow = {
  submission: {
    id: string;
    status: string;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
  };
  company: {
    slug: string | null;
    name: string | null;
    sector: string | null;
    website: string | null;
    employeeCount: string | null;
  };
  location: {
    county: string | null;
    city: string | null;
  };
};

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/me/submissions");
  const params = await searchParams;
  const justSubmitted = params.submitted === "1";

  const rawRows = await db()
    .select({
      submission: businessOwnershipSubmissions,
      company: companies,
      location: companyLocations,
    })
    .from(businessOwnershipSubmissions)
    .leftJoin(companies, eq(businessOwnershipSubmissions.companyId, companies.id))
    .leftJoin(
      companyLocations,
      eq(companyLocations.companyId, companies.id),
    )
    .where(eq(businessOwnershipSubmissions.userId, session.user.id))
    // Tie-break the location fan-out (`companyLocations.id ASC`) so
    // the first row per submission picks the earliest location
    // deterministically, regardless of D1 row order.
    .orderBy(
      desc(businessOwnershipSubmissions.submittedAt),
      asc(companyLocations.id),
    );

  // Collapse to one row per submission. The leftJoin on companyLocations
  // can fan out when a company has multiple location rows; keep the
  // first only (matches lib/companies-list behaviour for "primary").
  const seen = new Set<string>();
  const rows: SubmissionRow[] = [];
  for (const r of rawRows) {
    if (seen.has(r.submission.id)) continue;
    seen.add(r.submission.id);
    rows.push({
      submission: {
        id: r.submission.id,
        status: r.submission.status,
        submittedAt: r.submission.submittedAt,
        reviewedAt: r.submission.reviewedAt,
        reviewNotes: r.submission.reviewNotes,
      },
      company: {
        slug: r.company?.slug ?? null,
        name: r.company?.name ?? null,
        sector: r.company?.sector ?? null,
        website: r.company?.website ?? null,
        employeeCount: r.company?.employeeCount ?? null,
      },
      location: {
        county: r.location?.county ?? null,
        city: r.location?.city ?? null,
      },
    });
  }

  // Hero candidate: any unresolved submission (pending or
  // needs_more_info), OR a terminal one (approved / rejected) reviewed
  // in the last week so the user doesn't immediately demote into a
  // history list. Older terminal rows fall back to the list view.
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const isRecentTerminal = (reviewedAt: Date | null) => {
    const ts = reviewedAt?.getTime() ?? 0;
    return ts > 0 && now - ts < WEEK;
  };
  const heroIndex = rows.findIndex((r) => {
    if (r.submission.status === "pending") return true;
    if (r.submission.status === "needs_more_info") return true;
    if (r.submission.status === "approved")
      return isRecentTerminal(r.submission.reviewedAt);
    if (r.submission.status === "rejected")
      return isRecentTerminal(r.submission.reviewedAt);
    return false;
  });
  const hero = heroIndex >= 0 ? rows[heroIndex] : null;
  const history = hero
    ? rows.filter((_, i) => i !== heroIndex)
    : rows;

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
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
          >
            Find your company →
          </Link>
        </div>
      ) : null}

      {hero ? <HeroPanel row={hero} /> : null}

      {history.length > 0 ? (
        <div className="mt-10">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            History
          </p>
          <ul className="grid gap-2">
            {history.map((r) => (
              <li
                key={r.submission.id}
                className="rounded-tile border border-topo bg-paper-2 p-3 sm:p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base">
                      {r.company.name ?? "(unknown company)"}
                    </p>
                    <p className="font-mono text-[11px] text-ink-3">
                      {r.submission.submittedAt
                        ? new Date(r.submission.submittedAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <span className={STATUS_CHIP[r.submission.status] ?? STATUS_CHIP.pending}>
                    {STATUS_LABEL[r.submission.status] ?? r.submission.status}
                  </span>
                </div>
                {r.submission.status === "approved" && r.company.slug ? (
                  <Link
                    href={`/companies/${r.company.slug}/edit`}
                    className="mt-2 inline-flex min-h-[44px] items-center text-sm text-ember underline-offset-4 hover:underline"
                  >
                    Edit profile →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function HeroPanel({ row }: { row: SubmissionRow }) {
  const { submission, company, location } = row;
  const status = submission.status;
  const locationLabel = [
    location.city,
    location.county && `${location.county} County`,
  ]
    .filter(Boolean)
    .join(", ");

  if (status === "approved") {
    return (
      <Tile variant="default" shadow="sketch" className="border-sage">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sage">
          ✓ Verified
        </p>
        <h2 className="mt-1 font-serif text-2xl leading-tight">
          {company.name} is yours.
        </h2>
        <p className="mt-2 text-sm text-ink-2">
          GOEO approved your claim. Your edits to the public profile publish
          live to the map, the JSON feed, and the Markdown export.
        </p>
        {company.slug ? (
          <Link
            href={`/companies/${company.slug}/edit`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-[11px] uppercase tracking-wider text-paper"
          >
            Edit your profile →
          </Link>
        ) : null}
      </Tile>
    );
  }

  if (status === "rejected") {
    return (
      <Tile variant="default" shadow="sketch" className="border-danger">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger">
          Not approved
        </p>
        <h2 className="mt-1 font-serif text-2xl leading-tight">
          Your claim of {company.name} wasn&rsquo;t verified.
        </h2>
        {submission.reviewNotes ? (
          <div className="mt-3 rounded-tile border border-topo bg-paper-2 p-3 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Reviewer note
            </p>
            <p className="mt-1 whitespace-pre-line text-ink-2">
              {submission.reviewNotes}
            </p>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {company.slug ? (
            <Link
              href={`/companies/${company.slug}/claim`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-[11px] uppercase tracking-wider text-paper"
            >
              Try again →
            </Link>
          ) : null}
          <a
            href={`mailto:atlas@goed.utah.gov?subject=Claim%20dispute:%20${encodeURIComponent(company.slug ?? "")}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink bg-paper px-4 font-mono text-[11px] uppercase tracking-wider"
          >
            Contact GOEO
          </a>
        </div>
      </Tile>
    );
  }

  if (status === "needs_more_info") {
    return (
      <Tile variant="default" shadow="sketch">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          Needs more info
        </p>
        <h2 className="mt-1 font-serif text-2xl leading-tight">
          GOEO needs one more thing for your claim of {company.name}.
        </h2>
        {submission.reviewNotes ? (
          <div className="mt-3 rounded-tile border border-topo bg-paper-2 p-3 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Reviewer note
            </p>
            <p className="mt-1 whitespace-pre-line text-ink-2">
              {submission.reviewNotes}
            </p>
          </div>
        ) : null}
        {company.slug ? (
          <Link
            href={`/companies/${company.slug}/claim`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-[11px] uppercase tracking-wider text-paper"
          >
            Re-upload a document →
          </Link>
        ) : null}
      </Tile>
    );
  }

  // pending — the canonical "waiting room"
  return (
    <div className="space-y-5">
      <Tile variant="default" shadow="sketch">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">
              In review
            </p>
            <h2 className="mt-1 font-serif text-2xl leading-tight">
              Reviewing your claim of {company.name}.
            </h2>
            <p className="mt-1 font-mono text-[11px] text-ink-3">
              Submitted{" "}
              {submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString()
                : "—"}
              . GOEO usually answers within 1–2 business days.
            </p>
          </div>
          <span className={STATUS_CHIP.pending}>pending review</span>
        </div>
      </Tile>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile variant="subtle" shadow="none" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            Listing being claimed
          </p>
          <p className="mt-1 font-serif text-lg leading-snug">
            {company.name}
          </p>
          <ul className="mt-2 space-y-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {company.sector ? <li>· {company.sector}</li> : null}
            {locationLabel ? <li>· {locationLabel}</li> : null}
            {company.employeeCount ? (
              <li>· {company.employeeCount} employees</li>
            ) : null}
            {company.website ? <li>· {company.website}</li> : null}
          </ul>
          {company.slug ? (
            <Link
              href={`/startups/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-[44px] items-center text-sm text-ember underline-offset-4 hover:underline"
            >
              View public profile ↗
            </Link>
          ) : null}
        </Tile>

        <Tile variant="subtle" shadow="none" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            What unlocks when verified
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink-2">
            <li>· Edit your profile and publish updates live</li>
            <li>· Get a verified ✓ chip on the map and the public profile</li>
            <li>· Investors can save you and request intros</li>
            <li>· Show open roles and your hiring status</li>
          </ul>
        </Tile>
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          While you wait
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {company.slug ? (
            <Link
              href={`/founder?company=${encodeURIComponent(company.slug)}`}
              className="block rounded-tile border-[1.5px] border-topo bg-paper-2 p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-sketch"
            >
              <p className="font-serif text-base font-medium leading-snug">
                Get a 90-day plan for {company.name}
              </p>
              <p className="mt-1 text-xs text-ink-3">
                Atlas matches you against state-vetted resources, capital, and
                customers.
              </p>
              <span className="mt-2 inline-flex font-mono text-[11px] uppercase tracking-wider text-ember">
                Start →
              </span>
            </Link>
          ) : null}
          <Link
            href={`/map${
              company.sector
                ? `?sector=${encodeURIComponent(company.sector)}`
                : ""
            }`}
            className="block rounded-tile border-[1.5px] border-topo bg-paper-2 p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-sketch"
          >
            <p className="font-serif text-base font-medium leading-snug">
              See yourself on the map
            </p>
            <p className="mt-1 text-xs text-ink-3">
              Browse the Utah ecosystem
              {company.sector ? ` — filtered to ${company.sector}` : ""}.
            </p>
            <span className="mt-2 inline-flex font-mono text-[11px] uppercase tracking-wider text-ember">
              Open the map →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
