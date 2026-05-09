"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ConsumeInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(
          `/api/v1/admin/invites/${encodeURIComponent(params.token)}`,
        );
        if (!res.ok) {
          if (res.status === 401) {
            // Not signed in — bounce to sign-in with a return URL.
            router.replace(
              `/sign-in?next=${encodeURIComponent(`/admin/invite/${params.token}`)}`,
            );
            return;
          }
          const json = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          setError(json?.error?.message ?? `HTTP ${res.status}`);
          setStatus("error");
          return;
        }
        setStatus("ok");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error.");
        setStatus("error");
      }
    })();
  }, [params.token, router]);

  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center sm:px-7">
      {status === "loading" ? (
        <p className="font-mono text-sm text-ink-3">Accepting your invite…</p>
      ) : status === "ok" ? (
        <>
          <span
            aria-hidden
            className="inline-grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-sage bg-sage-tint font-serif text-4xl text-sage"
          >
            ✓
          </span>
          <h1 className="mt-4 font-serif text-3xl">You&rsquo;re an admin.</h1>
          <p className="mt-2 text-ink-2">Your role has been upgraded.</p>
          <Link
            href="/admin"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
          >
            Open the admin console →
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-serif text-2xl text-danger">Couldn&rsquo;t accept invite.</h1>
          <p className="mt-2 text-sm text-ink-2">{error ?? "Unknown error."}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-ember underline-offset-4 hover:underline"
          >
            ← Back home
          </Link>
        </>
      )}
    </section>
  );
}
