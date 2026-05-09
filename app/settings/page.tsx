import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companies,
  founderPassports,
  investorProfiles,
} from "@/db/schema";
import { getAuth } from "@/auth";
import { ScribbleDivider } from "@/components/brand";
import { ProfileSection } from "./_sections/ProfileSection";
import { SecuritySection } from "./_sections/SecuritySection";
import { InvestorSection } from "./_sections/InvestorSection";
import { DangerZone } from "./_sections/DangerZone";
import { NotificationsSection } from "./_sections/NotificationsSection";
import {
  InvestorTypeEnum,
  StageEnum,
  SectorEnum,
  GeoFocusEnum,
} from "@/lib/investor-schema";

export const dynamic = "force-dynamic";

function buildSectionNav(
  role: string,
  ownedCount: number,
): Array<{ id: string; label: string; count?: number }> {
  const roleLabel =
    role === "founder"
      ? "Founder passport"
      : role === "owner"
        ? "Claimed companies"
        : role === "investor"
          ? "Investor preferences"
          : "Role";
  return [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    {
      id: "role",
      label: roleLabel,
      count: role === "owner" ? ownedCount : undefined,
    },
    { id: "notifications", label: "Notifications" },
    { id: "tokens", label: "Agent tokens" },
    { id: "danger", label: "Danger zone" },
  ];
}

export default async function SettingsPage() {
  const session = await (await getAuth()).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/settings");
  const user = session.user as {
    id: string;
    email: string;
    name: string;
    role?: string;
    createdAt?: Date | string;
  };
  const role = user.role ?? "founder";

  function fmtDate(v: Date | string | undefined): string {
    if (!v) return "—";
    const d = v instanceof Date ? v : new Date(v);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  }

  // Role-specific data fetch.
  const [passport] =
    role === "founder"
      ? await db()
          .select({ id: founderPassports.id, county: founderPassports.county, stage: founderPassports.stage })
          .from(founderPassports)
          .where(eq(founderPassports.userId, user.id))
          .limit(1)
      : [];

  const claimedCompanies =
    role === "owner"
      ? await db()
          .select({
            slug: companies.slug,
            name: companies.name,
            verifiedAt: companies.verifiedAt,
          })
          .from(companies)
          .where(eq(companies.claimedByUserId, user.id))
      : [];

  const [investor] =
    role === "investor"
      ? await db()
          .select()
          .from(investorProfiles)
          .where(eq(investorProfiles.userId, user.id))
          .limit(1)
      : [];

  const sectionNav = buildSectionNav(role, claimedCompanies.length);

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-7 md:grid-cols-[200px_1fr]">
      {/* Sidebar nav */}
      <aside className="md:sticky md:top-20 md:self-start">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Settings
        </p>
        <nav aria-label="Settings sections" className="grid gap-1">
          {sectionNav.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={
                s.id === "danger"
                  ? "flex items-center gap-2 rounded-tile border-l-2 border-transparent px-3 py-1.5 text-sm text-danger hover:border-danger hover:bg-paper-2"
                  : "flex items-center gap-2 rounded-tile border-l-2 border-transparent px-3 py-1.5 text-sm text-ink-2 hover:border-ember hover:bg-paper-2 hover:text-ink"
              }
            >
              <span className="flex-1">{s.label}</span>
              {typeof s.count === "number" && s.count > 0 ? (
                <span className="rounded-pill bg-stone px-2 py-0.5 font-mono text-[10px] text-ink-3">
                  {s.count}
                </span>
              ) : null}
            </a>
          ))}
        </nav>
        <div className="mt-6 rounded-tile border border-topo bg-paper-2 p-3 text-xs">
          <p className="font-mono uppercase tracking-wider text-ink-3">
            Current role
          </p>
          <p className="mt-1 font-medium">{role}</p>
          <Link
            href="#role"
            className="mt-2 inline-block font-medium text-ember underline-offset-4 hover:underline"
          >
            Manage role →
          </Link>
        </div>
      </aside>

      {/* Sections */}
      <div className="space-y-12">
        <header>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {user.email} · joined {fmtDate(user.createdAt)}
          </p>
        </header>

        <section id="profile" className="scroll-mt-20">
          <SectionLabel>↓ Profile</SectionLabel>
          <ProfileSection
            initial={{ name: user.name, email: user.email }}
          />
        </section>

        <section id="security" className="scroll-mt-20">
          <SectionLabel>↓ Sign-in &amp; sessions</SectionLabel>
          <SecuritySection />
        </section>

        <section id="role" className="scroll-mt-20">
          <SectionLabel>
            ↓ {role === "founder"
              ? "Founder passport"
              : role === "owner"
                ? `Claimed companies (${claimedCompanies.length})`
                : role === "investor"
                  ? "Investor preferences"
                  : "Account"}
          </SectionLabel>
          {role === "founder" ? (
            <FounderRoleBlock passport={passport} />
          ) : null}
          {role === "owner" ? (
            <OwnerRoleBlock companies={claimedCompanies} />
          ) : null}
          {role === "investor" ? (
            <InvestorSection
              defaults={
                investor ? toInvestorDefaults(investor) : undefined
              }
            />
          ) : null}
          {role === "goeo_admin" || role === "superadmin" ? (
            <p className="text-sm text-ink-2">
              You sign in as an admin.{" "}
              <Link
                href="/admin"
                className="text-ember underline-offset-4 hover:underline"
              >
                Open the admin console →
              </Link>
            </p>
          ) : null}
        </section>

        <section id="notifications" className="scroll-mt-20">
          <SectionLabel>↓ Notifications</SectionLabel>
          <NotificationsSection />
        </section>

        <section id="tokens" className="scroll-mt-20">
          <SectionLabel>↓ Agent tokens</SectionLabel>
          <p className="rounded-tile border border-dashed border-topo bg-paper-2 p-4 text-sm text-ink-3">
            Coming in Phase 5. Per-user scoped tokens that let
            Claude/ChatGPT update profiles you own. Distinct from the
            machine <code className="font-mono">X-Atlas-Admin-Token</code>{" "}
            used by CLI/MCP.
          </p>
        </section>

        <section id="danger" className="scroll-mt-20">
          <SectionLabel className="text-danger">↓ Danger zone</SectionLabel>
          <DangerZone />
        </section>
      </div>
    </section>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <p
        className={`mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 ${className}`}
      >
        {children}
      </p>
      <ScribbleDivider className="mb-5" />
    </>
  );
}

