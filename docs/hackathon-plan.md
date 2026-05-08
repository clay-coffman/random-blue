Your premise is directionally right, but the strongest version is this: **do not
build an “agent-native website” as the primary demo. Build a polished
founder/investor product, then make agent-native access the hidden superpower.**
Judges score usability and design heavily, and the brief explicitly warns that
one exceptional product beats two half-baked ones. So the CLI/MCP/API layer
should be visible in the demo, but the human-facing product has to carry the
room. Confidence: **high**. The hackathon wants a personalized Founder’s
Navigator, a Utah Startup Map, self-service company profiles, non-technical
updates, and production-quality polish; usability and design together are 55% of
the judging rubric. ([Startup State][1])

## The idea I would build: **Startup State Atlas**

**One-line pitch:** A founder tells Startup State who they are; the system
generates a precise 90-day resource plan, shows relevant
companies/investors/partners on the map, and exposes every
resource/company/profile through an agent-native API, CLI, MCP server, and
`llms.txt`.

This avoids the trap of “chatbot glued onto a spreadsheet.” The product is
really an **ecosystem graph** with three interfaces:

1. **Founder interface:** “Tell me your situation; I’ll give you the right next
   moves.”
2. **Investor interface:** “Show me what is being built in Utah.”
3. **Agent interface:** “Let ChatGPT/Claude/Codex query and update the ecosystem
   directly.”

That maps cleanly to the challenge. The resource spreadsheet already includes
fields like title, description, communities, industries, locations, topics,
links, and emails; the map dataset includes company name, address, description,
website, stage, employee count, LinkedIn, and sector/section fields. ([Google
Docs][2])

---

# Core product

## 1. Founder Passport

The user does not start with search. They start with a **structured intake**:

- county / city
- business stage
- industry
- founder identity tags: student, veteran, woman-owned, rural, university
  researcher, etc.
- current goal: start, fundraise, hire, export, commercialize research, find
  workspace, find mentors
- urgency: “this week,” “this month,” “next quarter”
- company size / revenue stage
- whether they want capital, customers, talent, regulatory help, or operating
  support

Then the system creates a **Founder Passport**:

```json
{
  "persona": "B2B SaaS founder",
  "county": "Salt Lake",
  "stage": "paying_customers",
  "goal": "raise_seed_round",
  "industry": "Software and Information Technology",
  "needs": ["angel_investors", "VCs", "pitch_events", "mentor_networks"],
  "constraints": ["time_constrained", "wants_warm_intro"]
}
```

The output is not a list of 40 resources. It is:

- **Do this now:** top 3 resources
- **Do this next:** next 3 resources
- **Ignore for now:** things that sound relevant but are not
- **Why these matched:** exact field-based explanation
- **Contact/action draft:** “email this person,” “apply here,” “attend this
  event,” etc.
- **Saved plan URL:** shareable with a cofounder, mentor, or GOEO staffer

This directly answers the brief’s “founders need clarity, not a library”
premise. The live Startup State site today is mostly a traditional navigation
portal: Start Your Journey, Resources, Get Funding, Why Utah, Events, News,
Contact. ([startup.utah.gov][3])

## 2. Resource recommendation engine

Do not make the LLM responsible for truth. Use deterministic matching first,
then LLM explanation second.

A simple scoring model:

```txt
resource_score =
  25 * stage_match
+ 20 * location_match
+ 20 * goal_topic_match
+ 15 * industry_match
+ 10 * community_match
+ 10 * semantic_similarity
```

Then ask the model only to produce the explanation:

```txt
Explain why these resources match this founder.
Use only the returned resources.
Cite resource IDs.
Do not invent eligibility.
Do not recommend anything outside the retrieved set.
```

That gives you a credible, low-hallucination demo. For Priya, the SaaS founder
raising her first venture round, the system can surface VC and angel resources
from the spreadsheet, such as Pelion Ventures, Grix, Tandem Ventures, Peterson
Ventures, Kickstart Fund, Red Rock Angels, Salt Lake Angels, and Park City
Angels. ([Google Docs][2])

## 3. Utah Startup Map as the visual layer

The map should not just be pins. Pins are commodity.

Build it as an **ecosystem explorer**:

- filter by sector, stage, employee count, hiring status, county, city
- cluster by sector: fintech, life sciences, aerospace, energy, security, B2B
  software
