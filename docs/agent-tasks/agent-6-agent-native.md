# Agent 6 — Agent-native layer

You build the agent-native surfaces: REST API contract, CLI, MCP server,
`/llms.txt`, the end-user `/AGENTS.md`, and the `/agents` doc page.
External agents, CLI users, and integrators reach the live data through
this layer. Aim for ~120 minutes.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free). Can run in parallel
  with Agent 2 — coordinate on `app/api/v1/openapi.yaml`.
- **Branch:** `feat/agent-layer`. First action:
  `git checkout -b feat/agent-layer`.

## Reads first

1. `docs/implementation-plan.md` — your phase + the openapi-additions
   coordination point with Agents 2 and 4.
2. `docs/agent-tasks/00-shared-context.md`.
3. `docs/architecture.md` — repo layout (`cli/`, `mcp/`, `public/`).
4. `docs/requirements.md` — Agent-native layer.
5. `docs/archive/product-plan-original.md` lines 196–397 (API + CLI + MCP +
   llms.txt + AGENTS.md spec).
6. `design/startup-state-atlas-wireframes/project/wireframes/v2/agents.js`
   (chosen direction: C install hero + B tabs + A reference). The
   `/agents` page is your one UI surface. Read HTML/CSS — don't
   render.
7. **`docs/source_data/page-2026-05-08-19-38-24.md`** — context only;
   the brief doesn't separately spec the agent-native layer (that's
   our internal extension), but the "Easily updatable" requirement is
   what motivates the CLI/API/MCP surfaces.
8. The **`cloudflare:build-mcp`** loaded skill — required reading
   if you go remote MCP.
9. `docs/agent-tasks/openapi-additions.md` (Agent 2 writes this) —
   the recommend endpoint shape.
10. The MCP spec: <https://modelcontextprotocol.io/specification/>
    (use the version compatible with `@modelcontextprotocol/sdk`).

## Depends on

- **Agent 0 done.** You need scaffold + `lib/anthropic.ts`.
- **Agent 1 mostly done** so you can document real schemas in the
  `startupstate://schemas/...` MCP resources.
- **Agent 2's endpoint shapes** drive the OpenAPI spec — coordinate
  via `docs/agent-tasks/openapi-additions.md`.
- **Agent 4's `/api/v1/companies` shapes** also feed the OpenAPI
  spec — same coordination file.

## Owns (write surface)

- `app/api/v1/openapi.yaml` — committed, source of truth.
- `app/api/v1/openapi.json/route.ts` — serves the YAML as JSON.
- `app/api/v1/search/route.ts` — generic search across resources +
  companies.
- `cli/index.ts` — CLI entry; `startup-state` bin in
  `package.json`.
- `cli/commands/*.ts` — subcommand handlers.
- `mcp/server.ts` — MCP server; `startup-state-mcp` bin.
- `mcp/tools/*.ts`, `mcp/resources/*.ts`, `mcp/prompts/*.ts`.
- `public/llms.txt`.
- `public/AGENTS.md` (END-USER-FACING — distinct from root
  `AGENTS.md`).
- `app/agents/page.tsx` — human-readable docs page.

You do NOT touch:

- Other agents' route handlers (`app/api/v1/resources/recommend`,
  `app/api/v1/companies`, etc.). You consume them.
- `db/schema.ts` (Agent 1).

## Deliverables

### 1. `app/api/v1/openapi.yaml`

OpenAPI 3.1 spec covering every public endpoint:

- `POST /api/v1/founder-passports`
- `GET /api/v1/founder-passports/:id/plan`
- `POST /api/v1/resources/recommend`
- `GET /api/v1/resources` (list with filters; if not implemented
  by another agent, you can stub it)
- `GET /api/v1/companies`
- `GET /api/v1/companies/:slug`
- `POST /api/v1/ownership-submissions` (owner — Better Auth
  session OR `X-Atlas-Admin-Token`; multipart upload)
- `PATCH /api/v1/companies/:slug` (Better Auth session whose
  `user.id` matches `companies.claimed_by_user_id`, OR Better
  Auth session with role `goeo_admin` / `superadmin`, OR
  `X-Atlas-Admin-Token`)
- `GET /api/v1/search`
- `GET /api/v1/openapi.json`

The OpenAPI spec must reflect the **dual auth model** for write
endpoints (see "Auth note" at the bottom of this brief). Don't
omit either path — the security schemes section should list both
the cookie-based session auth and the `X-Atlas-Admin-Token`
header auth.

