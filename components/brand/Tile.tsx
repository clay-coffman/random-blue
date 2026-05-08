import { cn } from "@/lib/utils";

type TileVariant = "default" | "subtle" | "rotated";
type TileShadow = "sketch" | "sketch-hover" | "none";

type TileProps = {
  as?: React.ElementType;
  variant?: TileVariant;
  shadow?: TileShadow;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<TileVariant, string> = {
  default: "bg-paper-2 border-[1.5px] border-ink rounded-tile p-5",
  subtle: "bg-paper border border-topo rounded-tile p-5",
  rotated:
    "bg-paper-2 border-[1.5px] border-ink rounded-tile p-5 rotate-[0.5deg]",
};

const shadowClasses: Record<TileShadow, string> = {
  sketch: "shadow-sketch",
  "sketch-hover": "shadow-sketch hover:shadow-sketch-hover",
  none: "",
};

export function Tile({
  as: Component = "div",
  variant = "default",
  shadow = "sketch",
  className,
  children,
}: TileProps) {
  return (
    <Component
      className={cn(variantClasses[variant], shadowClasses[shadow], className)}
    >
      {children}
    </Component>
  );
}
