// Remote MCP endpoint. Implements the MCP Streamable HTTP transport
// in stateless mode using `WebStandardStreamableHTTPServerTransport`
// from `@modelcontextprotocol/sdk`.
//
// Stateless was chosen over the Cloudflare McpAgent (Durable Object)
// pattern: our tools wrap stateless API calls and don't benefit from
// session resume; meanwhile, exporting a Durable Object class through
// the OpenNext-generated Worker entry would require a custom worker
// wrapper. The stateless transport ships in one file and works on
// edge runtime out of the box.
//
// Tools, resources, and prompts are shared with the local stdio MCP
// server in `mcp/server.ts` via `mcp/shared/*`.

import { NextResponse } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createAtlasClient } from "@/cli/lib/atlas-client";
import { registerReadTools } from "@/mcp/shared/tools";
import { registerResources } from "@/mcp/shared/resources";
import { registerPrompts } from "@/mcp/shared/prompts";

// On OpenNext-Cloudflare the entire app bundles as one Worker — the
// route-level `runtime = "edge"` annotation isn't needed (Workers IS
// the edge runtime) and OpenNext's bundler refuses to ship this route
// alongside the default function when it's marked edge. Stateless
// transport: each request spins up a fresh server + transport.
export const dynamic = "force-dynamic";

async function handleMcpRequest(req: Request): Promise<Response> {
  // Public, unauthenticated MCP endpoint. Read tools only —
  // `update_company_profile` (and any other writes) are local-stdio
  // only (see mcp/server.ts) because routing them through here would
  // need the worker's admin token and would expose privileged writes
  // to anyone on the internet. See issue #35.
  //
  // Self-target the deployed worker so tools don't bounce out to the
  // open internet for an in-Worker call.
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // No admin token — defense-in-depth so a future refactor that
  // accidentally registers a write tool on this surface still can't
  // make a privileged call. The explicit `adminToken: ""` matters:
  // the `??` fallback in createAtlasClient (cli/lib/atlas-client.ts)
  // only fires on null/undefined, so passing "" defeats the
  // process.env.ATLAS_ADMIN_TOKEN lookup. Today that env var is
  // unset on the Worker (secrets come through env()), but we don't
  // want a future build/runtime change to silently re-arm writes.
  const client = createAtlasClient({ baseUrl, adminToken: "" });

  const server = new McpServer(
    {
      name: "startup-state",
      version: "1.0.0",
    },
    {
      instructions: [
        "Startup State Atlas — Utah's startup ecosystem API (remote MCP, read-only).",
        "",
        "Read endpoints are public. Write tools (e.g. update_company_profile) are exposed only via the local stdio MCP server (`npm run mcp` from a checkout with ATLAS_ADMIN_TOKEN in env).",
        "Required intake fields: county/city, stage, industry, goal.",
        "",
        "Never recommend a resource that does not appear in an API result. Always cite resource_id and link.",
      ].join("\n"),
    },
  );

  registerReadTools(server, client);
  registerResources(server, client);
  registerPrompts(server);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "internal",
          message: (err as Error).message ?? "MCP transport error.",
        },
      },
      { status: 500 },
    );
  }
}

export const GET = handleMcpRequest;
export const POST = handleMcpRequest;
export const DELETE = handleMcpRequest;
