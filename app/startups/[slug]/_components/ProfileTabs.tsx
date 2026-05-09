"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTION_ID_BY_LABEL: Record<string, string> = {
  Overview: "overview",
  Facts: "facts",
  "Open roles": "open-roles",
  Gallery: "gallery",
  Map: "map",
};

type ProfileTabsProps = {
  sections: string[];
  jobsCount: number;
};

export function ProfileTabs({ sections, jobsCount }: ProfileTabsProps) {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const ids = sections
      .map((s) => SECTION_ID_BY_LABEL[s])
      .filter((id): id is string => Boolean(id));

    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry that is most visible / topmost in view.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Trigger when section's top is roughly under the sticky tab bar
      // and stays in view through ~half the viewport.
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-0 z-30 -mx-4 mt-6 border-b border-ink/15 bg-paper/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-paper/80 sm:-mx-7 sm:px-7"
    >
      <ul className="flex gap-1 overflow-x-auto py-2 sm:gap-3">
        {sections.map((label) => {
          const id = SECTION_ID_BY_LABEL[label] ?? label.toLowerCase();
          const isActive = active === id;
          const display =
            label === "Open roles" ? `Open roles · ${jobsCount}` : label;
          return (
            <li key={label} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-10 min-h-[44px] items-center rounded-pill border-[1.5px] px-3 font-mono text-[11px] uppercase tracking-wider transition",
                  isActive
                    ? "border-ink bg-ink text-paper"
                    : "border-transparent text-ink-3 hover:border-ink/30 hover:bg-paper-2 hover:text-ink-2",
                )}
              >
                {display}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