- click company → rich profile page
- “investor tour mode” → generate a curated tour of 10 companies in a sector
- “founder partner mode” → show companies that might be customers, partners,
  suppliers, or acquirers
- “talent mode” → show companies hiring in the founder’s geography/industry

The brief wants a map “beautiful enough to project on a screen in front of
international investors” and useful enough for founders to find customers,
partners, or acquisitions. It also requires rich self-service profiles with
name, website, employees, sector, founding year, LinkedIn, description, address,
hiring status, jobs, and photo gallery. ([Startup State][1])

## 4. Company profile pages: “the business is the website”

This is where your agent-native intuition becomes interesting.

Each company gets a normal public profile page:

```txt
/startups/crew
/startups/bracket-labs
/startups/altitude-ai
```

But each company also gets an **Agent Card**:

```txt
/startups/crew.md
/startups/crew.json
/startups/crew/llms.txt
/api/v1/companies/crew
```

The Agent Card contains:

- canonical description
- industry
- location
- stage
- employee count
- hiring status
- job links
- founder/team links
- funding status, if known
- “what this company sells”
- “who should contact them”
- “what agents should know before recommending them”
- update timestamp
- verification status

This is the concrete implementation of “business owners are the website.” They
do not need to hand-code a site. They maintain a verified structured profile
that human visitors, investors, and AI agents can all consume.

This also aligns with `llms.txt`: the proposal is specifically about adding a
Markdown file at `/llms.txt` to help LLMs use website information at inference
time, with concise site/project context and links to more detailed Markdown
files. ([llms-txt][4])

---

# The agent-native layer

Your repo is highly relevant. It is already oriented around generating
agent-first CLIs and MCP servers, with local SQLite, offline search, compound
commands, compact output, typed exit codes, and dual CLI/MCP interfaces.
([GitHub][5])

For this hackathon, I would ship the following.

## Public API

```txt
GET  /api/v1/resources
POST /api/v1/resources/recommend
GET  /api/v1/companies
GET  /api/v1/companies/:slug
POST /api/v1/companies/claim
PATCH /api/v1/companies/:slug
POST /api/v1/founder-passports
GET  /api/v1/founder-passports/:id/plan
GET  /api/v1/search
GET  /api/v1/openapi.json
```

The important endpoint is:

```txt
POST /api/v1/resources/recommend
```

Request:

```json
{
  "county": "Washington",
  "stage": "growth",
  "industry": "Agriculture",
  "communities": ["Rural", "Women"],
  "goal": "scale business",
  "business_type": "small agricultural operation"
}
```

Response:

```json
{
  "passport_id": "fp_123",
  "recommendations": [
    {
      "resource_id": 2547,
      "title": "USU Remote Online Initiative",
      "score": 87,
      "why": [
        "Matches rural community tag",
        "Applies statewide including Washington County",
        "Relevant to rural and agriculture businesses"
      ],
      "action": "Review e-commerce and remote-work training support"
    }
  ]
}
```

That format is perfect for humans, agents, and CLI output.

## CLI

```bash
startup-state recommend \
  --county "Salt Lake" \
  --stage "paying-customers" \
  --industry "Software and Information Technology" \
  --goal "raise seed round" \
  --compact
```

```bash
startup-state map search \
  --sector fintech \
  --stage seed \
  --employees 2-10 \
  --json
```

```bash
startup-state company claim crew \
  --domain trycrew.com \
  --email founder@trycrew.com
```

```bash
startup-state profile build \
  --company "NewCo" \
  --from-url https://newco.com \
  --emit md,json,llms
```

The CLI should be a judge-visible flourish, not the main product. Show it for 20
seconds: “This is not just a website; it is an agent-accessible public data
layer for Utah’s startup ecosystem.”

## MCP server

Expose tools:

```txt
recommend_resources(profile)
search_resources(query, filters)
search_companies(filters)
get_company(slug)
start_company_claim(company_name, domain_email)
update_company_profile(slug, patch)
generate_founder_plan(profile)
generate_investor_tour(filters)
```

Expose resources:

```txt
startupstate://resources/{id}
startupstate://companies/{slug}
startupstate://schemas/founder-passport
startupstate://schemas/company-profile
startupstate://datasets/resources
startupstate://datasets/companies
```

