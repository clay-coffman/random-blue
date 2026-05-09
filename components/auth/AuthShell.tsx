import Link from "next/link";
import { ScribbleDivider } from "@/components/brand";

type Step = { label: string; state: "done" | "current" | "pending" };

interface AuthShellProps {
  kicker?: string;
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  steps?: Step[];
}

export function AuthShell({
  kicker,
  title,
  lede,
  children,
  footer,
  steps,
}: AuthShellProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-180px)] max-w-md flex-col px-4 py-10 sm:px-7">
      {steps ? <Stepper steps={steps} /> : null}
      {kicker ? (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          {kicker}
        </p>
      ) : null}
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {lede ? (
        <div className="mt-3 text-base leading-relaxed text-ink-2">{lede}</div>
      ) : null}
      <ScribbleDivider className="my-6" />
      <div className="flex flex-1 flex-col">{children}</div>
      {footer ? (
        <div className="mt-8 text-sm text-ink-3">{footer}</div>
      ) : null}
    </section>
  );
}

function Stepper({ steps }: { steps: Step[] }) {
  return (
    <ol
      aria-label="Sign-up progress"
      className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-3"
    >
      {steps.map((s, i) => (
        <li
          key={s.label}
          aria-current={s.state === "current" ? "step" : undefined}
          className={`flex items-center gap-2 ${i < steps.length - 1 ? "flex-1" : ""}`}
        >
          <span
            aria-hidden
            className={
              s.state === "current"
                ? "grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] border-ember bg-ember font-mono text-[11px] font-semibold text-paper"
                : s.state === "done"
                  ? "grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] border-sage bg-sage font-mono text-[11px] font-semibold text-paper"
                  : "grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] border-topo font-mono text-[11px] font-semibold text-ink-3"
            }
          >
            {s.state === "done" ? "✓" : i + 1}
          </span>
          <span className="whitespace-nowrap">{s.label}</span>
          {i < steps.length - 1 ? (
            <span
              aria-hidden
              className="h-[1.5px] flex-1"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--color-ink-3) 0 6px, transparent 6px 10px)",
              }}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function AuthFooterLink({
  prefix,
  href,
  label,
}: {
  prefix: string;
  href: string;
  label: string;
}) {
  return (
    <p className="text-sm text-ink-3">
      {prefix}{" "}
      <Link
        href={href}
        className="font-medium text-ember underline-offset-4 hover:underline"
      >
        {label} →
      </Link>
    </p>
  );
}
