"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginSentPage() {
  const params = useSearchParams();
  const email = params.get("email") ?? "the address you entered";

  return (
    <AuthShell
      kicker="Check your inbox"
      title="Reset code sent."
      lede={
        <>
          If <strong>{email}</strong> is on file, a 6-digit code is on its
          way. Enter it on the next step to set a new password.
        </>
      }
    >
      <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider">
        <span className="rounded-pill bg-ember-tint px-2 py-1 text-ember">
          code valid 10 min
        </span>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/reset-password?email=${encodeURIComponent(email === "the address you entered" ? "" : email)}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
        >
          Enter code →
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-5 py-3 text-sm"
        >
          ← Wrong email
        </Link>
      </div>
    </AuthShell>
  );
}
