// Map sector vocabulary from the seed CSV to brand sector palette
// hex values. Keep in sync with `--color-sector-*` in
// `app/globals.css`. Unknown sectors fall back to the topo neutral.

export const SECTOR_COLORS: Record<string, string> = {
  FinTech: "#16a34a",
  "B2B Software": "#2563eb",
  Marketplaces: "#0891b2",
  "Bio/Medical Tech": "#dc2626",
  Energy: "#ea580c",
  Consumer: "#db2777",
  Security: "#475569",
};

export const FALLBACK_SECTOR_COLOR = "#a89a78";

export function colorForSector(sector: string | null | undefined): string {
  if (!sector) return FALLBACK_SECTOR_COLOR;
  return SECTOR_COLORS[sector] ?? FALLBACK_SECTOR_COLOR;
}
