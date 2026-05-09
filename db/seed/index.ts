import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { personas } from "./personas";
import { loadResources } from "./resources";
import { loadCompanies } from "./companies";
import { testUsers } from "./users";
import { investorProfiles } from "./investor-profiles";

const SOURCE = path.resolve(process.cwd(), "docs/source_data");
const RESOURCES_CSV = path.join(
  SOURCE,
  "Resources List - Builder Day - Sheet1.csv",
);
const COMPANIES_CSV = path.join(
  SOURCE,
  // Note the DOUBLE space between "Day" and "-".
  "Map Data for Builder Day  - Sheet1.csv",
);

const remote = process.argv.includes("--remote");
const target = remote ? "--remote" : "--local";

function sqlString(v: string | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

function sqlNum(v: number | null | undefined): string {
  return v === null || v === undefined ? "NULL" : String(v);
}

function sqlBool(v: boolean): string {
  return v ? "1" : "0";
}

function sqlList(items: string[]): string {
  return items.map(sqlString).join(", ");
}

async function buildSql(): Promise<string> {
  const stmts: string[] = [];

  stmts.push("PRAGMA foreign_keys = ON;");

  // ─── Scoped wipes — preserve real user data ────────────────────────
  // Test users are UPSERTed below (not deleted) so their downstream rows
  // —ownership submissions, profile updates, claimed companies, sessions
  // — survive re-seeds. This matters for E2E testing: when the dev team
  // signs in as a persona and exercises the claim flow, their state
  // persists across `npm run seed` invocations.
  //
  // Personas: scoped to the canonical persona IDs so real founders'
  // passports (created via the intake at runtime) are preserved. The
  // cascade to `recommendations` is acceptable here because seeded recs
  // are derived from the persona passports themselves; real users keep
  // their cached recs.
  const personaIds = sqlList(personas.map((p) => p.id));
  stmts.push(`DELETE FROM founder_passports WHERE id IN (${personaIds});`);

  // Resources are entirely seed-owned (no runtime path adds them).
  // Bulk delete is safe; cascade to `recommendations` is acceptable
  // because recs are derived/cached and recompute on next GET.
  stmts.push("DELETE FROM resource_topics;");
  stmts.push("DELETE FROM resource_communities;");
  stmts.push("DELETE FROM resource_industries;");
  stmts.push("DELETE FROM resource_locations;");
  stmts.push("DELETE FROM resources;");

  // company_locations is seed-owned. Bulk delete; companies themselves
  // are NOT deleted (UPSERT below) so business_ownership_submissions,
  // profile_updates, company_jobs, and company_photos are preserved.
  stmts.push("DELETE FROM company_locations;");

  // ─── Test users (UPSERT — preserves downstream rows) ───────────────
  // First run: INSERT. Subsequent runs: refresh name/email/role +
  // emailVerified, leaving timestamps alone so existing sessions stay
  // valid. Seeded users sign in via emailOTP delivered to mailpit; no
  // `account` rows are needed (those only exist for OAuth providers).
  for (const u of testUsers) {
    stmts.push(
      `INSERT INTO "user" (id, name, email, email_verified, image, role, created_at, updated_at) VALUES (${sqlString(u.id)}, ${sqlString(u.name)}, ${sqlString(u.email)}, 1, NULL, ${sqlString(u.role)}, unixepoch() * 1000, unixepoch() * 1000) ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email, role=excluded.role, updated_at=excluded.updated_at;`,
    );
  }
  // Clear vestigial credential `account` rows from older seed runs,
  // scoped to the seeded test user IDs so a `--remote` run can't wipe
  // any real human's credential row that may still be on prod from
  // before the OTP-only migration.
  const testUserIdList = sqlList(testUsers.map((u) => u.id));
  stmts.push(
    `DELETE FROM account WHERE provider_id = 'credential' AND user_id IN (${testUserIdList});`,
  );

  // ─── Investor profiles (UPSERT keyed by user_id) ───────────────────
  // Tied to investor test users seeded above.
  for (const ip of investorProfiles) {
    stmts.push(
      `INSERT INTO investor_profiles (id, user_id, firm_name, investor_type, stages_json, sectors_json, check_size_min, check_size_max, geo_focus_json, created_at, updated_at) VALUES (${sqlString(ip.id)}, ${sqlString(ip.userId)}, ${sqlString(ip.firmName)}, ${sqlString(ip.investorType)}, ${sqlString(JSON.stringify(ip.stages))}, ${sqlString(JSON.stringify(ip.sectors))}, ${sqlNum(ip.checkSizeMin)}, ${sqlNum(ip.checkSizeMax)}, ${sqlString(JSON.stringify(ip.geoFocus))}, unixepoch() * 1000, unixepoch() * 1000) ON CONFLICT(user_id) DO UPDATE SET firm_name=excluded.firm_name, investor_type=excluded.investor_type, stages_json=excluded.stages_json, sectors_json=excluded.sectors_json, check_size_min=excluded.check_size_min, check_size_max=excluded.check_size_max, geo_focus_json=excluded.geo_focus_json, updated_at=excluded.updated_at;`,
    );
  }

  // ─── Personas (passports owned by test users) ──────────────────────
  for (const p of personas) {
    stmts.push(
      `INSERT INTO founder_passports (id, user_id, county, city, stage, industry, communities_json, goal, urgency, business_size, needs_json, constraints_json, created_at) VALUES (${sqlString(p.id)}, ${sqlString(p.userId)}, ${sqlString(p.county)}, ${sqlString(p.city)}, ${sqlString(p.stage)}, ${sqlString(p.industry)}, ${sqlString(JSON.stringify(p.communities))}, ${sqlString(p.goal)}, ${sqlString(p.urgency)}, ${sqlString(p.businessSize)}, ${sqlString(JSON.stringify(p.needs))}, ${sqlString(JSON.stringify(p.constraints))}, unixepoch() * 1000);`,
    );
  }

  // ─── Resources (UPSERT keyed by id; CSV-derived columns refresh) ───
  const resources = loadResources(RESOURCES_CSV);
  for (const r of resources) {
    stmts.push(
      `INSERT INTO resources (id, title, description, source_url, kind, contact_email, last_updated_at) VALUES (${sqlString(r.id)}, ${sqlString(r.title)}, ${sqlString(r.description)}, ${sqlString(r.sourceUrl)}, ${sqlString(r.kind)}, ${sqlString(r.contactEmail)}, unixepoch() * 1000) ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description, source_url=excluded.source_url, kind=excluded.kind, contact_email=excluded.contact_email, last_updated_at=excluded.last_updated_at;`,
    );
    for (const loc of r.locations) {
      stmts.push(
        `INSERT INTO resource_locations (resource_id, county, city, statewide) VALUES (${sqlString(r.id)}, ${sqlString(loc.county)}, ${sqlString(loc.city)}, ${sqlBool(loc.statewide)});`,
      );
    }
    for (const ind of r.industries) {
      stmts.push(
        `INSERT INTO resource_industries (resource_id, industry) VALUES (${sqlString(r.id)}, ${sqlString(ind)});`,
      );
    }
    for (const com of r.communities) {
      stmts.push(
        `INSERT INTO resource_communities (resource_id, community) VALUES (${sqlString(r.id)}, ${sqlString(com)});`,
      );
    }
    for (const t of r.topics) {
      stmts.push(
        `INSERT INTO resource_topics (resource_id, topic) VALUES (${sqlString(r.id)}, ${sqlString(t)});`,
      );
    }
  }

  // ─── Companies (UPSERT keyed by slug — preserves user-set columns) ─
  // CSV columns refresh on conflict; user-set columns (claimed_*, verified_*,
  // last_updated_*, founder_team_json, logo_url, hiring_status) stay
  // untouched. Re-runs are non-destructive even after Agent 5 lands.
  const companies = loadCompanies(COMPANIES_CSV);
  for (const c of companies) {
    stmts.push(
      `INSERT INTO companies (id, slug, name, website, description, sector, stage, employee_count, hiring_status, founding_year, linkedin, logo_url, founder_team_json, address_text, lat, lng, verified_at, claimed_at, claimed_by_user_id, last_updated_by, last_updated_at) VALUES (${sqlString(c.id)}, ${sqlString(c.slug)}, ${sqlString(c.name)}, ${sqlString(c.website)}, ${sqlString(c.description)}, ${sqlString(c.sector)}, ${sqlString(c.stage)}, ${sqlString(c.employeeCount)}, 0, NULL, ${sqlString(c.linkedin)}, NULL, NULL, ${sqlString(c.addressText)}, ${sqlNum(c.lat)}, ${sqlNum(c.lng)}, NULL, NULL, NULL, NULL, NULL) ON CONFLICT(slug) DO UPDATE SET name=excluded.name, website=excluded.website, description=excluded.description, sector=excluded.sector, stage=excluded.stage, employee_count=excluded.employee_count, linkedin=excluded.linkedin, address_text=excluded.address_text, lat=excluded.lat, lng=excluded.lng;`,
    );
    if (c.city || c.county) {
      // Use SELECT so we attach to whatever id the row currently has —
      // either the freshly-minted one (first run) or the existing one
      // preserved by UPSERT (subsequent runs).
      stmts.push(
        `INSERT INTO company_locations (company_id, county, city) SELECT id, ${sqlString(c.county)}, ${sqlString(c.city)} FROM companies WHERE slug = ${sqlString(c.slug)};`,
      );
    }
  }

  return stmts.join("\n");
}

function applyChunk(sqlPath: string) {
  const cmd = `npx wrangler d1 execute startup-state-atlas-db ${target} --file ${JSON.stringify(sqlPath)} --yes`;
  console.log(`→ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

async function main() {
  if (!fs.existsSync(RESOURCES_CSV)) {
    throw new Error(`Resources CSV not found at ${RESOURCES_CSV}`);
  }
  if (!fs.existsSync(COMPANIES_CSV)) {
    throw new Error(`Companies CSV not found at ${COMPANIES_CSV}`);
  }

  const sql = await buildSql();
  const tmp = path.join(os.tmpdir(), `seed-${Date.now()}.sql`);
  fs.writeFileSync(tmp, sql);
  const lineCount = sql.split("\n").length;
  console.log(
    `Built ${lineCount} SQL statements (${(sql.length / 1024).toFixed(1)} KB) → ${tmp}`,
  );
  console.log(`Applying to ${remote ? "remote" : "local"} D1…`);

  try {
    applyChunk(tmp);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
  console.log("✅ Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
