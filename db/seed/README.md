# Seed data

`npm run seed` reloads the local D1; `npm run seed -- --remote` reloads
production. The seeders are idempotent and re-runnable: each run wipes
the seed-owned rows and re-inserts from `docs/source_data/` and the
fixtures in this directory.

## What gets seeded

- **Test users** (`users.ts`) — 8 dev-only accounts (see below).
- **Personas** (`personas.ts`) — 6 `founder_passports` rows linked to
  the persona test users via `user_id`.
- **Resources** (`resources.ts`) — 213 rows from
  `docs/source_data/Resources List - Builder Day - Sheet1.csv`.
- **Companies** (`companies.ts`) — 220 rows from
  `docs/source_data/Map Data for Builder Day  - Sheet1.csv`,
  centroid-geocoded.

What is **not** wiped on re-seed: real user accounts, real sessions,
ownership submissions, profile updates, recommendations. Only test
accounts (matched by their fixed IDs) and the CSV-derived rows are
replaced.

## Test accounts (FOR DEV ONLY)

> ⚠️ **Replace before production.** These credentials are committed to
> the repo so the dev team can sign in across environments. Rotate
> before any real user data lands.

All test users share the same password: `passport123`.

| Role | Email | User ID | Display name | Linked passport |
|------|-------|---------|--------------|-----------------|
| owner | jordan@persona.test | `u_jordan` | Jordan Reyes | `fp_jordan` |
| owner | maria@persona.test | `u_maria` | Maria Alvarez | `fp_maria` |
| owner | marcus@persona.test | `u_marcus` | Marcus Thomas | `fp_marcus` |
| owner | priya@persona.test | `u_priya` | Priya Patel | `fp_priya` |
| owner | david@persona.test | `u_david` | David Nakamura | `fp_david` |
| owner | amir@persona.test | `u_amir` | Dr. Amir Rahimi | `fp_amir` |
| goeo_admin | admin@goed.test | `u_admin` | Sarah Chen (GOEO) | — |
| superadmin | super@startup-state-atlas.test | `u_super` | Atlas Superadmin | — |

The `*.test` TLD is reserved by RFC 2606 and never resolves in DNS, so
emails to these addresses fail closed — safe for dev fixtures.

## Design

- Personas are real `user` rows + linked `founder_passports`. The team
  signs in as Jordan/Priya/etc. to E2E-test owner flows.
- The `goeo_admin` and `superadmin` users let the team test the GOEO
  admin UI (Agent 5) without bootstrapping fresh accounts.
- Anonymous intake still works: `founder_passports.user_id` is
  nullable. A guest filling out the intake without signing up creates
  a passport with `user_id = NULL`. The intake → recommend → shareable
  `/plan/:id` flow doesn't gate on auth.

## Re-running

```bash
npm run seed              # local
npm run seed -- --remote  # production
```

Both rebuild the SQL in memory and apply via `wrangler d1 execute
--file <tmp>` — no extra DB driver, no credentials in the script.
