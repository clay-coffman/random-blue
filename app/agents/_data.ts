// Static content for /agents. Kept out of the page module so it can
// be imported by both the server-rendered shell (page.tsx) and the
// client-side tabs island (AgentSurfaceTabs.tsx).

export type InstallCard = {
  name: string;
  kicker: string;
  body: string;
  cta: string;
  href?: string;
  primary?: boolean;
};

export const installCards: InstallCard[] = [
  {
    name: "Install in Claude",
    kicker: "Claude Desktop",
    body: "Drop the MCP block into your Claude config. Eight tools, six resources, four guided prompts.",
    cta: "Show config",
    primary: true,
  },
  {
    name: "Run from terminal",
    kicker: "CLI",
    body: "`npm run cli -- recommend --persona priya` from a checkout. Same surface as the API.",
    cta: "See commands",
  },
  {
    name: "Read the API",
    kicker: "OpenAPI 3.1",
    body: "Every public endpoint, with request/response schemas and the dual-auth model.",
    cta: "Open spec",
    href: "/api/v1/openapi.json",
  },
  {
    name: "Agent rules",
    kicker: "AGENTS.md",
    body: "What an external agent must do before recommending or writing. Read this first.",
    cta: "Read rules",
    href: "/AGENTS.md",
  },
];

export type Endpoint = {
  method: string;
  path: string;
  summary: string;
  auth?: string;
};

export const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/resources/recommend",
    summary: "Score Utah resources for a founder profile (or persona id).",
  },
  {
    method: "GET",
    path: "/api/v1/founder-passports/{id}/plan",
    summary: "Re-read a cached recommendation set.",
  },
  {
    method: "POST",
    path: "/api/v1/founder-passports",
    summary: "Persist a founder profile without scoring.",
  },
  {
    method: "POST",
    path: "/api/v1/founder-passports/enrich",
    summary: "Extract intake fields from a website url (LLM-powered).",
  },
  {
    method: "GET",
    path: "/api/v1/resources",
    summary: "Free-text search across the resource library.",
  },
  {
    method: "GET",
    path: "/api/v1/companies",
    summary: "Search Utah companies by name / slug / website.",
  },
  {
    method: "GET",
    path: "/api/v1/companies/{slug}",
    summary: "Fetch a single company profile.",
  },
  {
    method: "PATCH",
    path: "/api/v1/companies/{slug}",
    summary: "Update a company profile (owner / admin / machine).",
    auth: "session or X-Atlas-Admin-Token",
  },
  {
    method: "POST",
    path: "/api/v1/ownership-submissions",
    summary: "Upload an ownership-proof document (multipart, ≤10MB).",
    auth: "session",
  },
  {
    method: "GET",
    path: "/api/v1/search",
    summary: "Generic search across resources + companies.",
  },
  {
    method: "GET",
    path: "/api/v1/openapi.json",
    summary: "This API as JSON.",
  },
];

export type CliCommand = {
  command: string;
  summary: string;
};

export const cliCommands: CliCommand[] = [
  {
    command: "npm run cli -- recommend --persona priya --compact",
    summary: "Score resources for the Priya seed-stage SaaS persona.",
  },
  {
    command: "npm run cli -- recommend --county 'Salt Lake' --stage mvp --industry 'b2b saas' --goal raise_seed_round --json",
    summary: "Score resources for an inline founder profile.",
  },
  {
    command: "npm run cli -- map search --sector fintech --employees 2-10 --json",
    summary: "Filter companies by sector + employee range.",
  },
  {
    command: "npm run cli -- company get alcomy --json",
    summary: "Read a single company profile as JSON.",
  },
  {
    command: "ATLAS_ADMIN_TOKEN=<token> npm run cli -- company patch alcomy --field description='Updated bio.' --field stage=growth",
    summary: "Update a company (requires ATLAS_ADMIN_TOKEN).",
  },
  {
    command: "npm run cli -- profile build --company NewCo --from-url https://newco.com --emit md,json,llms",
    summary: "Generate three artifact files from a website url.",
  },
];

