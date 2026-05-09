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
import { registerTools } from "@/mcp/shared/tools";
import { registerResources } from "@/mcp/shared/resources";
import { registerPrompts } from "@/mcp/shared/prompts";

// Edge runtime: the MCP protocol uses Web-Standard Request/Response
// objects, no `node:fs` / `node:http` access is needed. Stateless mode
// means no DO/KV; each request spins up a fresh server + transport.
export const runtime = "edge";
export const dynamic = "force-dynamic";

async function handleMcpRequest(req: Request): Promise<Response> {
  // The remote MCP server uses the SAME backing API as the stdio
  // server. Tools call public read endpoints unauthenticated and use
  // ATLAS_ADMIN_TOKEN (worker secret) for `update_company_profile`.
  //
  // Self-target the deployed worker so tools don't bounce out to the
  // open internet for an in-Worker call.
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const client = createAtlasClient({
    baseUrl,
    adminToken: process.env.ATLAS_ADMIN_TOKEN,
  });

  const server = new McpServer(
    {
      name: "startup-state",
      version: "1.0.0",
    },
    {
      instructions: [
        "Startup State Atlas — Utah's startup ecosystem API (remote MCP).",
        "",
        "Read endpoints are public. Writes use ATLAS_ADMIN_TOKEN configured on the worker.",
        "Required intake fields: county/city, stage, industry, goal.",
        "",
        "Never recommend a resource that does not appear in an API result. Always cite resource_id and link.",
      ].join("\n"),
    },
  );

  registerTools(server, client);
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
