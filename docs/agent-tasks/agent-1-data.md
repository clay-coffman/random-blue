# Agent 1 — Data layer

You define the schema, generate the initial migration, write the
seeders, and **freeze the schema for everyone else**. Aim for ~60–90
minutes.

## Branch + worktree

- **Worktree:** `wt1` (continuation from Agent 0) or `wt2`.
- **Branch:** `feat/data`. First action: `git checkout -b feat/data`
  (from `feat/bootstrap` if that PR isn't merged yet, or from `main`
  if it is).

## Reads first

1. `docs/agent-tasks/00-shared-context.md`
2. `docs/architecture.md` — repo layout + bindings.
3. `docs/requirements.md` — personas + entities.
4. `docs/hackathon-plan.md` lines 540–560 (table list) for the full
   table inventory.
5. Drizzle's D1 docs (via `cloudflare:wrangler` skill) — SQLite
   types, FTS5, JSON columns.

## Depends on

**Agent 0 must be done.** Verify:

- `wrangler.jsonc` has the `DB` binding.
- `drizzle.config.ts` exists.
- `lib/db.ts` exists.
- `npm run db:generate` and `npm run db:migrate:local` are wired.

If any of those are missing, push back to Agent 0 — don't paper over
it.

## Owns (write surface)

- `db/schema.ts` — **FROZEN at end of this brief**. No other agent
  may modify this file.
- `db/migrations/0000_*.sql` — generated.
- `db/seed/index.ts`, `db/seed/personas.ts`, `db/seed/resources.ts`,
  `db/seed/companies.ts`.
- `db/seed/data/.gitkeep` (CSVs are gitignored — user drops them in).

## Deliverables

### 1. `db/schema.ts` — full schema with forward-looking columns

Define every table with Drizzle's SQLite syntax. **Include
forward-looking columns that other agents will need** so you don't
have to evolve the schema later under merge pressure.

You write **two groups** of tables: app-domain tables (you author
by hand) and **Better Auth** tables (you generate via the
`@better-auth/cli` against an `auth.ts` stub).

#### 1a. App-domain tables (12 total)

```ts
// Resources
resources                    // id (r_*), title, description, source_url, kind, last_updated_at
resource_locations           // resource_id, county, city, statewide (bool)
resource_industries          // resource_id, industry
resource_communities         // resource_id, community  (rural, women, veteran, …)
resource_topics              // resource_id, topic     (funding, mentoring, training, …)

// Companies
companies                    // id (co_*), slug, name, website, description, sector, stage,
                             // employee_count, hiring_status, founding_year, linkedin,
                             // logo_url, founder_team_json, address_text, lat, lng,
                             // verified_at, claimed_at, claimed_by_user_id (fk -> user.id),
                             // last_updated_by, last_updated_at,
                             // embedding (BLOB nullable, future use)
company_locations            // company_id, county, city
company_jobs                 // id, company_id, title, url, posted_at
company_photos               // id, company_id, r2_key, caption, sort_order

// Founder passports
founder_passports            // id (fp_*), county, city, stage, industry, communities_json,
                             // goal, urgency, business_size, needs_json, constraints_json,
                             // created_at

// Recommendations (cached)
recommendations              // id (rec_*), passport_id, resource_id, score, reasons_json,
                             // action_text, bucket (now/next/ignore), created_at

// Ownership verification + audit
business_ownership_submissions  // id (bos_*), user_id (fk -> user.id), company_id (fk),
                                // r2_key, mime_type, file_size, submitted_at,
                                // status ('pending' | 'approved' | 'rejected'),
                                // reviewed_by_user_id (fk -> user.id, nullable),
                                // reviewed_at (nullable), review_notes (text, nullable)
profile_updates              // id, company_id, submission_id (fk -> business_ownership_submissions.id, nullable),
                             // patch_json, applied_at, reviewed_by_user_id
```

**Removed:** the `company_claims` table is **deleted** — replaced
by Better Auth (real accounts) plus `business_ownership_submissions`
(real verification with admin review). The `cl_*` ID prefix is
retired; submissions use `bos_*`.

`profile_updates.claim_id` is also gone — use `submission_id` if
the patch came from an owner edit, or leave null if the patch came
from a GOEO admin.

#### 1b. Better Auth tables (generated)

Write a minimal `auth.ts` stub in the repo root just to drive the
Better Auth code generator:

```ts
// auth.ts (Agent 1 writes this stub; Agent 5 will expand it later)
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";

// Stub adapter — only needed so the CLI can introspect.
// Agent 5 replaces this with a real env-bound DB at request time.
const stubDb = drizzle({} as any);

export const auth = betterAuth({
  database: drizzleAdapter(stubDb, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "owner" },
    },
  },
});
```

Then run:

```bash
npx @better-auth/cli generate --output db/schema.auth.ts
```

This emits Drizzle table definitions for `user`, `session`,
`account`, and `verification`, including the `role` column on
`user`. **Re-export those tables from `db/schema.ts`** so
`drizzle-kit generate` includes them in the migration:

```ts
// db/schema.ts
export * from "./schema.auth"; // Better Auth tables
// ...your hand-written tables...
```

Then continue with the normal flow:

```bash
npm run db:generate
npm run db:migrate:local
npm run db:migrate:remote
```

Agent 5 will later expand `auth.ts` with the email-verification
hook, password-reset hook, and role plugin — **none of those
changes alter the generated tables**, so the schema stays frozen.

For each column, choose appropriate SQLite types (`text`, `integer`,
`real`, `blob`). Use `text` for JSON columns and parse on read. Use
`integer({ mode: 'timestamp' })` for timestamps.

For PKs use the prefixed string IDs from `lib/ids.ts`:

```ts
id: text('id').primaryKey().$defaultFn(() => newId('r')),
```

