import { cn } from "@/lib/utils";

type ScribbleWidth = "full" | "med" | "short";

type ScribbleDividerProps = {
  width?: ScribbleWidth;
  className?: string;
};

const widthClasses: Record<ScribbleWidth, string> = {
  full: "w-full",
  med: "w-2/3",
  short: "w-1/3",
};

export function ScribbleDivider({
  width = "full",
  className,
}: ScribbleDividerProps) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn("h-[2px]", widthClasses[width], className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, var(--color-ink-2) 0 6px, transparent 6px 10px)",
      }}
    />
  );
}
