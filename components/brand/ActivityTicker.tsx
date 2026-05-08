import { cn } from "@/lib/utils";

const stub = [
  "+ Crew (FinTech, SLC) just claimed their profile",
  "+ Maria added a hiring update",
  "+ 3 new resources in Washington County",
];

type ActivityTickerProps = {
  className?: string;
};

// TODO(phase-5): wire to real events from D1 (last-N claims + passport
// creations + profile updates).
export function ActivityTicker({ className }: ActivityTickerProps) {
  return (
    <div
      className={cn(
        "flex min-w-[240px] flex-1 items-center gap-6 overflow-x-auto font-mono text-[11px] text-topo",
        className,
      )}
      aria-label="Recent activity"
    >
      {stub.map((line, i) => (
        <span key={i} className="flex shrink-0 items-center gap-2">
          <span aria-hidden className="text-ember">
            {line.charAt(0)}
          </span>
          <span className="whitespace-nowrap">
            <span className="text-paper">{line.slice(2)}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