The old `POST /api/v1/companies/claim` endpoint is **gone**. The
domain-email magic-link flow has been replaced by sign-up +
ownership submission. If your OpenAPI is already drafted, remove
that entry.

Reference zod schemas from `schemas/` and `types/api.ts` where
possible. Keep error responses uniform per the frozen shape:
`{ error: { code, message, details? } }`.

### 2. `app/api/v1/openapi.json/route.ts`

Reads the YAML at request time (Workers can read from `app/`'s
public assets), parses, returns as JSON. Or simpler: import a
generated `.ts` constant.

### 3. CLI (`cli/index.ts` → `startup-state` bin)

Subcommands:

- `startup-state recommend --persona <name>`
  `[--county <c>] [--stage <s>] [--industry <i>] [--goal <g>]
   [--compact] [--json]`
- `startup-state map search --sector <s> --stage <s>
   --employees <range> [--json]`
- `startup-state company get <slug> [--json]`
- `startup-state company patch <slug> --field key=value …`
   — uses `X-Atlas-Admin-Token` from env. Replaces the old
   `company claim` subcommand: human ownership goes through the
   web sign-up + R2 upload flow, not the CLI.
- `startup-state profile build --company <name>
   --from-url <url> --emit md,json,llms`

Implementation:

- Use `commander` or build a tiny custom argv parser (it's small).
- Each subcommand calls the deployed Worker via `fetch`. Worker URL
  from `STARTUP_STATE_API_URL` env, default
  `http://localhost:3000` for dev.
- `--json` outputs raw JSON. `--compact` uses single-line text.
- `--persona <name>` shortcut: load the canonical
  `fp_<name>` ID and POST to `/api/v1/founder-passports/:id/plan`.

Add the bin entry to `package.json`:

```jsonc
"bin": {
  "startup-state": "./cli/index.js",
  "startup-state-mcp": "./mcp/server.js"
}
```

(Or use `tsx` for dev: `npx startup-state` works via `npm run cli`.)

### 4. MCP server (`mcp/server.ts` → `startup-state-mcp` bin)

Use `@modelcontextprotocol/sdk` (install it). Stdio transport for
local Claude Desktop configuration.

Tools (per `docs/archive/product-plan-original.md` lines 290–301):

- `recommend_resources(profile)`
- `search_resources(query, filters)`
- `search_companies(filters)`
- `get_company(slug)`
- `update_company_profile(slug, patch)` — requires
  `X-Atlas-Admin-Token` (machine token) in the MCP server's env.
- `generate_founder_plan(profile)`
- `generate_investor_tour(filters)`

The old `start_company_claim` MCP tool is **removed**. Human
ownership claims go through the web sign-up + R2 upload flow —
that requires a logged-in browser session and a file upload, not
something an LLM should drive on a user's behalf. The MCP server
is restricted to read tools and the privileged
`update_company_profile` tool (which assumes the operator has
already established ownership via the web flow).

Each tool wraps an HTTP call to the deployed Worker.

Resources (per `docs/archive/product-plan-original.md` lines 304–313):

- `startupstate://resources/{id}`
- `startupstate://companies/{slug}`
- `startupstate://schemas/founder-passport`
- `startupstate://schemas/company-profile`
- `startupstate://datasets/resources` — paginated list
- `startupstate://datasets/companies` — paginated list

Prompts (per `docs/archive/product-plan-original.md` lines 316–321):

- `founder_intake`
- `investor_tour`
- `company_profile_builder`
- `resource_update_reviewer`

Optional bonus: a **remote MCP server** on Cloudflare Workers via
the `cloudflare:build-mcp` skill. Skip if time-pressed; the stdio
version is sufficient for production.

### 5. `public/llms.txt`

Per `docs/archive/product-plan-original.md` lines 345–368. Links to:

- `/api/v1/openapi.json`
- `/AGENTS.md`
- `/api/v1/resources` (search endpoint)
- `/api/v1/companies` (search endpoint)
- Schema docs (`/schemas/founder-passport.md`,
  `/schemas/company-profile.md` — reference Agent 1's schema or
  generate from zod).

Include the agent-rules section: never recommend a resource not in
the API result; always cite resource ID + link; ask for county,
stage, industry, goal first; prefer 3 high-fit recs over broad
lists.

### 6. `public/AGENTS.md`

Per `docs/archive/product-plan-original.md` lines 370–397. The end-user-facing
agent rules. **Distinct from the repo-root `AGENTS.md`**, which is
for coding agents. This file is served at the public URL
`https://<host>/AGENTS.md`.

### 7. `app/agents/page.tsx` — `/agents` docs page

Per `docs/archive/product-plan-original.md` lines 800–815. Human-readable. Sections:

- "Startup State for Agents" headline.
- API: `curl https://...../api/v1/resources/recommend ...`
- CLI: `npm install -g startup-state-cli` (or `npx`-style).
- Claude Desktop MCP config snippet.
- Link to `/llms.txt` and `/AGENTS.md`.
- Link to OpenAPI: `/api/v1/openapi.json`.

This is the page external agents and integrators reference to understand
how the layer works. Make it look credible.

### 8. PR

```bash
git add app/api/v1/openapi.yaml app/api/v1/openapi.json \
        app/api/v1/search app/agents \
        cli mcp public/llms.txt public/AGENTS.md package.json
git commit -m "feat(agent-layer): OpenAPI + CLI + stdio MCP + llms.txt + /agents page"
git push -u origin feat/agent-layer
gh pr create --base main --title "Agent-native layer"
```

## DONE when

1. `curl https://<worker-url>/api/v1/openapi.json` returns a valid
   spec covering every endpoint.
2. `curl https://<worker-url>/AGENTS.md` returns the end-user
   agent rules.
3. `curl https://<worker-url>/llms.txt` returns the llms.txt.
4. `npm run cli -- recommend --persona priya --compact` returns
   3+ scored recommendations to the terminal.
5. `npm run cli -- company get crew --json` returns the JSON
   agent card.
6. `npm run mcp` launches the stdio MCP server. Probe it with
   the MCP Inspector or a Claude Desktop config:
   ```jsonc
   "mcpServers": {
     "startup-state": {
       "command": "npx", "args": ["startup-state-mcp"],
       "env": { "STARTUP_STATE_API_URL": "https://..." }
     }
   }
   ```
   The tools list returns 8 tools.
7. `/agents` page renders cleanly with curl examples, and is
   **responsive** at 375 / 768 / 1280px — code blocks scroll
   horizontally inside their own container (no page-level scroll
   on mobile), section nav collapses to a top sticky list on
   narrow widths.
8. PR open.

## Cuts allowed if time-pressed (in priority order)

1. **Skip the remote MCP** — local stdio is sufficient for initial
   launch.
2. **Skip MCP prompts and resources** — only ship the 8 tools.
3. **Skip the CLI's `profile build` subcommand** (the most
   ambitious one).
