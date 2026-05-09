import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { user as userTable } from "@/db/schema.auth";
import { ScribbleDivider } from "@/components/brand";
import { VerifyInvestorButton } from "./_verify";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  verified:
    "rounded-pill bg-sage-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage",
  unverified:
    "rounded-pill bg-stone px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3",
};

export default async function AdminInvestorsPage() {
  const rows = await db()
    .select({
      id: investorProfiles.id,
      slug: investorProfiles.slug,
      displayName: investorProfiles.displayName,
      firmName: investorProfiles.firmName,
      verificationStatus: investorProfiles.verificationStatus,
      verifiedAt: investorProfiles.verifiedAt,
      updatedAt: investorProfiles.updatedAt,
      ownerEmail: userTable.email,
      ownerName: userTable.name,
    })
    .from(investorProfiles)
    .leftJoin(userTable, eq(investorProfiles.userId, userTable.id))
    .orderBy(desc(investorProfiles.updatedAt));

  return (
    <div>
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Moderation
        </p>
        <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          Investor profiles
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          {rows.length} total ·{" "}
          {rows.filter((r) => r.verificationStatus === "verified").length}{" "}
          verified · listed publicly only after verification.
        </p>
      </header>
      <ScribbleDivider className="my-5" />

      {rows.length === 0 ? (
        <p className="rounded-tile border border-dashed border-topo bg-paper-2 p-6 text-center text-sm text-ink-3">
          No investor profiles yet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => {
            const name = r.displayName ?? r.firmName ?? "(unnamed investor)";
            const isPublishable =
              !!r.slug &&
              !!(r.displayName || r.firmName) &&
              r.verificationStatus !== "verified";
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-tile border-[1.5px] border-topo bg-paper p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg leading-tight">
                    {r.slug ? (
                      <Link
                        href={`/investors/${r.slug}`}
                        className="hover:text-ember"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span>
                        {name}{" "}
                        <span className="font-mono text-xs text-ink-3">
                          (no slug yet)
                        </span>
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-3">
                    {r.ownerName ?? "—"} · {r.ownerEmail ?? "—"} · last
                    updated{" "}
                    {r.updatedAt
                      ? new Date(r.updatedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <span
                  className={
                    STATUS_CHIP[r.verificationStatus] ?? STATUS_CHIP.unverified
                  }
                >
                  {r.verificationStatus}
                </span>
                {r.slug ? (
                  <VerifyInvestorButton
                    slug={r.slug}
                    currentStatus={r.verificationStatus}
                    canVerify={isPublishable}
                  />
                ) : (
                  <span className="text-xs text-ink-3">
                    no public profile yet
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
