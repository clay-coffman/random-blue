// One-shot script: flip an existing user's role to 'superadmin'.
// Usage:  npm run bootstrap-superadmin <email> [-- --remote]
//
// Default target is the local D1 (per-worktree). Pass --remote to
// flip the role on the production D1.
//
// This is the ONLY way to mint a superadmin. Document in the PR
// description so the project lead knows to run it after the first
// GOEO staff sign-up on prod.

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const email = args.find((a) => !a.startsWith("--"));

if (!email) {
  console.error("Usage: npm run bootstrap-superadmin <email> [-- --remote]");
  process.exit(2);
}

if (!email.includes("@")) {
  console.error(`"${email}" doesn't look like an email.`);
  process.exit(2);
}

// Escape single quotes for SQL literal (light defense; the email
// passed by a project owner is trusted).
const safeEmail = email.replace(/'/g, "''");

const sql = `UPDATE user SET role = 'superadmin', updated_at = unixepoch() * 1000 WHERE email = '${safeEmail}';`;
const target = remote ? "--remote" : "--local";
const cmd = `npx wrangler d1 execute startup-state-atlas-db ${target} --command "${sql}" --json`;

console.log(`→ ${cmd}`);

let raw: string;
try {
  raw = execSync(cmd, { encoding: "utf8" });
} catch (err) {
  console.error(
    "wrangler d1 execute failed:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}

// wrangler --json prints an array of result objects.
try {
  const parsed = JSON.parse(raw) as Array<{
    results?: unknown[];
    meta?: { changes?: number; rows_written?: number };
  }>;
  const changed =
    parsed[0]?.meta?.changes ?? parsed[0]?.meta?.rows_written ?? 0;
  if (changed === 0) {
    console.error(
      `\nNo rows updated. Has ${email} signed up yet on the ${
        remote ? "remote" : "local"
      } D1?`,
    );
    process.exit(1);
  }
  console.log(`\n✓ ${email} is now a superadmin (${changed} row(s) updated).`);
} catch {
  console.log(raw);
  console.log(
    `\n(Couldn't parse wrangler --json output; check above for affected rows.)`,
  );
}
