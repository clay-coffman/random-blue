"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_BYTES = 10 * 1024 * 1024;

export function ClaimUploadForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("Pick a verification document.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File exceeds 10 MB.");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("company_slug", slug);
    fd.append("file", file);
    try {
      const res = await fetch("/api/v1/ownership-submissions", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(json?.error?.message ?? `Upload failed (HTTP ${res.status}).`);
        setSubmitting(false);
        return;
      }
      router.push("/me/submissions?submitted=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="font-medium">Verification document</span>
        <span className="mt-1 block text-xs text-ink-3">
          PDF, PNG, JPEG, or WebP · up to 10 MB
        </span>
        <input
          type="file"
          name="file"
          accept={ACCEPT}
          required
          className="mt-2 block w-full rounded-tile border-[1.5px] border-ink bg-paper-2 p-3 file:mr-3 file:rounded-pill file:border-0 file:bg-ember file:px-3 file:py-1.5 file:text-paper"
        />
      </label>
      {error ? (
        <p className="rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover disabled:opacity-60"
      >
        {submitting ? "Uploading…" : "Submit for review →"}
      </button>
      <p className="text-xs text-ink-3">
        Your document is private. Only GOEO admins reviewing claims can view
        it, via 60-second signed links.
      </p>
    </form>
  );
}
