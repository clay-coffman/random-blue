import { cn } from "@/lib/utils";

type ChipTone =
  | "ink"
  | "ember"
  | "sage"
  | "sky"
  | "stone"
  | "ember-tint"
  | "sage-tint"
  | "sky-tint";
type ChipSize = "sm" | "md";

type ChipProps = {
  tone?: ChipTone;
  size?: ChipSize;
  className?: string;
  children: React.ReactNode;
};

const toneClasses: Record<ChipTone, string> = {
  ink: "bg-ink text-paper border-ink",
  ember: "bg-ember text-paper border-ember",
  sage: "bg-sage text-paper border-sage",
  sky: "bg-sky text-paper border-sky",
  stone: "bg-stone text-ink border-ink",
  "ember-tint": "bg-ember-tint text-ember border-ember",
  "sage-tint": "bg-sage-tint text-sage border-sage",
  "sky-tint": "bg-sky-tint text-sky border-sky",
};

const sizeClasses: Record<ChipSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-[11px]",
};

export function Chip({
  tone = "stone",
  size = "md",
  className,
  children,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border-[1.5px] font-mono uppercase tracking-wider",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