export type McpTool = {
  name: string;
  summary: string;
  privileged?: boolean;
  /**
   * Tool is registered only by the local stdio MCP server
   * (`npm run mcp`); the remote /api/mcp endpoint refuses it.
   * See issue #35.
   */
  localOnly?: boolean;
};

export const mcpTools: McpTool[] = [
  {
    name: "recommend_resources",
    summary: "Score resources for a profile or passport_id.",
  },
  {
    name: "search_resources",
    summary: "Free-text resource search.",
  },
  { name: "get_resource", summary: "Fetch a resource by id." },
  {
    name: "search_companies",
    summary: "Search companies with optional sector / stage filters.",
  },
  { name: "get_company", summary: "Fetch a company by slug." },
  {
    name: "update_company_profile",
    summary:
      "Apply a partial company update (writes). Local stdio MCP only — exposed via `npm run mcp` with ATLAS_ADMIN_TOKEN in env, NOT via the remote /api/mcp endpoint.",
    privileged: true,
    localOnly: true,
  },
  {
    name: "generate_founder_plan",
    summary: "Produce a Markdown plan from recommend output.",
  },
  {
    name: "generate_investor_tour",
    summary: "Curate a thesis-driven Utah company tour.",
  },
];

export const mcpResources = [
  "startupstate://resources/{id}",
  "startupstate://companies/{slug}",
  "startupstate://schemas/founder-passport",
  "startupstate://schemas/company-profile",
  "startupstate://datasets/resources",
  "startupstate://datasets/companies",
];

export const mcpPrompts = [
  { name: "founder_intake", summary: "Guided collection of required intake fields." },
  { name: "investor_tour", summary: "Frame an investor's thesis-driven walkthrough." },
  {
    name: "company_profile_builder",
    summary: "Build a company PATCH body from a website url.",
  },
  {
    name: "resource_update_reviewer",
    summary: "Admin review of a resource library edit.",
  },
];

// Local stdio config — points at a checkout via tsx so end users
// don't need a published npm package. Replace `<absolute-path>` with
// the path where you cloned the repo. Authentication is optional
// (read tools work without it; only update_company_profile requires
// ATLAS_ADMIN_TOKEN).
export const claudeDesktopConfig = `{
  "mcpServers": {
    "startup-state": {
      "command": "npx",
      "args": ["-y", "tsx", "<absolute-path>/mcp/server.ts"],
      "env": {
        "STARTUP_STATE_API_URL": "https://startupstateatlas.dev",
        "ATLAS_ADMIN_TOKEN": "<optional-token>"
      }
    }
  }
}`;

export const remoteMcpExample = `# Streamable HTTP transport (no install required)
curl -N https://startupstateatlas.dev/api/mcp \\
  -X POST \\
  -H 'Accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

export const curlExample = `curl https://startupstateatlas.dev/api/v1/resources/recommend \\
  -X POST -H 'Content-Type: application/json' \\
  -d '{
    "passport_id": "fp_priya"
  }' | jq .recommendations[0]`;

export const cliInstallExample = `git clone https://github.com/utah-goed/startup-state-atlas
cd startup-state-atlas && npm install
export STARTUP_STATE_API_URL=https://startupstateatlas.dev
# ATLAS_ADMIN_TOKEN is only needed for write subcommands.
npm run cli -- recommend --persona priya --compact`;

export const agentRules = [
  "Never recommend a resource that does not appear in an API result.",
  "Always cite the resource_id and source_url. No fabrications.",
  "Ask county / stage / industry / goal before recommending.",
  "Prefer 3 high-fit results over broad lists.",
  "For company facts, call GET /api/v1/companies/{slug} — don't invent.",
  "For ownership claims, send users to the web /sign-up + R2 upload flow.",
  "Send X-Atlas-Admin-Token on every write request. Never impersonate human sessions.",
];