4. **Skip the search endpoint** — fall back to per-entity GETs.
5. **Stub OpenAPI** — bare-minimum YAML covering only the
   endpoints other agents actually wired. Better than no spec.

## Auth note (read this — it shapes your OpenAPI + tool surface)

The product uses a **dual auth model** for writes:

- **Web users** (humans clicking through Next.js) authenticate
  via Better Auth (email + password, sessions in D1). Their
  cookie travels automatically. Roles: `owner`, `goeo_admin`,
  `superadmin`. Owner edits are gated on
  `companies.claimed_by_user_id` matching their user id.
- **Machine clients** (your CLI + your MCP server + any
  external agent) use the `X-Atlas-Admin-Token` header. This is
  a service-account-style token validated against
  `env.ATLAS_ADMIN_TOKEN`. It bypasses Better Auth and assumes
  a privileged caller — but the route handler still enforces
  business rules.

Read endpoints are open to both. Your CLI/MCP **always** use
the machine token path; you don't impersonate human sessions.
Document this clearly in `public/AGENTS.md` and `public/llms.txt`
so external agents know how to call write endpoints.

## Common pitfalls

- **MCP SDK on Cloudflare Workers** — only works for stateless
  HTTP transport with the `McpAgent` from
  `cloudflare:build-mcp`. The stdio transport runs on Node.js
  locally only.
- **CLI distribution** — for the launch, external agents run
  `npm run cli -- <args>` from a checkout. Don't bother
  publishing to npm.
- **Bin entries on Workers** — bin entries are Node-only; they
  don't run on the Worker. Make sure `cli/index.ts` works in
  Node (no Cloudflare-specific imports).
- **OpenAPI YAML on Workers** — Workers don't have `node:fs`.
  Either embed the spec as a TS constant, generate it from zod
  via a build step, or fetch it from R2.
- **`public/AGENTS.md` collision** — this is *static asset*
  served at `/AGENTS.md`. The repo-root `/AGENTS.md` is dev
  policy. Make sure your `wrangler.jsonc` `assets` config
  serves `public/`.
- **Coordinate with Agent 2.** If they finalize the recommend
  shape after you write the OpenAPI, sync it. Use
  `docs/agent-tasks/openapi-additions.md` as the watching file.
