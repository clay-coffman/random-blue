// One-click "stop these alerts" page reachable from the unsubscribe
// link in saved-search alert emails. Pure server component — verifies
// the HMAC token, sets cadence to "off", confirms back to the user.

import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { savedSearches } from "@/db/schema";
import { verifyToken } from "@/lib/signed-token";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ t?: string | string[] }>;
};

export default async function UnsubscribeSavedSearchPage({
  searchParams,
}: Props) {
  const { t } = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;

  if (!token) {
    return <Shell title="Missing token">Open the link directly from the email.</Shell>;
  }

  const verified = await verifyToken(token, "ss-unsub");
  if (!verified.ok) {
    return (
      <Shell title="Link expired or invalid">
        This unsubscribe link couldn&apos;t be verified ({verified.reason}). Sign in
        and disable the saved search from{" "}
        <Link href="/settings#notifications" className="underline">
          your settings
        </Link>
        .
      </Shell>
    );
  }

  const rows = await db()
    .select({ id: savedSearches.id, name: savedSearches.name, cadence: savedSearches.cadence })
    .from(savedSearches)
    .where(eq(savedSearches.id, verified.id))
    .limit(1);
  const existing = rows[0];

  if (!existing) {
    return <Shell title="Saved search not found">It may have been deleted already.</Shell>;
  }

  if (existing.cadence !== "off") {
    await db()
      .update(savedSearches)
      .set({ cadence: "off", updatedAt: new Date() })
      .where(eq(savedSearches.id, existing.id));
  }

  return (
    <Shell title="Alerts paused">
      You won&apos;t get more emails for <strong>{existing.name}</strong>. You can
      re-enable it any time from{" "}
      <Link href="/settings#notifications" className="underline">
        Settings &rsaquo; Notifications
      </Link>
      .
    </Shell>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-3 px-4 py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
        Saved-search alerts
      </p>
      <h1 className="font-serif text-2xl leading-tight">{title}</h1>
      <p className="text-ink-2">{children}</p>
    </main>
  );
}
