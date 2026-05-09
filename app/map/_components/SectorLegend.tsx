"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Tile } from "@/components/brand";
import { SECTOR_REGISTRY, sectorKey } from "@/lib/sectors";
import { cn } from "@/lib/utils";

// Bottom-left legend tile. Highlights any sectors that match the
// active filter; greys others out.
export function SectorLegend() {
  const params = useSearchParams();
  // Compare on sector key (not raw CSV) so "Life Sciences" filters
  // light up the deduplicated "Bio / Medical Tech" row — both map to
  // the `bio` brand token.
  const filteredKeys = useMemo(() => {
    const set = new Set<string>();
    const sector = params.get("sector");
    if (sector) set.add(sectorKey(sector));
    const sectors = params.get("sectors");
    if (sectors)
      for (const s of sectors.split(",").map((x) => x.trim()).filter(Boolean))
        set.add(sectorKey(s));
    return set;
  }, [params]);

  // Distinct sector entries (collapse "Marketplaces" etc. to first by key).
  const distinct = useMemo(() => {
    const seen = new Set<string>();
    return SECTOR_REGISTRY.filter((s) => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    });
  }, []);

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden sm:block">
      <Tile
        variant="default"
        shadow="sketch"
        className="pointer-events-auto p-2 sm:p-3"
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Sector
        </p>
        <ul className="mt-1.5 space-y-1">
          {distinct.map((s) => {
            const dim = filteredKeys.size > 0 && !filteredKeys.has(s.key);
            return (
              <li
                key={s.key}
                className={cn("flex items-center gap-2 text-[11px]", dim && "opacity-30")}
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: s.hex }}
                />
                <span className="font-mono uppercase tracking-wider text-ink-2">
                  {s.display}
                </span>
              </li>
            );
          })}
        </ul>
      </Tile>
    </div>
  );
}
