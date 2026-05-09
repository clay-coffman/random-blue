// Single source-of-truth for sector vocabulary, colors, and display
// names. The CSV's `Section` column drives the canonical strings; we
// map each to one of 8 brand sector tokens (paper/ink/ember palette in
// app/globals.css). Anything unmapped falls back to ink-3 neutral so
// the map / chips never crash on a new vocabulary item.

export type SectorKey =
  | "fintech"
  | "saas"
  | "ai"
  | "aerospace"
  | "bio"
  | "energy"
  | "consumer"
  | "security";

type SectorEntry = {
  /** Canonical sector string as it appears in the seed (CSV Section col). */
  csv: string;
  key: SectorKey;
  display: string;
  /** Hex literal for MapLibre `circle-color` paint. Mirrors the CSS var. */
  hex: string;
  /** Tailwind class for chips/legend dots. */
  chipClass: string;
};

// Brand sector palette (mirrors --color-sector-* CSS vars in
// app/globals.css). MapLibre paint expressions can't read CSS vars at
// parse time, so we keep hex literals here as the source of truth.
const HEX = {
  fintech: "#16a34a",
  saas: "#2563eb",
  ai: "#0891b2",
  aerospace: "#7c3aed",
  bio: "#dc2626",
  energy: "#ea580c",
  consumer: "#db2777",
  security: "#475569",
} as const satisfies Record<SectorKey, string>;

// Maps every CSV vocabulary item we know about to a sector key.
// New rows in the seed: add an entry here. Unknown sectors fall
// back to FALLBACK_HEX / FALLBACK_CHIP.
export const SECTOR_REGISTRY: SectorEntry[] = [
  {
    csv: "FinTech",
    key: "fintech",
    display: "FinTech",
    hex: HEX.fintech,
    chipClass: "bg-[--color-sector-fintech]/15 text-[--color-sector-fintech]",
  },
  {
    csv: "B2B Software",
    key: "saas",
    display: "B2B Software",
    hex: HEX.saas,
    chipClass: "bg-[--color-sector-saas]/15 text-[--color-sector-saas]",
  },
  {
    csv: "AI",
    key: "ai",
    display: "AI",
    hex: HEX.ai,
    chipClass: "bg-[--color-sector-ai]/15 text-[--color-sector-ai]",
  },
  {
    csv: "Aerospace and Defense",
    key: "aerospace",
    display: "Aerospace & Defense",
    hex: HEX.aerospace,
    chipClass:
      "bg-[--color-sector-aerospace]/15 text-[--color-sector-aerospace]",
  },
  {
    csv: "Bio/Medical Tech",
    key: "bio",
    display: "Bio / Medical Tech",
    hex: HEX.bio,
    chipClass: "bg-[--color-sector-bio]/15 text-[--color-sector-bio]",
  },
  {
    csv: "Life Sciences",
    key: "bio",
    display: "Life Sciences",
    hex: HEX.bio,
    chipClass: "bg-[--color-sector-bio]/15 text-[--color-sector-bio]",
  },
  {
    csv: "Health",
    key: "bio",
    display: "Health",
    hex: HEX.bio,
    chipClass: "bg-[--color-sector-bio]/15 text-[--color-sector-bio]",
  },
  {
    csv: "Energy",
    key: "energy",
    display: "Energy",
    hex: HEX.energy,
    chipClass: "bg-[--color-sector-energy]/15 text-[--color-sector-energy]",
  },
  {
    csv: "Consumer",
    key: "consumer",
    display: "Consumer",
    hex: HEX.consumer,
    chipClass:
      "bg-[--color-sector-consumer]/15 text-[--color-sector-consumer]",
  },
  {
    csv: "Marketplaces",
    key: "consumer",
    display: "Marketplaces",
    hex: HEX.consumer,
    chipClass:
      "bg-[--color-sector-consumer]/15 text-[--color-sector-consumer]",
  },
  {
    csv: "Security",
    key: "security",
    display: "Security",
    hex: HEX.security,
    chipClass:
      "bg-[--color-sector-security]/15 text-[--color-sector-security]",
  },
];

export const FALLBACK_HEX = "#5a6678";
export const FALLBACK_CHIP_CLASS = "bg-[--color-ink-3]/12 text-[--color-ink-2]";

const REGISTRY_BY_CSV = new Map(SECTOR_REGISTRY.map((s) => [s.csv, s]));

/** Hex literal for MapLibre `circle-color`. Falls back to neutral ink-3. */
export function sectorHex(sector: string | null | undefined): string {
  if (!sector) return FALLBACK_HEX;
  return REGISTRY_BY_CSV.get(sector)?.hex ?? FALLBACK_HEX;
}

/** Tailwind class for sector chips and legend dots. */
export function sectorChipClass(sector: string | null | undefined): string {
  if (!sector) return FALLBACK_CHIP_CLASS;
  return REGISTRY_BY_CSV.get(sector)?.chipClass ?? FALLBACK_CHIP_CLASS;
}

/** Display-friendly version of the sector string. */
export function sectorDisplayName(sector: string | null | undefined): string {
  if (!sector) return "Other";
  return REGISTRY_BY_CSV.get(sector)?.display ?? sector;
}

/** Sector key (one of 8 brand tokens) — used for cluster property aggregation. */
export function sectorKey(
  sector: string | null | undefined,
): SectorKey | "other" {
  if (!sector) return "other";
  return REGISTRY_BY_CSV.get(sector)?.key ?? "other";
}

/** Distinct CSV vocabulary, ready to drive a filter dropdown. */
export const KNOWN_SECTORS = SECTOR_REGISTRY.map((s) => s.csv);

/**
 * MapLibre `match` paint expression input — flat array of
 * `[csv, hex, csv, hex, …, fallback]`. Use as:
 *   ['match', ['get', 'sector'], ...SECTOR_PAINT_MATCH]
 */
export const SECTOR_PAINT_MATCH: (string | number)[] = [
  ...SECTOR_REGISTRY.flatMap((s) => [s.csv, s.hex]),
  FALLBACK_HEX,
];
