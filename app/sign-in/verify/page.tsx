"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInputGrid } from "@/components/auth/OtpInputGrid";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/url";

export default function SignInVerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const next = safeNext(params.get("next"));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  async function verify(otp: string) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await authClient.signIn.emailOtp({ email, otp });
      if (result.error) {
        setError(result.error.message ?? "Invalid code. Try again.");
        setResetSignal((n) => n + 1);
        setSubmitting(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setResetSignal((n) => n + 1);
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
  }

  if (!email) {
    return (
      <AuthShell title="Missing email." kicker="Verify">
        <p className="text-sm text-ink-2">
          Restart the sign-in flow to get a code.
        </p>
        <button
          onClick={() => router.push("/sign-in")}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
        >
          Back to log in →
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Check your inbox"
      title={`We sent a code to ${email}.`}
      lede={
        <>
          Auto-advances when all six digits are in.{" "}
          <button
            type="button"
            onClick={() => router.back()}
            className="text-ember underline-offset-4 hover:underline"
          >
            Wrong email?
          </button>
        </>
      }
    >
      <OtpInputGrid
        onSubmit={verify}
        onResend={resend}
        submitting={submitting}
        error={error}
        resetSignal={resetSignal}
      />
      <div className="mt-6 rounded-tile border border-dashed border-topo bg-paper-2 p-4 text-sm text-ink-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Can&rsquo;t find it?
        </p>
        <p className="mt-1">
          Check spam, or search &ldquo;Startup State Atlas&rdquo;.
        </p>
      </div>
    </AuthShell>
  );
}
