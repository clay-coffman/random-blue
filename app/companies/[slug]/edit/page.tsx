import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies } from "@/db/schema";
import { getAuth } from "@/auth";
import { isAdminRole } from "@/lib/auth-utils";
import { ScribbleDivider } from "@/components/brand";
import { EditorForm } from "../_components/EditorForm";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/sign-in?next=/companies/${slug}/edit`);
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
      </div>
    );
  }

  const role = (session.user as { role?: string }).role ?? "founder";
  const isAdmin = isAdminRole(role);
  const isOwner = company.claimedByUserId === session.user.id;
  if (!isAdmin && !isOwner) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-7">
        <h1 className="font-serif text-2xl">You don&rsquo;t own this profile.</h1>
        <p className="mt-2 text-sm text-ink-2">
          Claim it first, or reach out to GOEO if you believe this is an error.
        </p>
        <Link
          href={`/companies/${slug}/claim`}
          className="mt-4 inline-block text-ember underline-offset-4 hover:underline"
        >
          Start a claim →
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-7">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        Edit · {company.name}
        {isAdmin && !isOwner ? " · admin override" : ""}
      </p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Update {company.name}.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Changes publish immediately to the website, the .md card, the JSON
        endpoint, and the API.
      </p>
      <ScribbleDivider className="my-6" />
      <EditorForm
        slug={slug}
        company={{
          name: company.name,
          website: company.website ?? undefined,
          description: company.description ?? undefined,
          sector: company.sector ?? undefined,
          stage: company.stage ?? undefined,
          employee_count: company.employeeCount ?? undefined,
          hiring_status: company.hiringStatus,
          founding_year: company.foundingYear ?? undefined,
          logo_url: company.logoUrl ?? undefined,
          founder_team_json: company.founderTeamJson ?? undefined,
          // Admin-only fields exposed only when isAdmin:
          ...(isAdmin
            ? {
                slug: company.slug,
                linkedin: company.linkedin ?? undefined,
                address_text: company.addressText ?? undefined,
              }
            : {}),
        }}
        canEditLockedFields={isAdmin}
      />
    </section>
  );
}
