#!/usr/bin/env tsx

// Local stdio MCP server. Wraps the public Startup State Atlas API
// for clients like Claude Desktop, Cursor, MCP Inspector, etc.
//
// Configuration (env vars):
//   STARTUP_STATE_API_URL  — base url, default http://localhost:3000
//   ATLAS_ADMIN_TOKEN      — required for update_company_profile
//
// Local dev: `npm run mcp` (kept running by the MCP client).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAtlasClient } from "@/cli/lib/atlas-client";
import {
  registerReadTools,
  registerWriteTools,
} from "@/mcp/shared/tools";
import { registerResources } from "@/mcp/shared/resources";
import { registerPrompts } from "@/mcp/shared/prompts";

async function main() {
  const client = createAtlasClient();
  const server = new McpServer(
    {
      name: "startup-state",
      version: "1.0.0",
    },
    {
      // Document the layer at server-info level so clients can show
      // it in their UI without an extra prompt.
      instructions: [
        "Startup State Atlas — Utah's startup ecosystem API.",
        "",
        "Read endpoints are public. Writes use X-Atlas-Admin-Token (set ATLAS_ADMIN_TOKEN in env).",
        "Required intake fields: county/city, stage, industry, goal. Six seeded personas exist (fp_jordan, fp_maria, fp_marcus, fp_priya, fp_david, fp_amir).",
        "",
        "Never recommend a resource that does not appear in an API result. Always cite resource_id and link.",
      ].join("\n"),
    },
  );

  // Local stdio: full surface (read + write). Operators run this
  // themselves with their own ATLAS_ADMIN_TOKEN.
  registerReadTools(server, client);
  registerWriteTools(server, client);
  registerResources(server, client);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: Error) => {
  // Stderr is the only safe output channel — stdout is the JSON-RPC
  // wire format.
  process.stderr.write(`mcp server fatal: ${err.message}\n`);
  process.exit(1);
});
