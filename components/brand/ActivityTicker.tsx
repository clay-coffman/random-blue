import type { ActivityEvent } from "@/lib/activity";
import { cn } from "@/lib/utils";

const fallback: ActivityEvent[] = [
  {
    kind: "claim",
    text: "New here — be the first to claim a profile",
    ts: 0,
  },
];

type ActivityTickerProps = {
  className?: string;
  events?: ActivityEvent[];
};

export function ActivityTicker({ className, events }: ActivityTickerProps) {
  const lines = events && events.length > 0 ? events : fallback;
  return (
    <div
      className={cn(
        "flex min-w-[240px] flex-1 items-center gap-6 overflow-x-auto font-mono text-[11px] text-topo",
        className,
      )}
      aria-label="Recent activity"
    >
      {lines.map((event, i) => (
        <span
          key={`${event.kind}-${event.ts}-${i}`}
          className="flex shrink-0 items-center gap-2"
        >
          <span aria-hidden className="text-ember">
            +
          </span>
          <span className="whitespace-nowrap">
            <span className="text-paper">{event.text}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
