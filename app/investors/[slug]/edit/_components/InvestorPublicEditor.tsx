"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useId, useState } from "react";

type Defaults = {
  slug: string;
  display_name: string;
  tagline: string;
  bio: string;
  website: string;
  linkedin: string;
};

export function InvestorPublicEditor({
  slug,
  canEditSlug,
  defaults,
}: {
  slug: string;
  canEditSlug: boolean;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Defaults>(defaults);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function set<K extends keyof Defaults>(key: K, v: Defaults[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setStatus("idle");
  }

  async function submit() {
    setBusy(true);
    setErrorMessage(null);
    try {
      const body: Record<string, unknown> = {
        display_name: values.display_name.trim(),
        tagline: values.tagline.trim() || null,
        bio: values.bio.trim() || null,
        website: values.website.trim() || null,
        linkedin: values.linkedin.trim() || null,
      };
      if (canEditSlug && values.slug !== slug) {
        body.slug = values.slug.trim();
      }

      const res = await fetch(`/api/v1/investor-profiles/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        const msg = err?.error?.message ?? `Save failed (${res.status}).`;
        setErrorMessage(msg);
        setStatus("error");
      } else {
        const json = (await res.json()) as { profile: { slug: string } };
        setStatus("saved");
        // If the slug changed, navigate to the new editor URL.
        if (json.profile.slug !== slug) {
          router.replace(`/investors/${json.profile.slug}/edit`);
        } else {
          router.refresh();
        }
      }
    } catch {
      setErrorMessage("Network error — try again.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="mt-6 space-y-6"
    >
      <Field label="Display name" required>
        {(fieldProps) => (
          <input
            type="text"
            {...fieldProps}
            value={values.display_name}
            onChange={(e) => set("display_name", e.target.value)}
            maxLength={120}
            required
            className="w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 font-serif text-base focus:border-ember focus:outline-none"
          />
        )}
      </Field>

      <Field
        label="Slug"
        hint={
          canEditSlug
            ? "Lowercase letters, digits, and hyphens."
            : "Locked after verification."
        }
      >
        {(fieldProps) => (
          <input
            type="text"
            {...fieldProps}
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
            maxLength={80}
            disabled={!canEditSlug}
            pattern="[a-z0-9-]+"
            className="w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 font-mono text-sm focus:border-ember focus:outline-none disabled:bg-paper-2 disabled:text-ink-3"
          />
        )}
      </Field>

      <Field label="Tagline" hint="One line. Shows under your name on the profile.">
        {(fieldProps) => (
          <input
            type="text"
            {...fieldProps}
            value={values.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            maxLength={200}
            className="w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 font-serif text-base focus:border-ember focus:outline-none"
          />
        )}
      </Field>

      <Field label="Bio" hint="A few short paragraphs. Plain text — no HTML.">
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            rows={8}
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
            maxLength={2000}
            className="w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 font-serif text-base leading-relaxed focus:border-ember focus:outline-none"
          />
        )}
      </Field>

      <Field label="Website">
        {(fieldProps) => (
          <input
            type="url"
            {...fieldProps}
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://"
            className="w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 font-serif text-base focus:border-ember focus:outline-none"
          />
        )}
      </Field>

      <Field label="LinkedIn">
        {(fieldProps) => (
          <input
            type="url"
            {...fieldProps}
            value={values.linkedin}
            onChange={(e) => set("linkedin", e.target.value)}
            placeholder="https://www.linkedin.com/in/…"
            className="w-full rounded-tile border-[1.5px] border-ink/30 bg-paper p-3 font-serif text-base focus:border-ember focus:outline-none"
          />
        )}
      </Field>

      {errorMessage ? (
        <p className="rounded-tile border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
      {status === "saved" ? (
        <p className="rounded-tile border border-sage bg-sage-tint px-3 py-2 text-sm text-sage">
          ✓ Saved.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill bg-ember px-5 font-mono text-xs uppercase tracking-wider text-paper transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <Link
          href={`/investors/${slug}`}
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-pill border-[1.5px] border-ink/40 px-4 font-mono text-xs uppercase tracking-wider text-ink-2 hover:bg-paper-2"
        >
          View public profile →
        </Link>
        <Link
          href="/settings"
          className="font-mono text-[10px] uppercase tracking-wider text-ink-3 underline-offset-2 hover:underline"
        >
          back to settings
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="block">
      <label
        htmlFor={id}
        className="block font-mono text-[11px] uppercase tracking-wider text-ink-3"
      >
        {label}
        {required ? " *" : ""}
      </label>
      {hint ? (
        <p
          id={hintId}
          className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3/70"
        >
          {hint}
        </p>
      ) : null}
      <div className="mt-2">
        {children({ id, "aria-describedby": hintId })}
      </div>
    </div>
  );
}
