# Agent 1 — Data layer

> **Status: shipped (PR #10).** This brief documents what Agent 1
> delivered. The schema gets extended after this brief by other
> agents; specifically, Agent 5 adds `investor_profiles` and
> `admin_invites` (see § Post-ship schema deltas below).

You define the **initial** schema, generate the first migration, and
write the seeders. Schema is no longer frozen after this brief — any
later agent may extend it in their own worktree (`db/schema.ts` lives
on a per-worktree local D1; rebase before regenerating to avoid
migration-number collisions; see `00-shared-context.md`). Aim for
~60–90 minutes.

## Branch + worktree

- **Worktree:** `wt1` (continuation from Agent 0) or `wt2`.
- **Branch:** `feat/data`. First action: `git checkout -b feat/data`
  (from `feat/bootstrap` if that PR isn't merged yet, or from `main`
  if it is).

## Reads first

1. `docs/implementation-plan.md` — your phase + what you unblock.
2. `docs/agent-tasks/00-shared-context.md`.
3. `docs/architecture.md` — repo layout + bindings.
4. `docs/requirements.md` — personas + entities.
5. `docs/hackathon-plan.md` lines 540–560 (table list) for the full
   table inventory.
6. **`docs/source_data/page-2026-05-08-19-38-24.md`** — the canonical
   GOED hackathon brief; verbatim persona descriptions (§ Test Cases)
   and the required company-profile fields (§ The Utah Startup Map).
7. **`docs/source_data/Resources List - Builder Day - Sheet1.csv`** —
   the actual resources dataset (226 rows). Open it with `head -3 -- "<path>"`
   or `Read` to see the real columns.
8. **`docs/source_data/Map Data for Builder Day  - Sheet1.csv`** —
   the actual map / companies dataset (254 rows). **Filename has a
   double space.**
9. Drizzle's D1 docs (via `cloudflare:wrangler` skill) — SQLite
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

- `db/schema.ts` — you write the initial version. Other agents may
  extend it in their own worktree later; rebase against `main`
  before regenerating migrations to avoid `0003_*.sql` collisions.
- `db/migrations/0000_*.sql` — generated.
- `db/seed/index.ts`, `db/seed/personas.ts`, `db/seed/resources.ts`,
  `db/seed/companies.ts`, `db/seed/centroids.ts`.

You do NOT copy the CSVs into `db/seed/data/`. The seeders read
directly from `docs/source_data/` — they're committed source-of-truth
files, not gitignored fixtures. (The previous `db/seed/data/.gitkeep`
pattern is dropped.)

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
                             // website_url (text, nullable — founder-supplied URL for the
                             //   prefill-from-website feature; see requirements § Smart
                             //   prefill and Agent 2's enrich endpoint),
                             // enriched_at (integer ms, nullable — set when Parallel.ai
                             //   filled fields; null = no enrichment ran),
                             // enrichment_source (text, nullable — 'parallel' for now;
                             //   future-proofs swapping providers),
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
hook (the `emailOTP` plugin — 6-digit code), password-reset hook,
and a widened role enum
(`founder | owner | investor | goeo_admin | superadmin`, default
flipped from `owner` → `founder`). **None of those changes alter
the generated tables**, so the Better Auth schema stays stable
even though general schema is no longer frozen. Agent 5 also
adds two **new** tables (`investor_profiles`, `admin_invites`) in
its own migration — see § Post-ship schema deltas at the end of
this brief.

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
`founder_passports` rows. **The canonical descriptions are in
`docs/source_data/page-2026-05-08-19-38-24.md` § Test Cases** —
match the GOED brief verbatim:

| ID | Display | Location | What they need |
|----|---------|----------|----------------|
| `fp_jordan` | Jordan, 20 | Salt Lake City | Pre-seed; idea, no business yet; first steps |
| `fp_maria` | Maria, 38 | Washington County (St. George) | Rural, woman-owned, ag, scaling |
| `fp_marcus` | Marcus, 34 | Ogden / Weber County | Veteran, custom fab/manufacturing, early-stage |
| `fp_priya` | Priya, 31 | Salt Lake City | B2B SaaS, 18mo, paying customers, raising — angels/VCs |
| `fp_david` | David, 45 | Provo / Utah County | Medical device, 12 emp, FDA cleared, expand internationally |
| `fp_amir` | Dr. Amir, 29 | Salt Lake City | PhD U of U, novel tech, commercialize research, first-time |

Map these to `founder_passports` columns:

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

### 4. CSV loaders — source data lives in `docs/source_data/`

Both CSVs are committed to the repo. The seeders read them in place
— no copying, no gitignored fixtures. Use a small CSV parser
(`papaparse` or hand-written; rows have embedded quoted commas and
multi-line strings).

`db/seed/index.ts`:

```ts
import path from 'node:path';

const SOURCE = path.resolve(process.cwd(), 'docs/source_data');
const RESOURCES_CSV = path.join(SOURCE, 'Resources List - Builder Day - Sheet1.csv');
const COMPANIES_CSV = path.join(SOURCE, 'Map Data for Builder Day  - Sheet1.csv');
//                                       ^ note the DOUBLE space in the filename

await seedPersonas();
await seedResources(RESOURCES_CSV);
await seedCompanies(COMPANIES_CSV);
```

#### 4a. Resources loader (`db/seed/resources.ts`)

**Source:** `Resources List - Builder Day - Sheet1.csv` (226 rows).

**Real columns** (verbatim):

| Column | Type | Notes |
|--------|------|-------|
| `id` | int | Upstream ID (starts at 2543). **Preserve as `r_<id>`** so re-imports don't duplicate. |
| `Title` | string | Resource name. |
| `description` | string (multiline) | May span lines; CSV-quoted. |
| `Communities` | pipe-separated | E.g. `Rural\|Veteran`. Often empty. |
| `Industries` | pipe-separated | E.g. `Aerospace and Defense\|Software and Information Technology`. |
| `Locations` | pipe-separated | County names. **If all 29 counties listed → set `statewide=true` and don't insert 29 join rows.** |
| `Topics` | pipe-separated | Stage / lifecycle markers (e.g. `Late Stage Growth`). |
| `link` | string | URL. |
| `email` | string | Contact (often empty). |

**Mapping to schema:**

```ts
// resources row
{
  id: `r_${row.id}`,                           // preserve upstream ID
  title: row.Title.trim(),
  description: row.description.trim(),
  source_url: row.link.trim() || null,
  kind: deriveKind(row.Topics),                // optional; or just store Topics in resource_topics
  last_updated_at: <import time>,
}

// resource_locations (or `statewide=true` if all 29 counties)
const counties = pipeSplit(row.Locations);
const isStatewide = countyCount(counties) === 29;
if (isStatewide) {
  insert(resource_locations, { resource_id, county: null, city: null, statewide: true });
} else {
  for (const county of counties) insert(resource_locations, { resource_id, county, city: null, statewide: false });
}

// resource_industries — pipe-split, lowercase, trim
// resource_communities — pipe-split (may be empty)
// resource_topics      — pipe-split
```

Helper:

```ts
const pipeSplit = (s: string) =>
  (s ?? '').split('|').map(x => x.trim()).filter(Boolean);
```

#### 4b. Companies loader (`db/seed/companies.ts`)

**Source:** `Map Data for Builder Day  - Sheet1.csv` (254 rows). The
filename has a **double space** between `Day` and `-`. Hard-code it
or read from a constant.

**Real columns** (verbatim — note the trailing whitespace):

| Column | Type | Notes |
|--------|------|-------|
| `Display Type` | string | Always `profile` so far. Filter on this if other types appear. |
| `LinkedIn Link (map it to Links to get the logo)` | string | LinkedIn URL. The header has the parenthetical — match exactly. |
| `Startup Name ` | string | **Trailing space in column name.** Trim values. |
| `Full Address` | string | E.g. `"815 West 1250 South, Orem, UT"`. **No lat/lng — must centroid-geocode.** |
| `Description of startup` | string (multiline) | Often empty. |
| `Website` | string | Bare domain or full URL — normalize. |
| `Stage` | string | E.g. `"Seed "` (trailing whitespace), `"Series A"`, empty. |
| `# of Employees ` | string | E.g. `"2-10"`. **Trailing space in column name.** Store as text in `companies.employee_count` (column is text-friendly per schema). |
| `Section` | string | This is `sector` in our schema. Trim trailing spaces. |

**Mapping to schema:**

```ts
{
  id: newId('co'),                             // we mint these (no upstream ID)
  slug: slugify(row['Startup Name '].trim()),  // for /startups/[slug]
  name: row['Startup Name '].trim(),
  website: normalizeUrl(row.Website),
  description: row['Description of startup']?.trim() ?? null,
  sector: row.Section?.trim() ?? null,
  stage: row.Stage?.trim().toLowerCase() ?? null,
  employee_count: row['# of Employees ']?.trim() ?? null,
  hiring_status: false,                        // not in source; default false
  founding_year: null,                         // not in source; nullable
  linkedin: row['LinkedIn Link (map it to Links to get the logo)']?.trim() ?? null,
  logo_url: null,                              // derive from LinkedIn later if time permits
  founder_team_json: null,
  address_text: row['Full Address']?.trim() ?? null,
  ...geocodeFromAddress(row['Full Address']),  // returns { lat, lng, city, county }
  verified_at: null,
  claimed_at: null,
  claimed_by_user_id: null,
}
```

Also populate `company_locations` from the geocoded `city` + `county`.

**Slug uniqueness** — UNIQUE index will reject duplicates. If the
same company name appears twice, append `-2` etc. or skip.

#### 4c. Geocoding via `db/seed/centroids.ts`

The map data has only `Full Address` strings — no lat/lng. We don't
call a real geocoding API. Build a small lookup table keyed on city,
falling back to county.

```ts
// db/seed/centroids.ts
type Centroid = { lat: number; lng: number; county: string };

export const cityCentroids: Record<string, Centroid> = {
  'Salt Lake City': { lat: 40.7608, lng: -111.8910, county: 'Salt Lake' },
  'Lehi':           { lat: 40.3916, lng: -111.8508, county: 'Utah' },
  'Provo':          { lat: 40.2338, lng: -111.6585, county: 'Utah' },
  'Orem':           { lat: 40.2969, lng: -111.6946, county: 'Utah' },
  'Park City':      { lat: 40.6461, lng: -111.4980, county: 'Summit' },
  'Ogden':          { lat: 41.2230, lng: -111.9738, county: 'Weber' },
  'St. George':     { lat: 37.0965, lng: -113.5684, county: 'Washington' },
  'Logan':          { lat: 41.7370, lng: -111.8338, county: 'Cache' },
  // ...add ~20–30 entries covering the cities in the dataset
};

export const countyCentroids: Record<string, Centroid> = {
  'Salt Lake': { lat: 40.6669, lng: -111.9244, county: 'Salt Lake' },
  'Utah':      { lat: 40.1187, lng: -111.6603, county: 'Utah' },
  // ...all 29 counties
};
```

Parse `Full Address` to extract the city (typical format:
`"<street>, <city>, UT"`), look it up in `cityCentroids`, fall back
to county if known. If neither resolves, store address only and set
`lat=null, lng=null` (the map skips those pins).

Hardcode every Utah city the dataset references — `cut -d, -f2 docs/source_data/'Map Data for Builder Day  - Sheet1.csv'` gives you the list (after fixing CSV parsing).

#### 4d. Loader expectations

- **Skip rows missing critical fields** silently (no `Startup Name`,
  no `Title`, no `id`).
- **Trim every value.** The dataset is full of trailing spaces.
- **Normalize multi-values** (lowercase + trim) before inserting into
  join tables; preserve original casing on the parent record.
- **Statewide-detection rule** for resource_locations: if all 29 Utah
  counties are listed, store one row with `statewide=true` instead of
  29 individual rows.
- **Idempotent re-runs:** `INSERT ... ON CONFLICT DO UPDATE` for
  `resources.id` (`r_<csv_id>`) and `companies.slug`. The user will
  re-run `npm run seed` as the source CSVs evolve.

### 5. PR

```bash
git add db/
git commit -m "feat(data): initial schema + personas + CSV loaders"
git push -u origin feat/data
gh pr create --base main --title "Data layer: initial schema + seed" \
  --body-file - <<'EOF'
Defines all 12 app-domain tables + Better Auth tables in
db/schema.ts, generates the first migration, seeds the six required
personas, and adds CSV loaders for the resources and companies
datasets. Later agents may extend the schema from their own
worktrees (rebase before generating to avoid migration-number
collisions).
EOF
```

## DONE when

1. All 12 app-domain tables + 4 Better Auth tables (`user`,
   `session`, `account`, `verification`) visible via
   `wrangler d1 execute startup-state-atlas-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"`.
2. `npm run seed` succeeds (no `db/seed/data/` checked in — loader
   reads from `docs/source_data/`).
3. `SELECT count(*) FROM founder_passports` returns **6**.
4. `SELECT count(*) FROM resources` returns **226** (the full source
   list; tolerate ±2 for malformed rows).
5. `SELECT count(*) FROM companies` returns **254** (tolerate ±2).
6. `SELECT id FROM resources LIMIT 1` returns a value of the form
   `r_2543` (i.e. upstream ID was preserved with the `r_` prefix).
7. `SELECT count(*) FROM resource_locations WHERE statewide = 1`
   returns >0 (statewide detection works).
8. `SELECT count(*) FROM companies WHERE lat IS NOT NULL` returns
   most of the 254 (centroid geocoding hit rate).
9. `db/migrations/0000_*.sql` exists and is committed.
10. PR open.

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
- **The map CSV filename has a double space** between `Day` and `-`.
  Quote the path or use `path.join` — don't manually concatenate.
- **CSV header trailing whitespace.** `Startup Name ` and
  `# of Employees ` literally include the trailing space. Match the
  exact key when accessing the parsed row.
- **Multi-line CSV cells.** `description` and `Description of startup`
  often contain embedded newlines + commas inside quoted strings. Use
  a real CSV parser (`papaparse` or `csv-parse`), not a `split(',')`.
- **Don't generate new `r_*` IDs for resources.** Preserve upstream
  IDs (`r_2543`) — the source CSV is the system of record and we want
  re-runs to be idempotent.
- **Empty / whitespace-only cells** are common. Treat as null, don't
  insert empty strings into join tables.

## Post-ship schema deltas (Agent 5 owns)

Agent 1 froze the Better Auth tables and the
`business_ownership_submissions` / `claimed_by_user_id` columns.
Two additional tables land in Agent 5's PR (the full target schema
is documented here so Agent 1's brief stays the canonical schema
reference). Agent 5 generates the next migration on its own
worktree (rebase before generate to avoid number collisions).

