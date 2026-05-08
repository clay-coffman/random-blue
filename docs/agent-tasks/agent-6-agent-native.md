# Agent 6 — Agent-native layer

You build the hidden superpower: REST API contract, CLI, MCP server,
`/llms.txt`, the end-user `/AGENTS.md`, and the `/agents` doc page.
This is the "infrastructure that judges can see in 20 seconds."
Aim for ~120 minutes.

## Branch + worktree

- **Worktree:** `wt[1-3]` (whichever is free). Can run in parallel
  with Agent 2 — coordinate on `app/api/v1/openapi.yaml`.
- **Branch:** `feat/agent-layer`. First action:
  `git checkout -b feat/agent-layer`.

## Reads first

1. `docs/agent-tasks/00-shared-context.md`
2. `docs/architecture.md` — repo layout (`cli/`, `mcp/`, `public/`).
3. `docs/requirements.md` — Agent-native layer.
4. `docs/hackathon-plan.md` lines 196–397 (API + CLI + MCP +
   llms.txt + AGENTS.md spec).
5. The **`cloudflare:build-mcp`** loaded skill — required reading
   if you go remote MCP.
6. `docs/agent-tasks/openapi-additions.md` (Agent 2 writes this) —
   the recommend endpoint shape.
7. The MCP spec: <https://modelcontextprotocol.io/specification/>
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
- `POST /api/v1/companies/claim`
- `PATCH /api/v1/companies/:slug` (with `X-Atlas-Admin-Token`)
- `GET /api/v1/search`
- `GET /api/v1/openapi.json`

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
- `startup-state company claim <slug> --domain <d> --email <e>`
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
local Claude Desktop demo.

Tools (per `docs/hackathon-plan.md` lines 290–301):

- `recommend_resources(profile)`
- `search_resources(query, filters)`
- `search_companies(filters)`
- `get_company(slug)`
- `start_company_claim(company_name, domain_email)`
- `update_company_profile(slug, patch)` — requires admin token in
  config.
- `generate_founder_plan(profile)`
- `generate_investor_tour(filters)`

Each tool wraps an HTTP call to the deployed Worker.

Resources (per plan lines 304–313):

- `startupstate://resources/{id}`
- `startupstate://companies/{slug}`
- `startupstate://schemas/founder-passport`
- `startupstate://schemas/company-profile`
- `startupstate://datasets/resources` — paginated list
- `startupstate://datasets/companies` — paginated list

Prompts (per plan lines 316–321):

- `founder_intake`
- `investor_tour`
- `company_profile_builder`
- `resource_update_reviewer`

Optional bonus: a **remote MCP server** on Cloudflare Workers via
the `cloudflare:build-mcp` skill. Skip if time-pressed; the stdio
version is enough for the demo.

### 5. `public/llms.txt`

Per `docs/hackathon-plan.md` lines 345–368. Links to:

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

Per `docs/hackathon-plan.md` lines 370–397. The end-user-facing
agent rules. **Distinct from the repo-root `AGENTS.md`**, which is
for coding agents. This file is served at the public URL
`https://<host>/AGENTS.md`.

### 7. `app/agents/page.tsx` — `/agents` docs page

Per `docs/hackathon-plan.md` lines 800–815. Human-readable. Sections:

- "Startup State for Agents" headline.
- API: `curl https://...../api/v1/resources/recommend ...`
- CLI: `npm install -g startup-state-cli` (or `npx`-style).
- Claude Desktop MCP config snippet.
- Link to `/llms.txt` and `/AGENTS.md`.
- Link to OpenAPI: `/api/v1/openapi.json`.

This is the page judges click to "see how the agent layer works."
Make it look credible.

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
7. `/agents` page renders cleanly with curl examples.
8. PR open.

## Demo path

**Scene 5 (Terminal / MCP proof)** of the demo script. The CLI
demo + the `/agents` page are the "hidden superpower" reveal.

## Cuts allowed if time-pressed (in priority order)

1. **Skip the remote MCP** — local stdio is enough for the demo.
2. **Skip MCP prompts and resources** — only ship the 8 tools.
3. **Skip the CLI's `profile build` subcommand** (the most
   ambitious one).
4. **Skip the search endpoint** — fall back to per-entity GETs.
5. **Stub OpenAPI** — bare-minimum YAML covering only the
   endpoints other agents actually wired. Better than no spec.

## Common pitfalls

- **MCP SDK on Cloudflare Workers** — only works for stateless
  HTTP transport with the `McpAgent` from
  `cloudflare:build-mcp`. The stdio transport runs on Node.js
  locally only.
- **CLI distribution** — for the hackathon, agents/judges run
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
