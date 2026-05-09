"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/url";

const OTP_TTL_SECONDS = 600; // matches auth.ts emailOTP.expiresIn
const RESEND_COOLDOWN_SECONDS = 30;

export default function SignUpVerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const role = params.get("role") ?? "founder";
  const next = safeNext(params.get("next"), "");

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expiresIn, setExpiresIn] = useState(OTP_TTL_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => {
      setExpiresIn((s) => Math.max(0, s - 1));
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function setDigit(i: number, val: string) {
    const cleaned = val.replace(/\D/g, "").slice(0, 1);
    setDigits((d) => {
      const next = [...d];
      next[i] = cleaned;
      return next;
    });
    if (cleaned && i < 5) inputs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    setDigits((d) => {
      const next = [...d];
      for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
      return next;
    });
    // Focus the next-empty cell, or the last cell when fully pasted.
    const lastFilled = Math.min(pasted.length, 6) - 1;
    inputs.current[Math.min(5, lastFilled + 1)]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  async function verify(otp: string) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if (result.error) {
        setError(result.error.message ?? "Invalid code. Try again.");
        setDigits(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        setSubmitting(false);
        return;
      }
      const target = next || `/onboarding/${role}`;
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setSubmitting(false);
    }
  }

  // Auto-submit when all 6 digits are filled.
  useEffect(() => {
    if (digits.every((d) => d.length === 1) && !submitting) {
      void verify(digits.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits.join("")]);

  async function resend() {
    if (resendCooldown > 0) return;
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setExpiresIn(OTP_TTL_SECONDS);
    setError(null);
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
  }

  const minutes = Math.floor(expiresIn / 60);
  const seconds = String(expiresIn % 60).padStart(2, "0");

  if (!email) {
    return (
      <AuthShell title="Missing email." kicker="Verify">
        <p className="text-sm text-ink-2">
          Restart the sign-up flow to get a verification code.
        </p>
        <button
          onClick={() => router.push("/sign-up")}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
        >
          Start over →
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
      steps={[
        { label: "Role", state: "done" },
        { label: "Account", state: "done" },
        { label: "Verify", state: "current" },
      ]}
    >
      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={submitting}
            aria-label={`Digit ${i + 1} of 6`}
            className="size-12 rounded-tile border-[1.5px] border-ink bg-paper-2 text-center font-mono text-2xl shadow-sketch focus:border-ember focus:outline-none disabled:opacity-50 sm:size-14"
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
        <span className="rounded-pill bg-ember-tint px-2 py-1 text-ember">
          code expires in {minutes}:{seconds}
        </span>
        <span className="rounded-pill bg-stone px-2 py-1 text-ink-3">
          {resendCooldown > 0 ? `resend in ${resendCooldown}s` : (
            <button
              onClick={resend}
              className="text-ember underline-offset-4 hover:underline"
            >
              Resend code
            </button>
          )}
        </span>
      </div>
      {error ? (
        <p className="mt-3 rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
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
