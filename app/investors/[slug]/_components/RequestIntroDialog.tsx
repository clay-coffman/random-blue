"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  targetType: "investor" | "company";
  targetId: string;
  targetName: string;
  pendingIntroId?: string | null;
};

const MIN_MESSAGE = 20;
const MAX_MESSAGE = 2000;

const QUEUE_HREF = "/me/intros?tab=outbound";

export function RequestIntroDialog({
  targetType,
  targetId,
  targetName,
  pendingIntroId = null,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "sent" | "duplicate" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (status === "sent") {
    return (
      <div
        role="status"
        className="block w-full rounded-tile border-[1.5px] border-sage bg-sage-tint px-4 py-3 font-mono text-xs uppercase tracking-wider text-sage sm:w-[440px]"
      >
        ✓ Request sent. We&apos;ll email you when GOEO reviews it.{" "}
        <Link
          href={QUEUE_HREF}
          className="underline decoration-sage/60 hover:decoration-sage"
        >
          View in your queue →
        </Link>
      </div>
    );
  }

  if (status === "duplicate" || (pendingIntroId && status === "idle")) {
    return (
      <div role="status" className="w-full sm:w-auto">
        <Link
          href={QUEUE_HREF}
          className="inline-flex h-10 min-h-[44px] w-full items-center justify-center rounded-pill border-[1.5px] border-ember/40 bg-ember-tint px-4 font-mono text-xs uppercase tracking-wider text-ink-2 transition hover:bg-ember-tint/80 sm:w-auto"
        >
          Pending review · view in your queue →
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-pill border-[1.5px] border-ember bg-ember px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
      >
        Request intro through GOEO
      </button>
    );
  }

  const tooShort = message.trim().length < MIN_MESSAGE;
  const tooLong = message.length > MAX_MESSAGE;

  async function submit() {
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/intro-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target: { type: targetType, id: targetId },
          message_text: message.trim(),
        }),
      });
      if (res.status === 409) {
        setStatus("duplicate");
        setBusy(false);
        // Refresh so any sibling dialog instance on the same page
        // (e.g. hero rail + Contact tile) re-renders against the
        // server-side pre-empt and flips to the same pending pill.
        router.refresh();
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        const msg =
          err?.error?.message ?? `Request failed (${res.status}).`;
        setErrorMessage(msg);
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMessage("Network error — try again.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full rounded-tile border-[1.5px] border-ink bg-paper p-4 sm:w-[440px]">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        Intro to {targetName}
      </p>
      <p className="mt-2 text-sm text-ink-2">
        GOEO reviews each request. If accepted, we&apos;ll connect you both
        by email. Be specific — what you&apos;re working on, why this
        connection, and what you&apos;re hoping for.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        maxLength={MAX_MESSAGE}
        placeholder="Hi — I'm building X, looking for help with Y…"
        className="mt-3 w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 font-serif text-base leading-relaxed focus:border-ember focus:outline-none"
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-3">
        <span>
          {message.trim().length}/{MAX_MESSAGE}
          {tooShort
            ? ` · ${MIN_MESSAGE - message.trim().length} more chars`
            : ""}
        </span>
      </div>
      {errorMessage ? (
        <p className="mt-2 rounded-tile border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || tooShort || tooLong}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ember px-4 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {busy ? "Sending…" : "Send request"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setMessage("");
            setErrorMessage(null);
            setStatus("idle");
          }}
          disabled={busy}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink/40 px-4 font-mono text-xs uppercase tracking-wider text-ink-2 transition hover:bg-paper-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
