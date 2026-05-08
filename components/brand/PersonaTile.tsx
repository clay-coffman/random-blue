import Link from "next/link";
import type { Persona } from "@/lib/personas";
import { cn } from "@/lib/utils";

type PersonaTileVariant = "compact" | "full";

type PersonaTileProps = {
  persona: Persona;
  variant?: PersonaTileVariant;
  active?: boolean;
  className?: string;
};

export function PersonaTile({
  persona,
  variant = "compact",
  active = false,
  className,
}: PersonaTileProps) {
  const href = `/founder?persona=${persona.id}`;
  const initial = persona.displayName.charAt(0);
  const firstName = persona.displayName.split(",")[0];

  if (variant === "full") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex min-h-[44px] flex-col gap-2 rounded-tile border-[1.5px] border-ink bg-paper-2 p-5 shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover",
          active && "bg-ember-tint",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink bg-ember-tint font-mono text-sm font-semibold"
          >
            {initial}
          </span>
          <span className="flex flex-col">
            <span className="font-serif text-lg leading-tight">
              {persona.displayName}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
              {persona.location}
            </span>
          </span>
        </div>
        <p className="text-sm leading-relaxed text-ink-2">{persona.oneLiner}</p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`Try as ${persona.displayName} — ${persona.location}`}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper-2 px-3 py-1.5 shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover",
        active && "bg-ember-tint",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-ink bg-ember-tint font-mono text-[12px] font-semibold"
      >
        {initial}
      </span>
      <span className="font-serif text-sm leading-none">{firstName}</span>
    </Link>
  );
}
