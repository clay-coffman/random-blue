"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginSentPage() {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "reset";
  const email = params.get("email") ?? "the address you entered";
  const isReset = mode === "reset";

  return (
    <AuthShell
      kicker="Check your inbox"
      title={isReset ? "Reset code sent." : "Sign-in link sent."}
      lede={
        isReset ? (
          <>
            If <strong>{email}</strong> is on file, a 6-digit code is on its
            way. Enter it on the next step to set a new password.
          </>
        ) : (
          <>
            If <strong>{email}</strong> is on file, a sign-in link is on its
            way. Tap it to log in — it expires in 15 minutes.
          </>
        )
      }
    >
      <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider">
        {isReset ? (
          <span className="rounded-pill bg-ember-tint px-2 py-1 text-ember">
            code valid 10 min
          </span>
        ) : (
          <>
            <span className="rounded-pill bg-ember-tint px-2 py-1 text-ember">
              link valid 15 min
            </span>
            <span className="rounded-pill bg-stone px-2 py-1 text-ink-3">
              opens once
            </span>
          </>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {isReset ? (
          <Link
            href={`/reset-password?email=${encodeURIComponent(email === "the address you entered" ? "" : email)}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
          >
            Enter code →
          </Link>
        ) : null}
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