// Shape the DB row into form defaults. Runtime-validate the closed
// enums (DB stores text — bad values from a prior bug or manual SQL
// shouldn't survive into the form's typed enum fields).
type InvestorRow = {
  firmName: string | null;
  investorType: string | null;
  stagesJson: string | null;
  sectorsJson: string | null;
  checkSizeMin: number | null;
  checkSizeMax: number | null;
  geoFocusJson: string | null;
};
function toInvestorDefaults(row: InvestorRow) {
  const parseArr = (s: string | null) => {
    if (!s) return [];
    try {
      const parsed: unknown = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  };
  return {
    firm_name: row.firmName ?? undefined,
    investor_type: InvestorTypeEnum.safeParse(row.investorType).data,
    stages: parseArr(row.stagesJson).flatMap((s) =>
      StageEnum.safeParse(s).data ? [StageEnum.parse(s)] : [],
    ),
    sectors: parseArr(row.sectorsJson).flatMap((s) =>
      SectorEnum.safeParse(s).data ? [SectorEnum.parse(s)] : [],
    ),
    check_size_min: row.checkSizeMin ?? undefined,
    check_size_max: row.checkSizeMax ?? undefined,
    geo_focus: parseArr(row.geoFocusJson).flatMap((s) =>
      GeoFocusEnum.safeParse(s).data ? [GeoFocusEnum.parse(s)] : [],
    ),
  };
}

function FounderRoleBlock({
  passport,
}: {
  passport?: { id: string; county: string | null; stage: string | null };
}) {
  if (!passport) {
    return (
      <div className="rounded-tile border border-dashed border-topo bg-paper-2 p-5">
        <p className="text-sm text-ink-2">
          You haven&rsquo;t built a founder passport yet.
        </p>
        <Link
          href="/founder"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
        >
          Build my passport →
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-tile border-[1.5px] border-topo bg-paper-2 p-5">
      <p className="font-serif text-lg">{passport.county ?? "—"}</p>
      <p className="text-xs text-ink-3">stage: {passport.stage ?? "—"}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href={`/plan/${passport.id}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
        >
          View my plan →
        </Link>
        <Link
          href="/founder?settings=1"
          className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-5 py-3"
        >
          Edit passport
        </Link>
      </div>
    </div>
  );
}

function OwnerRoleBlock({
  companies,
}: {
  companies: Array<{ slug: string; name: string; verifiedAt: Date | null }>;
}) {
  if (companies.length === 0) {
    return (
      <div className="rounded-tile border border-dashed border-topo bg-paper-2 p-5">
        <p className="text-sm text-ink-2">
          You don&rsquo;t own any verified profiles yet.
        </p>
        <Link
          href="/onboarding/owner"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
        >
          Find my company →
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-3">
      {companies.map((c) => (
        <li
          key={c.slug}
          className="flex flex-wrap items-center gap-3 rounded-tile border-[1.5px] border-topo bg-paper-2 p-4"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 flex-none place-items-center rounded-tile border-[1.5px] border-ink bg-stone font-serif text-lg"
          >
            {c.name[0]?.toUpperCase() ?? "?"}
          </span>
          <span className="flex-1">
            <span className="block font-serif text-lg leading-tight">
              {c.name}
            </span>
            <span className="block text-xs text-ink-3">
              {c.verifiedAt
                ? `verified ${new Date(c.verifiedAt).toLocaleDateString()}`
                : "verified"}
            </span>
          </span>
          <span className="rounded-pill bg-sage-tint px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sage">
            owner
          </span>
          <Link
            href={`/companies/${c.slug}/edit`}
            className="rounded-pill border border-ember px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ember hover:bg-ember-tint"
          >
            Edit →
          </Link>
        </li>
      ))}
      <li>
        <Link
          href="/onboarding/owner"
          className="block rounded-tile border border-dashed border-topo bg-paper-2 p-3 text-center text-sm text-ink-3 hover:border-ember hover:text-ember"
        >
          + Claim another company
        </Link>
      </li>
    </ul>
  );
}
