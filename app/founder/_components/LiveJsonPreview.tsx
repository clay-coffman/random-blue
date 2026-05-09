"use client";

import type { FounderPassportInput } from "@/types/api";

type Props = {
  passport: FounderPassportInput;
  className?: string;
};

const isEmpty = (v: unknown): boolean => {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
};

export function LiveJsonPreview({ passport, className }: Props) {
  const entries = (
    Object.entries(passport) as [keyof FounderPassportInput, unknown][]
  ).filter(([, v]) => !isEmpty(v));

  return (
    <div
      className={`rounded-tile border-[1.5px] border-ink bg-ink p-0 text-paper shadow-sketch ${
        className ?? ""
      }`}
    >
      <header className="flex items-center justify-between border-b border-paper/15 px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em]">
          founder_passport · draft
        </span>
        <span className="font-mono text-[10px] text-ember-tint">● live</span>
      </header>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-7">
        <span className="text-topo">{"{"}</span>
        {entries.length === 0 ? (
          <span className="block pl-4 text-topo">
            {"// start typing — your passport builds here"}
          </span>
        ) : (
          entries.map(([key, value], i) => (
            <span key={key as string} className="block pl-4">
              <span className="text-ember-tint">&quot;{key as string}&quot;</span>
              <span className="text-topo">: </span>
              {Array.isArray(value) ? (
                <>
                  <span className="text-topo">[</span>
                  {value.length > 0 && (
                    <span className="block pl-4">
                      {value.map((v, j) => (
                        <span key={`${key}-${j}`} className="block">
                          <span className="rounded-sm bg-ember/35 px-1 text-paper">
                            &quot;{String(v)}&quot;
                          </span>
                          {j < value.length - 1 ? (
                            <span className="text-topo">,</span>
                          ) : null}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="text-topo">]</span>
                </>
              ) : (
                <span className="rounded-sm bg-ember/35 px-1 text-paper">
                  &quot;{String(value)}&quot;
                </span>
              )}
              {i < entries.length - 1 ? (
                <span className="text-topo">,</span>
              ) : null}
            </span>
          ))
        )}
        <span className="block text-topo">{"}"}</span>
      </pre>
      <footer className="border-t border-paper/15 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-topo">
        same passport, served as JSON to agents →{" "}
        <span className="text-ember-tint">/api/v1/founder-passports/&lt;id&gt;</span>
      </footer>
    </div>
  );
}
