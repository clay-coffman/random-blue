import { describe, expect, it } from "vitest";
import {
  registerReadTools,
  registerWriteTools,
} from "@/mcp/shared/tools";
import { createAtlasClient } from "@/cli/lib/atlas-client";

// Lock in the read/write split so the public /api/mcp endpoint can
// never accidentally regain a write tool. If a future refactor adds
// `update_company_profile` (or any other write) to registerReadTools,
// this suite fails — and so does the security guarantee from #35.

const READ_TOOLS = [
  "recommend_resources",
  "search_resources",
  "get_resource",
  "search_companies",
  "get_company",
  "generate_founder_plan",
  "generate_investor_tour",
];

function makeMockServer() {
  const registered: string[] = [];
  // The real McpServer.registerTool signature is rich; we only care
  // about the first argument (tool name) for these assertions.
  const server = {
    registerTool: (name: string) => {
      registered.push(name);
    },
  } as unknown as Parameters<typeof registerReadTools>[0];
  return { registered, server };
}

describe("MCP tool registration split", () => {
  const client = createAtlasClient({ baseUrl: "http://test.invalid" });

  it("registerReadTools registers exactly the 7 read tools (no writes)", () => {
    const { registered, server } = makeMockServer();
    registerReadTools(server, client);
    expect(registered.sort()).toEqual([...READ_TOOLS].sort());
    expect(registered).not.toContain("update_company_profile");
  });

  it("registerWriteTools registers update_company_profile and only that", () => {
    const { registered, server } = makeMockServer();
    registerWriteTools(server, client);
    expect(registered).toEqual(["update_company_profile"]);
  });

  it("read and write registration sets are disjoint", () => {
    const { registered: readSet, server: rServer } = makeMockServer();
    const { registered: writeSet, server: wServer } = makeMockServer();
    registerReadTools(rServer, client);
    registerWriteTools(wServer, client);
    const overlap = readSet.filter((n) => writeSet.includes(n));
    expect(overlap).toEqual([]);
  });
});
