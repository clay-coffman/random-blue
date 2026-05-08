import { cn } from "@/lib/utils";

type KickerTone = "ember" | "sky" | "sage" | "ink-3";

type SectionHeaderProps = {
  kicker?: string;
  kickerTone?: KickerTone;
  title: string;
  sub?: string;
  className?: string;
};

const kickerToneClasses: Record<KickerTone, string> = {
  ember: "text-ember",
  sky: "text-sky",
  sage: "text-sage",
  "ink-3": "text-ink-3",
};

export function SectionHeader({
  kicker,
  kickerTone = "ember",
  title,
  sub,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-1", className)}>
      {kicker && (
        <p
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.18em]",
            kickerToneClasses[kickerTone],
          )}
        >
          {kicker}
        </p>
      )}
      <h2 className="font-serif text-2xl font-normal leading-tight tracking-tight sm:text-3xl">
        {title}
      </h2>
      {sub && <p className="font-hand text-base text-ink-3">{sub}</p>}
    </header>
  );
}
