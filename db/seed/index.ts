import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { personas } from "./personas";
import { loadResources } from "./resources";
import { loadCompanies } from "./companies";
import { buildAccounts, testUsers, TEST_USER_IDS } from "./users";

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

  // ─── Wipe seed-owned rows (scoped) ─────────────────────────────────
  // Anything below is regenerated on every seed. Scoped DELETEs preserve
  // any real users / sessions / submissions that may exist in production.
  const ids = sqlList(TEST_USER_IDS);
  stmts.push(`DELETE FROM session WHERE user_id IN (${ids});`);
  stmts.push(`DELETE FROM account WHERE user_id IN (${ids});`);
  // Children of test users (passports linked to them) clear via SET NULL FK.
  // We also wipe seeded passports unconditionally below.
  stmts.push(`DELETE FROM "user" WHERE id IN (${ids});`);

  stmts.push("DELETE FROM resource_topics;");
  stmts.push("DELETE FROM resource_communities;");
  stmts.push("DELETE FROM resource_industries;");
  stmts.push("DELETE FROM resource_locations;");
  stmts.push("DELETE FROM resources;");
  stmts.push("DELETE FROM company_locations;");
  stmts.push("DELETE FROM companies;");
  stmts.push("DELETE FROM founder_passports;");

  // ─── Test users + accounts ─────────────────────────────────────────
  const accounts = await buildAccounts();
  for (const u of testUsers) {
    stmts.push(
      `INSERT INTO "user" (id, name, email, email_verified, image, role, created_at, updated_at) VALUES (${sqlString(u.id)}, ${sqlString(u.name)}, ${sqlString(u.email)}, 1, NULL, ${sqlString(u.role)}, unixepoch() * 1000, unixepoch() * 1000);`,
    );
  }
  for (const a of accounts) {
    stmts.push(
      `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${sqlString(a.id)}, ${sqlString(a.userId)}, 'credential', ${sqlString(a.userId)}, ${sqlString(a.passwordHash)}, unixepoch() * 1000, unixepoch() * 1000);`,
    );
  }

  // ─── Personas (passports owned by test users) ──────────────────────
  for (const p of personas) {
    stmts.push(
      `INSERT INTO founder_passports (id, user_id, county, city, stage, industry, communities_json, goal, urgency, business_size, needs_json, constraints_json, created_at) VALUES (${sqlString(p.id)}, ${sqlString(p.userId)}, ${sqlString(p.county)}, ${sqlString(p.city)}, ${sqlString(p.stage)}, ${sqlString(p.industry)}, ${sqlString(JSON.stringify(p.communities))}, ${sqlString(p.goal)}, ${sqlString(p.urgency)}, ${sqlString(p.businessSize)}, ${sqlString(JSON.stringify(p.needs))}, ${sqlString(JSON.stringify(p.constraints))}, unixepoch());`,
    );
  }

  // ─── Resources ─────────────────────────────────────────────────────
  const resources = loadResources(RESOURCES_CSV);
  for (const r of resources) {
    stmts.push(
      `INSERT INTO resources (id, title, description, source_url, kind, contact_email, last_updated_at) VALUES (${sqlString(r.id)}, ${sqlString(r.title)}, ${sqlString(r.description)}, ${sqlString(r.sourceUrl)}, ${sqlString(r.kind)}, ${sqlString(r.contactEmail)}, unixepoch());`,
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

  // ─── Companies ─────────────────────────────────────────────────────
  const companies = loadCompanies(COMPANIES_CSV);
  for (const c of companies) {
    stmts.push(
      `INSERT INTO companies (id, slug, name, website, description, sector, stage, employee_count, hiring_status, founding_year, linkedin, logo_url, founder_team_json, address_text, lat, lng, verified_at, claimed_at, claimed_by_user_id, last_updated_by, last_updated_at) VALUES (${sqlString(c.id)}, ${sqlString(c.slug)}, ${sqlString(c.name)}, ${sqlString(c.website)}, ${sqlString(c.description)}, ${sqlString(c.sector)}, ${sqlString(c.stage)}, ${sqlString(c.employeeCount)}, 0, NULL, ${sqlString(c.linkedin)}, NULL, NULL, ${sqlString(c.addressText)}, ${sqlNum(c.lat)}, ${sqlNum(c.lng)}, NULL, NULL, NULL, NULL, NULL);`,
    );
    if (c.city || c.county) {
      stmts.push(
        `INSERT INTO company_locations (company_id, county, city) VALUES (${sqlString(c.id)}, ${sqlString(c.county)}, ${sqlString(c.city)});`,
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

  applyChunk(tmp);

  fs.unlinkSync(tmp);
  console.log("✅ Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