Expose prompts:

```txt
founder_intake
investor_tour
company_profile_builder
resource_update_reviewer
```

This is exactly what MCP is for: servers can expose resources as context, and
prompts as reusable templates that clients can discover and invoke. ([Model
Context Protocol][6])

## `llms.txt` and `AGENTS.md`

Site-wide:

```txt
/llms.txt
/AGENTS.md
/api/v1/openapi.json
```

Per company:

```txt
/startups/:slug.md
/startups/:slug.json
```

Sample `/llms.txt`:

```md
# Startup State Atlas

> Startup State Atlas is Utah's agent-readable map of startup companies, founder
> resources, funding sources, mentor networks, and ecosystem programs.

## Core data

- [Resources API](/api/v1/resources): Searchable list of Utah startup resources.
- [Companies API](/api/v1/companies): Searchable list of Utah startup companies.
- [Founder Passport Schema](/schemas/founder-passport.md): How to describe a
  founder's stage, goals, location, industry, and constraints.
- [Company Profile Schema](/schemas/company-profile.md): How companies represent
  themselves to humans and agents.

## Agent instructions

- Never recommend a resource unless it appears in the API result.
- Always cite resource ID and link.
- Ask for county, stage, industry, goal, and community tags before recommending.
- Prefer 3 high-fit resources over broad lists.
```

Sample `AGENTS.md`:

```md
# Startup State Atlas agent instructions

You are helping founders navigate Utah startup resources.

Required fields before recommendation:

- county or city
- business stage
- industry
- goal
- founder/community attributes, if relevant

Use:

- POST /api/v1/resources/recommend for recommendations
- GET /api/v1/companies for ecosystem search
- GET /api/v1/companies/:slug for profile facts

Rules:

- Do not invent eligibility.
- Do not invent contact emails.
- Cite resource IDs.
- If confidence is low, explain which input is missing.
```

---

# The self-service company claim flow

This should be part of the demo because it satisfies the map requirement and
makes the “agent-native business owner” idea concrete.

## Human flow

1. Founder clicks “Claim this company.”
2. Enters work email.
3. System checks domain against company website domain.
4. Sends magic link.
5. Founder lands in profile editor.
6. AI generates a draft profile from existing fields.
7. Founder approves or edits.
8. Profile publishes.

## Agent flow

The profile page has an “Update with Claude/ChatGPT” button that gives the owner
a prompt:

```txt
You are updating my verified Startup State Atlas company profile.

Use the OpenAPI spec here:
[openapi link]

Company slug:
crew

Patch request:
- hiring_status: true
- job_postings: [ ... ]
- description: "Crew is a neobank for families..."
- sectors: ["FinTech"]
- stage: "Seed"

Do not change address, LinkedIn, or website.
Return the exact API request before executing.
```

For the hackathon, you do not need true ChatGPT/Claude OAuth. You need a working
API, clear agent docs, and a visible demo showing that an external agent could
update the profile.

---

# The strongest demo script

## Scene 1: Jordan, pre-seed founder

Jordan is 20 in Salt Lake City with an idea but no business yet. The system asks
5 questions and returns:

- start-business checklist
- student/community entrepreneurship resources
- local pitch or mentor programs
- “not yet” items: late-stage grants, export programs, large employer workforce
  programs

The brief includes Jordan as a required test persona, so showing him validates
against the organizers’ own scenarios. ([Startup State][1])

## Scene 2: Priya, SaaS founder raising

Priya is 18 months in, has paying customers, and wants angels/VCs. The system
returns a capital-focused plan with relevant venture and angel groups, then
shows those investors/resources on the map. Use the actual spreadsheet examples
here: Pelion, Grix, Tandem, Peterson, Kickstart, Red Rock Angels, Salt Lake
Angels, Park City Angels. ([Google Docs][2])

## Scene 3: Investor view

Switch to map:

```txt
Sector: FinTech
Stage: Seed
Employees: 2-10
Location: Salt Lake / Lehi / Utah County
```

The map clusters companies and generates an “Investor Brief”:

```txt
Utah early-stage fintech cluster:
- family neobanking
- payments
- identity
- estate planning
- construction finance
- benefits/payment infrastructure
```

This turns the map from directory into narrative.

