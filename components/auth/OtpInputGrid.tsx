"use client";

import { useEffect, useRef, useState } from "react";

const OTP_TTL_SECONDS = 600; // matches auth.ts emailOTP.expiresIn
const RESEND_COOLDOWN_SECONDS = 30;

export type OtpInputGridProps = {
  onSubmit: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  submitting: boolean;
  error: string | null;
  // When `error` flips to a new truthy value, the grid clears its
  // digits and refocuses the first input. Pass null to keep state.
  resetSignal?: unknown;
};

export function OtpInputGrid({
  onSubmit,
  onResend,
  submitting,
  error,
  resetSignal,
}: OtpInputGridProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
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

  // Parent clears digits on rejected OTP by bumping resetSignal.
  useEffect(() => {
    if (resetSignal === undefined) return;
    setDigits(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  }, [resetSignal]);

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
    const lastFilled = Math.min(pasted.length, 6) - 1;
    inputs.current[Math.min(5, lastFilled + 1)]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  // Auto-submit when all 6 digits are filled.
  useEffect(() => {
    if (digits.every((d) => d.length === 1) && !submitting) {
      void onSubmit(digits.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits.join("")]);

  async function resend() {
    if (resendCooldown > 0) return;
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setExpiresIn(OTP_TTL_SECONDS);
    await onResend();
  }

  const minutes = Math.floor(expiresIn / 60);
  const seconds = String(expiresIn % 60).padStart(2, "0");

  return (
    <>
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
          {resendCooldown > 0 ? (
            `resend in ${resendCooldown}s`
          ) : (
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
    </>
  );
}