Add **indexes** for the predictable hot paths:
- `resources.kind`, `resource_locations.county`, `resource_industries.industry`
- `companies.slug` (UNIQUE), `companies.sector`, `companies.stage`,
  `companies.claimed_by_user_id`
- `recommendations.passport_id`
- `business_ownership_submissions.user_id`,
  `business_ownership_submissions.company_id`,
  `business_ownership_submissions.status`

### 2. Generate + apply migration

After §1a (hand-written tables) and §1b (Better Auth-generated
tables) are both committed to `db/schema.ts`:

```bash
npm run db:generate                # produces db/migrations/0000_*.sql
npm run db:migrate:local           # apply locally
npm run db:migrate:remote          # apply to remote D1
```

Verify with:

```bash
wrangler d1 execute startup-state-atlas-db --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Confirm all 12 app-domain tables present **plus** the four Better
Auth tables (`user`, `session`, `account`, `verification`) — 16
total. Confirm `user.role` defaults to `'owner'`.

### 3. Persona seed fixtures

`db/seed/personas.ts` — the six required personas as
`founder_passports` rows. Use realistic field values from
`docs/requirements.md` and `docs/hackathon-plan.md` lines 449–470.

```ts
export const personas = [
  {
    id: 'fp_jordan',
    county: 'Salt Lake', city: 'Salt Lake City',
    stage: 'idea', industry: 'general',
    communities: ['student'], goal: 'start_business',
    urgency: 'this_month',
    needs: ['mentorship', 'pitch_events', 'community'],
    constraints: ['first_time_founder'],
  },
  // … Maria, Marcus, Priya, David, Dr. Amir
];
```

These live as canonical IDs (`fp_jordan`, `fp_priya`, …) so the
front-end's "Try Priya" button can pass them as `passport_id`
directly.

### 4. CSV loaders

The user provides:

- `db/seed/data/resources.csv` — from
  <https://docs.google.com/spreadsheets/d/1AdfJ9TDWdICQuzoYQn-6cBmUkOVXWD8mTqJNDnuKD-E/edit>.
  Fields per `docs/hackathon-plan.md` lines 29–33: title,
  description, communities, industries, locations, topics, links,
  emails.
- `db/seed/data/companies.csv` — from the same brief. Fields:
  company name, address, description, website, stage, employee
  count, LinkedIn, sector/section.

Write loaders that:

- Skip rows missing critical fields.
- Normalize tags (lowercase, trim).
- Geocode using **city/county centroids only** (build a tiny
  `db/seed/centroids.ts` map) — no real geocoding API calls per the
  hackathon cuts.
- Insert rows; on conflict (slug for companies), upsert.

`db/seed/index.ts` orchestrates all three:

```ts
await seedPersonas();
await seedResources('db/seed/data/resources.csv');
await seedCompanies('db/seed/data/companies.csv');
```

### 5. Note Schema FREEZE

When you're done, **add a note to the top of `db/schema.ts`**:

```ts
// SCHEMA FROZEN as of <date> by Agent 1.
// Other agents: do not edit. New columns go through Agent 1 via
// docs/agent-tasks/schema-requests.md.
```

Open `docs/agent-tasks/schema-requests.md` (empty) so other agents
have a known place to file requests.

### 6. PR

```bash
git add db/ docs/agent-tasks/schema-requests.md
git commit -m "feat(data): freeze schema, write personas + CSV loaders"
git push -u origin feat/data
gh pr create --base main --title "Data layer + schema freeze" \
  --body-file - <<'EOF'
Defines all 12 tables in db/schema.ts, generates the first migration,
seeds the six required personas, and adds CSV loaders for the
resources and companies datasets. Schema is FROZEN — see
db/schema.ts header.
EOF
```

## DONE when

1. All 12 app-domain tables + 4 Better Auth tables (`user`,
   `session`, `account`, `verification`) visible via
   `wrangler d1 execute startup-state-atlas-db --command "SELECT name FROM sqlite_master WHERE type='table'"`.
2. `npm run seed` succeeds (with the user's CSVs in place).
3. `wrangler d1 execute startup-state-atlas-db --command "SELECT count(*) FROM founder_passports"`
   returns 6.
4. `wrangler d1 execute startup-state-atlas-db --command "SELECT count(*) FROM resources"`
   returns >0 (assuming user dropped the CSV).
5. `wrangler d1 execute startup-state-atlas-db --command "SELECT count(*) FROM companies"`
   returns >0.
6. `db/schema.ts` has the FROZEN header.
7. PR open.

## Demo path

You don't directly enable a demo scene — you unblock **all five**.
Without your data, every other agent is producing UI-against-fakes.

## Cuts allowed if time-pressed

- **Skip the embedding column** if you're under time pressure — but
  it's better to include it as nullable so a follow-up doesn't
  require a schema change.
- **Skip FTS5** — Agent 4's search can use `LIKE %term%` instead.
- **Skip company_photos / R2 wiring** — drop the table entirely if
  Agent 4 isn't doing photos.
- **If a CSV row is malformed, skip it** silently. Don't spend time
  on data hygiene.

## Common pitfalls

- **Drizzle's D1 driver is `drizzle-orm/d1`** — not `better-sqlite3`.
- **Migration files must be in `db/migrations/`** matching
  `wrangler.jsonc`'s `migrations_dir`.
- **`drizzle-kit generate` requires the schema file to be valid TS**
  — run `npm run typecheck` first if generation fails.
- **JSON columns:** store as `text`, parse with `JSON.parse` on
  read. Or use Drizzle's `text({ mode: 'json' })`.
- **D1 is remote** for `--remote` migrations; ensure
  `CLOUDFLARE_API_TOKEN` is set in the env so wrangler can apply.
