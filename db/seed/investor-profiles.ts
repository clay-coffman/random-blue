// Three demo investor_profiles rows, one per investor test user.
// Phase 4 seed — gives the admin user table + future map filter chips
// representative investor preferences on day one.

export type InvestorProfileSeed = {
  id: string;
  userId: string;
  firmName: string;
  investorType: string;
  stages: string[];
  sectors: string[];
  checkSizeMin: number;
  checkSizeMax: number;
  geoFocus: string[];
};

export const investorProfiles: InvestorProfileSeed[] = [
  {
    id: "inv_pelion",
    userId: "u_pelion",
    firmName: "Pelion Ventures",
    investorType: "vc",
    stages: ["seed", "series_a"],
    sectors: ["b2b_saas", "fintech", "ai"],
    checkSizeMin: 500_000,
    checkSizeMax: 3_000_000,
    geoFocus: ["wasatch_front", "statewide"],
  },
  {
    id: "inv_slangels",
    userId: "u_slangels",
    firmName: "Salt Lake Angels",
    investorType: "angel",
    stages: ["pre_seed", "seed"],
    sectors: ["b2b_saas", "consumer", "ai"],
    checkSizeMin: 25_000,
    checkSizeMax: 250_000,
    geoFocus: ["wasatch_front"],
  },
  {
    id: "inv_kickstart",
    userId: "u_kickstart",
    firmName: "Kickstart Fund",
    investorType: "vc",
    stages: ["seed"],
    sectors: ["b2b_saas", "fintech", "consumer", "energy"],
    checkSizeMin: 250_000,
    checkSizeMax: 1_500_000,
    geoFocus: ["wasatch_front", "statewide", "national"],
  },
];
