import Link from "next/link";
import { Tile } from "@/components/brand";

type Props = { passportId: string };

export function SaveYourPlanCta({ passportId }: Props) {
  const next = `/plan/${passportId}?claim=${passportId}`;
  const signUpHref = `/sign-up?next=${encodeURIComponent(next)}`;
  const signInHref = `/sign-in?next=${encodeURIComponent(next)}`;
  return (
    <Tile
      as="aside"
      shadow="sketch-hover"
      className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-ember">
          ↓ Save your plan
        </p>
        <h2 className="mt-1 font-serif text-2xl leading-tight">
          Sign up to keep this plan in your account.
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          You&rsquo;ll be able to come back to it from any device, and
          we&rsquo;ll surface it under <span className="font-mono">My plan</span>{" "}
          in your account menu.
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <Link
          href={signUpHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover"
        >
          Create an account →
        </Link>
        <Link
          href={signInHref}
          className="font-mono text-[11px] uppercase tracking-wider text-ink-3 underline-offset-2 hover:text-ember hover:underline"
        >
          already have one? sign in →
        </Link>
      </div>
    </Tile>
  );
}
