import type { Metadata } from "next";

type SearchParams = Promise<{ next?: string; bad?: string }>;

export const metadata: Metadata = {
  title: "Preview access — Startup State Atlas",
  robots: { index: false, follow: false },
};

// Server component. Renders a minimal password form whose POST goes to
// /api/gate. Intentionally barebones — this page exists for a small
// pre-launch reviewer audience, not for end-user UX. Flip the gate
// off by deleting the SITE_PASSWORD Workers secret and redeploying.
export default async function GatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const bad = sp.bad === "1";

  return (
    <main
      className="grid min-h-[100dvh] place-items-center bg-paper p-6"
      style={{ backgroundColor: "var(--color-paper, #f7f4ed)" }}
    >
      <div
        className="w-full max-w-sm rounded-tile border-[1.5px] border-ink bg-paper-2 p-6 shadow-sketch"
        style={{
          backgroundColor: "var(--color-paper-2, #fbf9f4)",
          borderColor: "var(--color-ink, #0f1b2d)",
          boxShadow: "5px 5px 0 var(--color-ink, #0f1b2d)",
        }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
          Preview
        </p>
        <h1 className="mt-2 font-serif text-2xl leading-snug">
          Startup State Atlas — preview access
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          This deploy is gated while we prep for launch. Enter the
          shared preview password to continue.
        </p>

        <form
          action="/api/gate"
          method="POST"
          className="mt-5 space-y-3"
        >
          <input type="hidden" name="next" value={next} />
          <label htmlFor="gate-password" className="sr-only">
            Preview password
          </label>
          <input
            id="gate-password"
            name="password"
            type="password"
            autoFocus
            autoComplete="off"
            required
            placeholder="preview password"
            className="block h-11 w-full rounded-md border-[1.5px] border-ink/30 bg-paper px-3 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ember/30"
          />
          {bad ? (
            <p className="text-sm text-ember">
              That password didn&apos;t match — try again.
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-pill border-[1.5px] border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
          >
            Enter →
          </button>
        </form>

        <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          startup-state-atlas · pre-launch preview
        </p>
      </div>
    </main>
  );
}