```ts
// investor preferences (one per investor user)
investor_profiles
  id              text PRIMARY KEY                  // inv_*
  user_id         text NOT NULL UNIQUE              // FK -> user.id
  firm_name       text                              // optional, free text
  investor_type   text                              // 'vc' | 'angel' | 'family_office' | 'corp_dev' | 'scout' | 'lp'
  stages_json     text                              // JSON array of {pre_seed, seed, series_a, growth}
  sectors_json    text                              // JSON array, mirrors company.sector taxonomy
  check_size_min  integer                           // USD, nullable
  check_size_max  integer                           // USD, nullable
  geo_focus_json  text                              // JSON array of {wasatch_front, statewide, national}
  created_at      integer NOT NULL                  // ms epoch
  updated_at      integer NOT NULL                  // ms epoch

// admin invites (one-shot tokens for promoting users to goeo_admin)
admin_invites
  id              text PRIMARY KEY
  email           text NOT NULL
  role            text NOT NULL                     // always 'goeo_admin' (no superadmin invites)
  token_hash      text NOT NULL                     // sha256 of the one-time token sent by email
  invited_by      text NOT NULL                     // FK -> user.id (the issuing superadmin)
  created_at      integer NOT NULL
  expires_at      integer NOT NULL
  consumed_at     integer                           // nullable; set when accepted
```

**Indexes Agent 5 should add:**
- `investor_profiles.user_id` (already UNIQUE — covers the lookup).
- `admin_invites.email`, `admin_invites.token_hash`,
  `admin_invites.consumed_at` (queue + lookup paths).

**Auth config delta Agent 5 lands in the same PR:** the
`additionalFields.role` default flips from `'owner'` to
`'founder'`, and the role enum widens to include `'investor'`.
Existing seeded persona users (role = `'owner'`) stay as-is —
personas are anonymous quick-test buttons, so the value is
cosmetic. Agent 5 may optionally update `db/seed/users.ts` to
backfill three personas as `founder`, two as `owner`, one as
`investor` so `/admin/users` displays representative role-filter
counts on first run.

`investor_profiles` seed: Agent 5 ships
`db/seed/investor-profiles.ts` with three demo rows tied to one
new investor user (`d@pelion.io` per the wireframe) — so the
admin user table has a real investor entry on day one.

