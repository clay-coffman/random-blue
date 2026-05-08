// Test user fixtures. These are dev-only accounts seeded for E2E testing
// of the auth + claim + admin flows. Real users sign up via Better Auth's
// email/password flow at runtime.
//
// All test users share the same dev password (TEST_PASSWORD); see
// db/seed/README.md for the full list.

import { hashPassword } from "better-auth/crypto";

export type Role = "owner" | "goeo_admin" | "superadmin";

export type TestUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export const TEST_PASSWORD = "passport123";

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
];

export const TEST_USER_IDS = testUsers.map((u) => u.id);

export type SeededAccount = {
  id: string;
  userId: string;
  passwordHash: string;
};

// Generates one Better Auth `account` row per user with a credential-provider
// password using the same scrypt-derived hash that auth.api.signInEmail
// will validate at runtime.
export async function buildAccounts(): Promise<SeededAccount[]> {
  const passwordHash = await hashPassword(TEST_PASSWORD);
  return testUsers.map((u, i) => ({
    id: `acct_${u.id.slice(2)}`,
    userId: u.id,
    passwordHash,
  }));
}