## Scene 4: Business owner as website

Claim a company profile. Update hiring status and add a job posting. The visible
profile updates. Then show:

```txt
/startups/crew.md
/api/v1/companies/crew
```

The punchline:

> “The company did not update a web page. It updated its canonical profile, and
> the website, map, API, CLI, and agent docs all changed from the same source of
> truth.”

## Scene 5: Terminal / MCP proof

Run:

```bash
startup-state recommend --persona priya --compact
```

Then:

```bash
startup-state company get crew --json
```

Then show the MCP tools list or agent docs. Keep this short.

---

# Parallel build plan for 5–6 Codex agents

## Agent 1 — Data ingestion and schema

Build:

- Supabase/Postgres schema
- resource import from Google Sheet CSV
- company import from Google Sheet CSV
- normalized tags: counties, topics, communities, industries, sectors, stages
- seed script
- basic admin import button

Tables:

```txt
resources
resource_locations
resource_industries
resource_communities
resource_topics
companies
company_locations
company_jobs
company_photos
company_claims
founder_passports
recommendations
profile_updates
```

## Agent 2 — Recommendation engine/API

Build:

- `/api/v1/resources/recommend`
- scoring function
- source-bound explanation generator
- six persona test fixtures
- JSON response with score, reason, action, confidence

Do not wait for embeddings to be perfect. Use field matching first. Add vector
search as a bonus.

## Agent 3 — Founder Navigator UI

Build:

- intake flow
- results page
- 90-day plan
- “why this matched”
- save/share plan
- persona demo buttons: Jordan, Maria, Marcus, Priya, David, Dr. Amir

This should be polished. It is your highest-scoring surface.

## Agent 4 — Map and company profiles

Build:

- map page
- filters
- company profile page
- sector clusters
- investor brief sidebar
- profile markdown/JSON endpoints

Use Mapbox, MapLibre, or deck.gl. If geocoding becomes annoying, use address
strings plus city/county centroids for the prototype.

## Agent 5 — Claim/update/admin

Build:

- claim button
- domain email mock verification
- profile editor
- update review page
- admin table for resource/company edits
- “last updated” and “verified” status

You only need a lightweight verification method; the brief asks for exactly
that. ([Startup State][1])

## Agent 6 — Agent-native layer

Build:

- OpenAPI spec
- CLI
- MCP server
- `/llms.txt`
- `/AGENTS.md`
- `/agents` documentation page
- demo commands

This is where you can reuse the logic/patterns from `cli-printing-press`.

---

# Architecture

```txt
Next.js app
  ├── Founder Navigator UI
  ├── Startup Map UI
  ├── Company profile pages
  ├── Admin/profile editor
  └── API routes

Supabase/Postgres
  ├── resources
  ├── companies
  ├── founder_passports
  ├── claims
  └── updates

AI layer
  ├── source-bound explanations
  ├── founder plan generator
  ├── company profile normalizer
  └── investor brief generator

Agent-native layer
  ├── OpenAPI
  ├── MCP server
  ├── CLI
  ├── llms.txt
  └── AGENTS.md
```

Use AI sparingly and visibly:

- **Good AI:** “explain these ranked resources,” “generate profile draft,”
  “summarize ecosystem cluster.”
- **Bad AI:** “ask chatbot to search entire spreadsheet and hope it gets it
  right.”

---

# Ranked alternative ideas

## 1. **Founder Passport + Ecosystem Graph**

Confidence: **high**

This is the core recommendation. It is the cleanest match to the judging rubric.
It makes the resource navigator and map one product instead of two unrelated
products.

## 2. **Agent-Ready Company Profiles**

Confidence: **high**

This is your most novel angle. Every Utah startup gets a human page, JSON
endpoint, Markdown endpoint, and agent-readable profile. Business owners
maintain their canonical company data once; the map, profile, API, and agent
docs update everywhere.

This is the best interpretation of your “let them be the website” instinct.

## 3. **Investor Briefing Room**

Confidence: **moderate-high**

A map mode that turns filters into investor-grade narratives:

```txt
Show me Utah defense/aerospace startups with 10–50 employees near Salt Lake and Utah County.
Generate a one-page briefing.
Identify clusters, gaps, and likely partner companies.
```

This would score well on visual impact and investor-readiness.

