export type Persona = {
  id: string;
  passportId: string;
  displayName: string;
  location: string;
  oneLiner: string;
};

export const personas: readonly Persona[] = [
  {
    id: "jordan",
    passportId: "fp_jordan",
    displayName: "Jordan, 20",
    location: "Salt Lake City",
    oneLiner:
      "Pre-seed founder with an idea but no business yet. Looking for resources to take his first steps.",
  },
  {
    id: "maria",
    passportId: "fp_maria",
    displayName: "Maria, 38",
    location: "Washington County",
    oneLiner:
      "Running a small agricultural operation near St. George. Rural, woman-owned, looking to scale.",
  },
  {
    id: "marcus",
    passportId: "fp_marcus",
    displayName: "Marcus, 34",
    location: "Ogden (Weber County)",
    oneLiner:
      "Left the military and is starting a custom fabrication and manufacturing business. Veteran, early-stage.",
  },
  {
    id: "priya",
    passportId: "fp_priya",
    displayName: "Priya, 31",
    location: "Salt Lake City",
    oneLiner:
      "B2B SaaS founder, 18 months in, paying customers, ready to raise her first venture round. Specifically looking for angel groups and VCs.",
  },
  {
    id: "david",
    passportId: "fp_david",
    displayName: "David, 45",
    location: "Provo (Utah County)",
    oneLiner:
      "Medical device company, 12 employees, FDA cleared. Looking to expand to international markets. Growth stage, established business.",
  },
  {
    id: "amir",
    passportId: "fp_amir",
    displayName: "Dr. Amir, 29",
    location: "Salt Lake City",
    oneLiner:
      "PhD candidate at the University of Utah developing a novel technology. Wants to commercialize his research and found a company. Has never started a business before.",
  },
] as const;

export const personaById = (id: string): Persona | undefined =>
  personas.find((p) => p.id === id);
