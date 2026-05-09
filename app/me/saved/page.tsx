import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Tile, Chip } from "@/components/brand";
import { db } from "@/lib/db";
import {
  companies,
  companyLocations,
  investorProfiles,
  savedCompanies,
} from "@/db/schema";
import { getApiSession } from "@/lib/auth-utils";
import { sectorDisplayName } from "@/lib/sectors";
import { SavedRowActions } from "./_components/SavedRowActions";

export const dynamic = "force-dynamic";

export default async function MySavedPage() {
  const headerStore = await headers();
  const fakeReq = new Request("https://startup.utah.gov/me/saved", {
    headers: headerStore,
  });
  const session = await getApiSession(fakeReq);
  if (!session) redirect("/sign-in?next=/me/saved");

  const [investor] = await db()
    .select({ id: investorProfiles.id })
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, session.user.id))
    .limit(1);

  type Row = {
    id: string;
    note: string | null;
    savedAt: Date | null;
    companyId: string;
    companySlug: string;
    companyName: string;
    companySector: string | null;
    companyStage: string | null;
    companyLogoUrl: string | null;
    city: string | null;
    county: string | null;
  };

  const rows: Row[] = investor
    ? ((await db()
        .select({
          id: savedCompanies.id,
          note: savedCompanies.note,
          savedAt: savedCompanies.savedAt,
          companyId: companies.id,
          companySlug: companies.slug,
          companyName: companies.name,
          companySector: companies.sector,
          companyStage: companies.stage,
          companyLogoUrl: companies.logoUrl,
          city: companyLocations.city,
          county: companyLocations.county,
        })
        .from(savedCompanies)
        .innerJoin(companies, eq(savedCompanies.companyId, companies.id))
        .leftJoin(
          companyLocations,
          eq(companyLocations.companyId, companies.id),
        )
        .where(eq(savedCompanies.investorId, investor.id))
        .orderBy(desc(savedCompanies.savedAt))) as Row[])
    : [];

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-20 pt-6 sm:px-7 sm:pt-8">
      <header className="border-b-[1.5px] border-ink/30 pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Watchlist
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl">
          Saved companies
        </h1>
        <p className="mt-3 max-w-prose font-serif text-base text-ink-2">
          Companies you&apos;ve saved from the map, the directory, or
          individual profiles. Add a private note to remember why.
        </p>
      </header>

      {!investor ? (
        <Tile variant="subtle" shadow="none" className="mt-8 p-8 text-center">
          <p className="font-serif text-xl text-ink-2">
            Set up your investor profile first.
          </p>
          <p className="mt-2 text-sm text-ink-3">
            Saving requires an investor profile. Go through onboarding to
            create one.
          </p>
          <Link
            href="/onboarding/investor"
            className="mt-4 inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
          >
            Start onboarding →
          </Link>
        </Tile>
      ) : rows.length === 0 ? (
        <Tile variant="subtle" shadow="none" className="mt-8 p-8 text-center">
          <p className="font-serif text-xl text-ink-2">
            No saved companies yet.
          </p>
          <p className="mt-2 text-sm text-ink-3">
            Visit{" "}
            <Link
              href="/map"
              className="underline decoration-ember/40 hover:decoration-ember"
            >
              the map
            </Link>{" "}
            or{" "}
            <Link
              href="/startups"
              className="underline decoration-ember/40 hover:decoration-ember"
            >
              the directory
            </Link>{" "}
            and tap Save on any profile.
          </p>
        </Tile>
      ) : (
        <>
          {/* Mobile / tablet: stacked cards */}
          <ul className="mt-6 space-y-3 lg:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <SavedCard row={r} />
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="mt-6 hidden overflow-x-auto rounded-tile border-[1.5px] border-topo lg:block">
            <table className="w-full text-sm">
              <thead className="bg-paper-2 text-left font-mono text-[11px] uppercase tracking-wider text-ink-3">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Saved</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-topo/60 align-top"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/startups/${r.companySlug}`}
                        className="font-serif text-base font-medium hover:underline"
                      >
                        {r.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {r.companySector
                        ? sectorDisplayName(r.companySector)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {r.companyStage ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {[r.city, r.county && `${r.county} County`]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-3">
                      {r.savedAt
                        ? new Date(r.savedAt).toISOString().split("T")[0]
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SavedRowActions
                        companyId={r.companyId}
                        initialNote={r.note ?? ""}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Unsave lives inside SavedRowActions on mobile;
                          render a separate inline button on desktop for
                          clarity. SavedRowActions exposes both. */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SavedCard({
  row,
}: {
  row: {
    companyId: string;
    companySlug: string;
    companyName: string;
    companySector: string | null;
    companyStage: string | null;
    city: string | null;
    county: string | null;
    note: string | null;
    savedAt: Date | null;
  };
}) {
  const loc = [row.city, row.county && `${row.county} County`]
    .filter(Boolean)
    .join(", ");
  return (
    <Tile variant="default" shadow="sketch" className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/startups/${row.companySlug}`}
            className="font-serif text-xl font-medium hover:underline"
          >
            {row.companyName}
          </Link>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {row.companySector ? (
              <Chip tone="stone">{sectorDisplayName(row.companySector)}</Chip>
            ) : null}
            {row.companyStage ? <Chip tone="sky-tint">{row.companyStage}</Chip> : null}
          </div>
          {loc ? (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
              {loc}
            </p>
          ) : null}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          {row.savedAt
            ? new Date(row.savedAt).toISOString().split("T")[0]
            : ""}
        </p>
      </div>
      <div className="mt-3">
        <SavedRowActions
          companyId={row.companyId}
          initialNote={row.note ?? ""}
        />
      </div>
    </Tile>
  );
}
