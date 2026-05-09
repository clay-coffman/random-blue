"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Tile } from "@/components/brand";
import type { FounderPassportInput, RecommendResponse } from "@/types/api";
import { ResultsView } from "./ResultsView";

type Props = { passportId: string };

type Stash = {
  input: FounderPassportInput;
  response: RecommendResponse;
};

export function LocalPlanLoader({ passportId }: Props) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "found"; data: Stash }
    | { kind: "missing" }
  >({ kind: "loading" });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`atlas:plan:${passportId}`);
      if (!raw) {
        setState({ kind: "missing" });
        return;
      }
      const parsed = JSON.parse(raw) as Stash;
      if (!parsed?.response?.recommendations) {
        setState({ kind: "missing" });
        return;
      }
      setState({ kind: "found", data: parsed });
    } catch {
      setState({ kind: "missing" });
    }
  }, [passportId]);

  if (state.kind === "loading") {
    return (
      <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-7">
        <Tile className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
            Loading your plan…
          </p>
        </Tile>
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-7">
        <Tile className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl">Plan not found.</h2>
          <p className="mt-2 text-ink-2">
            Saved plans live in your browser session. Start a new plan and
            we&apos;ll generate one with a fresh URL you can share.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/founder"
              className="inline-flex h-11 items-center rounded-tile border-[1.5px] border-ember bg-ember px-5 font-mono text-[12px] uppercase tracking-wider text-paper"
            >
              Start over
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-5 font-mono text-[12px] uppercase tracking-wider"
            >
              Back to home
            </Link>
          </div>
        </Tile>
      </div>
    );
  }

  return (
    <ResultsView
      passportId={passportId}
      input={state.data.input}
      response={state.data.response}
    />
  );
}
