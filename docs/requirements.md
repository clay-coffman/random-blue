# Requirements — Startup State Atlas

Distilled from `docs/hackathon-plan.md` (the full 870-line product spec
remains the source of truth for any ambiguity).

## Product summary

A polished founder/investor product on top of an agent-native data
layer. A founder describes their situation; the system returns a
precise 90-day resource plan with cited reasons, shows relevant
companies/investors/partners on a map, and exposes every resource,
company, and profile through a public REST API, CLI, MCP server, and
`/llms.txt`.

The product is really an **ecosystem graph** with three interfaces:

1. **Founder interface** — "Tell me your situation; I'll give you the
   right next moves."
2. **Investor interface** — "Show me what's being built in Utah."
3. **Agent interface** — "Let ChatGPT/Claude/Codex query and update
   the ecosystem directly."

## Personas (six required test cases per the brief)

Persona fixtures live in `db/seed/personas.ts` (Agent 1 writes these).
For the demo, each persona is one-click testable on the founder
page ("Try Jordan", "Try Maria", etc.).

| Persona     | One-line description                                                   |
| ----------- | ---------------------------------------------------------------------- |
| **Jordan**  | 20, Salt Lake City, idea but no business — needs start-business help. |
| **Maria**   | Rural / women-owned, scaling small ag operation in Washington County.  |
| **Marcus**  | Veteran, mid-stage, seeking workforce + customer connections.          |
| **Priya**   | 18 months in, paying customers, raising seed — needs angels/VCs.       |
| **David**   | Late-stage growth — exporting, talent pipeline, employer programs.     |
| **Dr. Amir**| University researcher commercializing IP.                              |

## Core features (grouped by surface)

### Founder Passport (intake)

- Structured form: county/city, business stage, industry, founder
  identity tags (student, veteran, woman-owned, rural, university
  researcher, …), goal (start, fundraise, hire, export,
  commercialize, find workspace, find mentors), urgency, company
  size/revenue, what they want (capital, customers, talent,
  regulatory help, operating support).
- Persisted as a `founder_passports` row; returns `passport_id`.
- Quick-test buttons for each persona.

### Recommendation engine

- `POST /api/v1/resources/recommend` returns ranked resources with
  per-resource scores, reasons, and suggested actions.
- **Deterministic field-match scoring first** (NOT an LLM):
  ```
  resource_score =
      25 * stage_match
    + 20 * location_match
    + 20 * goal_topic_match
    + 15 * industry_match
    + 10 * community_match
    + 10 * semantic_similarity (optional / cut if time-pressed)
  ```
- LLM (Anthropic, source-bound) generates the explanation **only**;
  it must cite resource IDs and may not invent eligibility or
  recommend resources outside the retrieved set.
- Output structure:
  - **Do this now:** top 3 resources.
  - **Do this next:** next 3 resources.
  - **Ignore for now:** noisy near-misses.
  - **Why these matched:** per-resource bullets.
  - **Saved plan URL:** shareable link.

### Investor / ecosystem map

- MapLibre GL map of companies, sector-colored clusters.
- Filters: sector, stage, employee count, hiring status, county/city.
- Click pin → side drawer with company profile.
- "Investor Brief" panel summarizes the current filtered set
  (Anthropic-generated, source-bound).
- "Investor tour mode" — curated 10-company tour.
- "Founder partner mode" — companies that might be customers,
  partners, suppliers, acquirers.
- "Talent mode" — companies hiring in the founder's geo/industry.

### Company profiles ("the business is the website")

- `/startups/:slug` — public profile page (HTML).
- `/startups/:slug.md` — markdown agent card.
- `/startups/:slug.json` — JSON agent card.
- Agent Card fields: canonical description, industry, location,
  stage, employee count, hiring status, jobs, founder/team links,
  funding (if known), what they sell, who should contact them, what
  agents should know before recommending them, update timestamp,
  verification status.

### Authentication (Better Auth)

