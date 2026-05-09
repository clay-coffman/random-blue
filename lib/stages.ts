// Single source-of-truth for stage vocabulary. The seed loader at
// db/seed/companies.ts lowercases the CSV `Stage` column on write,
// so the canonical form on the wire and in D1 is the lowercase
// strings below. The /api/v1/companies filter (lib/company-filters.ts)
// and the /map sidebar both match against these exact values.

export const STAGE_VALUES = [
  "bootstrapped",
  "pre-seed",
  "seed",
  "series a",
  "series b",
  "series c",
  "series d+",
] as const;

export type Stage = (typeof STAGE_VALUES)[number];

const DISPLAY: Record<Stage, string> = {
  bootstrapped: "Bootstrapped",
  "pre-seed": "Pre-Seed",
  seed: "Seed",
  "series a": "Series A",
  "series b": "Series B",
  "series c": "Series C",
  "series d+": "Series D+",
};

export function stageDisplayName(stage: string | null | undefined): string {
  if (!stage) return "—";
  return DISPLAY[stage as Stage] ?? stage;
}

export function isKnownStage(s: string): s is Stage {
  return (STAGE_VALUES as readonly string[]).includes(s);
}
