import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { resources } from "@/db/schema";
import { ScribbleDivider } from "@/components/brand";
import { ResourceForm } from "../_components/ResourceForm";

export const dynamic = "force-dynamic";

export default async function AdminResourceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const row = isNew
    ? null
    : (
        await db()
          .select()
          .from(resources)
          .where(eq(resources.id, id))
          .limit(1)
      )[0];
  if (!isNew && !row) notFound();

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        Resources · {isNew ? "new" : id}
      </p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {isNew ? "New resource" : (row?.title ?? "Edit resource")}
      </h1>
      <ScribbleDivider className="my-5" />
      <ResourceForm
        mode={isNew ? "create" : "edit"}
        initial={
          row
            ? {
                id: row.id,
                title: row.title,
                description: row.description ?? "",
                source_url: row.sourceUrl ?? "",
                kind: row.kind ?? "",
                contact_email: row.contactEmail ?? "",
              }
            : undefined
        }
      />
      <Link
        href="/admin/resources"
        className="mt-6 inline-block text-sm text-ink-3 hover:text-ember"
      >
        ← Back to all resources
      </Link>
    </div>
  );
}
