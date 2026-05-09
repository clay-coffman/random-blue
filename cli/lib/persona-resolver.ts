// The 6 seeded personas. Their canonical ids are `fp_<name>` so the
// CLI's `--persona <name>` shortcut maps directly to a passport id
// without re-creating the row.
//
// Source of truth: db/seed/personas.ts. Keep this list in sync.

export const PERSONA_NAMES = [
  "jordan",
  "maria",
  "marcus",
  "priya",
  "david",
  "amir",
] as const;

export type PersonaName = (typeof PERSONA_NAMES)[number];

const PERSONA_SET = new Set<string>(PERSONA_NAMES);

export function isPersona(name: string): name is PersonaName {
  return PERSONA_SET.has(name);
}

export function resolvePersona(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (!isPersona(trimmed)) {
    throw new Error(
      `Unknown persona "${name}". Valid: ${PERSONA_NAMES.join(", ")}.`,
    );
  }
  return `fp_${trimmed}`;
}
