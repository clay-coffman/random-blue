// Test user fixtures. These are dev-only accounts seeded for E2E testing
// of the auth + claim + admin flows. Real users sign up via Better Auth's
// emailOTP plugin at runtime; the seed mirrors that — `account` rows
// only exist for OAuth providers (none yet), so seed users have no
// `account` row and sign in via OTP delivered to mailpit.

export type Role =
  | "founder"
  | "owner"
  | "investor"
  | "goeo_admin"
  | "superadmin";

export type TestUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export const testUsers: TestUser[] = [
  // 6 owners, one per persona.
  { id: "u_jordan", email: "jordan@persona.test", name: "Jordan Reyes", role: "owner" },
  { id: "u_maria", email: "maria@persona.test", name: "Maria Alvarez", role: "owner" },
  { id: "u_marcus", email: "marcus@persona.test", name: "Marcus Thomas", role: "owner" },
  { id: "u_priya", email: "priya@persona.test", name: "Priya Patel", role: "owner" },
  { id: "u_david", email: "david@persona.test", name: "David Nakamura", role: "owner" },
  { id: "u_amir", email: "amir@persona.test", name: "Dr. Amir Rahimi", role: "owner" },
  // GOEO admin (reviews ownership submissions, edits any company).
  { id: "u_admin", email: "admin@goed.test", name: "Sarah Chen (GOEO)", role: "goeo_admin" },
  // Superadmin (full system access).
  { id: "u_super", email: "super@startup-state-atlas.test", name: "Atlas Superadmin", role: "superadmin" },
  // Investors — each tied to one investor_profiles row (firm/affiliation).
  // Phase 4 test-fixture seed: gives the admin user table representative
  // investor rows on day one, and lets the map filter chips have real
  // preferences to dogfood once Phase 5 wires personalization.
  { id: "u_pelion", email: "deals@pelion.test", name: "D. Ortiz (Pelion)", role: "investor" },
  { id: "u_slangels", email: "scout@slangels.test", name: "Casey Lin (SL Angels)", role: "investor" },
  { id: "u_kickstart", email: "partner@kickstart.test", name: "Sam Patel (Kickstart)", role: "investor" },
];

export const TEST_USER_IDS = testUsers.map((u) => u.id);
