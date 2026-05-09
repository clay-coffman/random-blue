"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const OTP_TTL_SECONDS = 600; // matches auth.ts emailOTP.expiresIn
const RESEND_COOLDOWN_SECONDS = 30;

export type OtpInputGridProps = {
  onSubmit: (otp: string) => Promise<void>;
  // Returning a string surfaces a resend error to the user; returning
  // void (or nothing) is treated as success.
  onResend: () => Promise<string | void>;
  submitting: boolean;
  error: string | null;
  // When the parent bumps `resetSignal`, the grid clears its digits
  // and refocuses the first input. Use it to recover after a rejected
  // OTP. Leave undefined to keep state.
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
  const [resendError, setResendError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  // Stash the latest onSubmit so the auto-submit effect (which depends
  // only on the joined digits) can call the current handler without
  // re-running on every parent re-render.
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    const t = setInterval(() => {
      setExpiresIn((s) => Math.max(0, s - 1));
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (resetSignal === undefined) return;
    setDigits(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  }, [resetSignal]);

  // Spread up to 6 digits across slots starting at `startIndex`.
  // Single-character input typing, paste, and iOS one-time-code
  // autofill (which writes the full 6-digit code into a single
  // focused input via onChange, not onPaste) all funnel through here.
  const fillFrom = useCallback((startIndex: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length === 0) return;
    setDigits((d) => {
      const next = [...d];
      for (let k = 0; k < cleaned.length && startIndex + k < 6; k++) {
        next[startIndex + k] = cleaned[k];
      }
      return next;
    });
    const lastWritten = Math.min(5, startIndex + cleaned.length - 1);
    const focusTarget = Math.min(5, lastWritten + 1);
    inputs.current[focusTarget]?.focus();
  }, []);

  function setDigit(i: number, val: string) {
    fillFrom(i, val);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (!/\D*\d/.test(pasted)) return;
    e.preventDefault();
    fillFrom(0, pasted);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  const joined = digits.join("");
  useEffect(() => {
    if (joined.length === 6 && !submitting) {
      void onSubmitRef.current(joined);
    }
  }, [joined, submitting]);

  async function resend() {
    if (resendCooldown > 0) return;
    setResendError(null);
    const result = await onResend();
    if (typeof result === "string") {
      // Don't burn the cooldown / TTL on a failed resend — the user
      // should be able to retry immediately once they fix whatever
      // the server flagged.
      setResendError(result);
      return;
    }
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setExpiresIn(OTP_TTL_SECONDS);
  }

  const minutes = Math.floor(expiresIn / 60);
  const seconds = String(expiresIn % 60).padStart(2, "0");
  const displayError = error ?? resendError;

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
            // No maxLength — iOS one-time-code autofill writes the
            // full 6-digit string into a single focused input, and
            // maxLength=1 would silently truncate it. fillFrom()
            // handles the spread.
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
      {displayError ? (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-3 rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger"
        >
          {displayError}
        </p>
      ) : null}
    </>
  );
}
