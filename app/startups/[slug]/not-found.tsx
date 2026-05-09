import Link from "next/link";
import { Tile } from "@/components/brand";

export default function StartupNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:px-7">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
        404 · No company at this slug
      </p>
      <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
        We couldn&apos;t find that startup.
      </h1>
      <p className="text-ink-3">
        The slug doesn&apos;t match any company in the directory. It may have
        been renamed, removed, or never seeded.
      </p>
      <Tile
        variant="default"
        shadow="sketch"
        className="w-full max-w-md text-left"
      >
        <p className="font-serif text-base leading-snug">Try one of these:</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <Link
              href="/map"
              className="text-ember underline-offset-2 hover:underline"
            >
              → Browse the Utah Startup Map
            </Link>
          </li>
          <li>
            <Link
              href="/api/v1/companies"
              className="text-ember underline-offset-2 hover:underline"
            >
              → /api/v1/companies (full directory JSON)
            </Link>
          </li>
          <li>
            <Link
              href="/"
              className="text-ember underline-offset-2 hover:underline"
            >
              → Atlas home
            </Link>
          </li>
        </ul>
      </Tile>
    </div>
  );
}