## 4. **GOEO Admin Copilot**

Confidence: **moderate**

A backend tool for state staff:

- detect stale links
- find duplicate resources
- suggest missing tags
- classify new resources
- approve/reject company updates
- show “coverage gaps” by county/industry/stage

This is operationally valuable but less demo-sexy. Build a thin version as an
admin tab, not the main product.

## 5. **Startup State CLI/MCP only**

Confidence: **low as standalone, high as layer**

A pure CLI/MCP project is too invisible for this hackathon. Judges want a live,
clickable prototype and investor-ready visual experience. But as a layer under
the Founder Navigator and Map, it becomes a strong technical differentiator.

---

# What I would cut

Cut these unless everything else is done:

- real OAuth with ChatGPT/Claude
- complex CRM workflows
- actual email sending
- scraped LinkedIn enrichment
- perfect geocoding
- multi-tenant permissions beyond simple claim tokens
- complicated vector-only RAG
- fully automated verification
- calendar integration
- payment/funding application workflows

They are seductive time sinks.

---

# What I would overinvest in

## 1. Persona test buttons

The organizers gave six test cases. Put six buttons in the demo:

```txt
Try Jordan
Try Maria
Try Marcus
Try Priya
Try David
Try Dr. Amir
```

Each should produce meaningfully different results. The brief explicitly says
these scenarios should validate the navigator. ([Startup State][1])

## 2. “Why this matched”

Founders trust recommendations when the system says:

```txt
Matched because:
- You are in Washington County
- You selected Agriculture
- You selected Rural
- You are trying to scale
- This resource is tagged Funding + Entrepreneurship Communities
```

That is better than generic AI prose.

## 3. The visual map

Make the map look expensive. Use:

- dark/light professional basemap
- sector-colored clusters
- right-side profile drawer
- smooth filters
- investor brief panel
- company logos if available
- clean typography

## 4. Agent page

Create `/agents` as a visible product page:

```txt
Startup State for Agents

Use the API:
curl ...

Install the CLI:
npm install -g startup-state-cli

Use with Claude Desktop:
mcpServers: { ... }

Read llms.txt:
...
```

This makes the hidden infrastructure legible to nontechnical judges.

---

# Suggested product names

Best options:

1. **Startup State Atlas**
2. **Utah Founder Passport**
3. **Startup State Graph**
4. **Founder Navigator Pro**
5. **Agent Atlas Utah**
6. **Startup State OS**

I would use **Startup State Atlas**. It sounds official, investor-facing, and
broad enough to include resources, companies, maps, and agents.

---

# Final recommendation

Build **Startup State Atlas** as a single coherent platform:

- **Founder Passport** for personalized resource plans.
- **Ecosystem Map** for companies, investors, sectors, and clusters.
- **Self-service profiles** for companies to claim and update.
- **Agent-native substrate**: API, CLI, MCP, `llms.txt`, `AGENTS.md`,
  Markdown/JSON company profiles.
- **Admin import/update path** so GOEO can maintain the data without a
  developer.

The demo line should be:

> “Startup State is no longer a website founders have to search. It is a live,
> verified, agent-readable ecosystem graph. Humans get a polished navigator and
> map. Agents get an API, CLI, MCP server, and canonical company/resource
> profiles.”

That is ambitious, feasible, and aligned with the rubric.

[1]: https://startupstate.netlify.app/ "AI Builder Day — Utah GOED"
[2]:
  https://docs.google.com/spreadsheets/d/1AdfJ9TDWdICQuzoYQn-6cBmUkOVXWD8mTqJNDnuKD-E/edit?usp=sharing
  "Resources List - Builder Day - Google Sheets"
[3]: https://startup.utah.gov/ "Startup State Initiative | Utah"
[4]: https://llmstxt.org/ "The /llms.txt file – llms-txt"
[5]:
  https://github.com/mvanhorn/cli-printing-press
  "GitHub - mvanhorn/cli-printing-press: Every API has a secret identity. This finds it, absorbs every feature from every competing tool, then builds the GOAT CLI — designed for AI agents first, with SQLite sync, offline search, and compound insight commands. · GitHub"
[6]:
  https://modelcontextprotocol.io/specification/2025-06-18/server/resources
  "Resources - Model Context Protocol"