- **Library**: [Better Auth](https://better-auth.com) with the
  Drizzle adapter against D1. CLI-managed migrations
  (`npx @better-auth/cli generate` + `migrate`). No external auth
  dashboard. Sessions stored in D1.
- **Roles** on `user.role`: `owner` (default for sign-up),
  `goeo_admin` (Utah Startup State staff), `superadmin`
  (bootstrapping role; promotes/demotes admins).
- **Method**: email + password, with email verification and
  password reset (delivery via the `send-email` skill / Resend).
  No third-party social providers for the hackathon.
- **Bootstrapping**: first `superadmin` is set by a one-shot
  `npm run bootstrap-superadmin <email>` script run by an
  operator with `wrangler` D1 access. After that, `superadmin`
  promotes other users to `goeo_admin` from `/admin/users`.
- **Anonymous founder passports stay anonymous** — sign-up is
  not required to use the Founder Navigator.
- **Read endpoints stay open.** Writes from the web app require a
  Better Auth session; writes from the CLI/MCP layer use the
  machine-only `X-Atlas-Admin-Token` (see Agent-native layer).

### Self-service claim flow (with ownership verification)

- "Claim this company" button on profile → routes the founder to
  sign-up / sign-in if not authenticated.
- **Real verification**: signed-in owner uploads a verification
  document (Secretary-of-State filing, business license, EIN
  letter — PDF or image) to the `atlas-ownership-docs` R2 bucket.
- Submission is recorded in `business_ownership_submissions`
  (`pending`).
- GOEO admin reviews the queue at `/admin/submissions`, opens the
  doc via a signed R2 URL, approves or rejects with notes.
- On approval: `companies.claimed_by_user_id` is set,
  `verified_at` and `claimed_at` are stamped, the submission row
  flips to `approved`. The owner can now edit the company at
  `/companies/[slug]/edit`.
- AI-generated draft profile on first edit-page open; founder
  approves/edits.

### Responsive design (desktop + mobile)

Every shipped UI surface — Founder Navigator, ecosystem map,
company profiles, claim flow, GOEO admin UI, `/agents` docs page —
must work cleanly at both desktop and mobile widths. Design
mobile-first; verify at 375 / 768 / 1280px. The demo will show
phones in the audience, and Utah founders & GOEO staff will open
this on mobile in the wild. See `AGENTS.md` § Coding Style for the
breakpoint policy and test checklist.

### GOEO admin UI

Utah Startup State / GOEO staff can keep the data current without
a developer. Auth is the same Better Auth system the owners use;
admin pages require a session with role `goeo_admin` or
`superadmin` (Next.js middleware enforced — no separate token gate).

- **Ownership-submission queue** (`/admin/submissions`) — review
  pending business-ownership submissions. View the uploaded doc
  via a signed R2 URL; approve (sets
  `companies.claimed_by_user_id` + `verified_at` + `claimed_at`)
  or reject (with notes).
- **Pending edits** review for founder-submitted profile changes.
- **Resources CRUD** — create, edit, delete entries in the
  resource directory (funding, mentoring, training, etc.) with
  all join-table fields (locations, industries, communities,
  topics).
- **Companies CRUD** — create, edit (no founder field whitelist),
  delete companies directly without a claim flow.
- **Map curation** — click a pin to fix coordinates, edit the
  company, or hide a stale entry.
- **Users management** (`/admin/users`, `superadmin` only) —
  promote/demote users between `owner` and `goeo_admin`.

### Agent-native layer

- **REST API** under `/api/v1/...` — versioned. OpenAPI spec at
  `/api/v1/openapi.json`.
- **CLI** (`startup-state` bin):
  - `startup-state recommend --persona priya --compact`
  - `startup-state map search --sector fintech --stage seed --json`
  - `startup-state company claim crew --domain trycrew.com --email founder@trycrew.com`
  - `startup-state profile build --company "NewCo" --from-url … --emit md,json,llms`
- **MCP server** (`startup-state-mcp` bin, stdio for local Claude
  Desktop demo). Tools: `recommend_resources`, `search_resources`,
  `search_companies`, `get_company`, `start_company_claim`,
  `update_company_profile`, `generate_founder_plan`,
  `generate_investor_tour`. Resources:
  `startupstate://resources/{id}`, `startupstate://companies/{slug}`,
  `startupstate://schemas/founder-passport`,
  `startupstate://schemas/company-profile`,
  `startupstate://datasets/resources`,
  `startupstate://datasets/companies`. Prompts: `founder_intake`,
  `investor_tour`, `company_profile_builder`,
  `resource_update_reviewer`.
- **`/llms.txt`** at site root with site description, links to API
  and schemas, and agent rules.
- **`/AGENTS.md`** at site root with end-user agent operating
  instructions (NOT the same as the repo-root AGENTS.md, which is
  for coding agents).
- **`/agents`** human-readable docs page that exposes the above
  surfaces in a way investors/judges can scan.

## Out of scope for this hackathon (explicit cuts)

Per `docs/hackathon-plan.md`, do not invest in:

- Real OAuth with ChatGPT/Claude (Better Auth covers our owner /
  admin login; agents use `X-Atlas-Admin-Token`).
- Third-party social login providers (Google, GitHub, etc.) —
  email + password is enough for the hackathon.
- Complex CRM workflows.
- Scraped LinkedIn enrichment.
- Perfect geocoding (use city/county centroids).
- Complicated vector-only RAG (defer embeddings).
- Calendar integration.
- Payment/funding application workflows.

In scope but kept simple: Better Auth email + password, file-upload
ownership verification (admin manually reviews), email verification
+ password reset via the `send-email` skill (Resend).

## Demo script (5 scenes — condensed from plan lines 449–528)

1. **Jordan (pre-seed)** — Click "Try Jordan". System produces a
   start-business checklist + student/community resources + "not
   yet" items.
2. **Priya (raising)** — Click "Try Priya". Capital-focused plan
   showing real Utah angels/VCs (Pelion, Grix, Tandem, Peterson,
   Kickstart, Red Rock Angels, Salt Lake Angels, Park City Angels).
   Pin those investors on the map.
3. **Investor view** — Switch to map. Filter "FinTech, Seed, 2-10
   employees, Salt Lake/Lehi/Utah County". Map clusters; sidebar
   generates an "Investor Brief" narrative.
4. **Business owner as website** — Claim a company profile. Update
   hiring status + add a job posting. Show that
   `/startups/crew.md` and `/api/v1/companies/crew` both updated
   from the same canonical source.
5. **Terminal / MCP proof** — Run
   `startup-state recommend --persona priya --compact`, then
   `startup-state company get crew --json`, then show the MCP tools
   list.

## Judging-rubric notes

- **Usability + design = 55% of judging.** Polish on the founder
  navigator and map matters more than feature breadth.
- One exceptional product beats two half-baked ones. Cut
  aggressively when behind.
- The agent layer is a *visible flourish in the demo*, not the main
  product. ~20 seconds of CLI/MCP airtime.
- "Why this matched" explanations build trust faster than generic
  AI prose. Show field-level reasons.
- Six persona buttons should produce *meaningfully different*
  outputs to validate against the organizers' test cases.

## Datasets

The state has provided complete datasets for both products — see
`docs/source_data/`. Agent 1 loads them into D1 directly from there;
no copy-into-`db/seed/data/` step.

- **`docs/source_data/Resources List - Builder Day - Sheet1.csv`** —
  226 resource rows. Columns: `id`, `Title`, `description`,
  `Communities`, `Industries`, `Locations`, `Topics`, `link`, `email`.
  Multi-values pipe-separated. Upstream IDs preserved as `r_<id>`.
- **`docs/source_data/Map Data for Builder Day  - Sheet1.csv`** —
  254 company rows (note **double space** in filename). Columns:
  `Display Type`, `LinkedIn Link (...)`, `Startup Name `,
  `Full Address`, `Description of startup`, `Website`, `Stage`,
  `# of Employees `, `Section`. Address-only — Agent 1 geocodes via
  city/county centroids.
- **`docs/source_data/page-2026-05-08-19-38-24.md`** — the canonical
  AI Builder Day brief from Utah GOED. Contains the verbatim persona
  descriptions, required company-profile fields, judging breakdown
  (30 / 25 / 25 / 20), and the link to the live site this build may
  replace: <https://startup.utah.gov/>.

The brief explicitly says: *"You don't need to research or compile
anything — focus every hour on the build."* Don't scrape startup.utah.gov,
LinkedIn, or pampam.city. Use what's in `docs/source_data/`.

## Source-of-truth pointers

- Implementation map: `docs/implementation-plan.md`.
- Screens / sitemap: `docs/screens.md`.
- Full plan: `docs/hackathon-plan.md`.
- Architecture: `docs/architecture.md`.
- Hackathon brief (canonical): `docs/source_data/page-2026-05-08-19-38-24.md`.
- Per-agent execution: `docs/agent-tasks/agent-<N>-<slice>.md`.
- Shared conventions: `docs/agent-tasks/00-shared-context.md`.
