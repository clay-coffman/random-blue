// MCP tools split into two registration entry points so the remote
// Streamable-HTTP endpoint (app/api/mcp/route.ts, stateless
// `WebStandardStreamableHTTPServerTransport`) can stay strictly
// read-only while the local stdio server (mcp/server.ts) keeps the
// full surface for trusted operators.
//
//  - `registerReadTools` — 7 read tools (recommend / search / get /
//    plan / tour). Safe to expose unauthenticated.
//  - `registerWriteTools` — `update_company_profile` only.
//    Calls `PATCH /api/v1/companies/<slug>` with the worker-side
//    admin token. Local stdio only — see issue #35 for why this is
//    not on the public endpoint.
//
// Each tool wraps an HTTP call to the deployed Worker via
// `AtlasClient`.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  type AtlasClient,
  AtlasError,
  type RecommendBody,
} from "@/cli/lib/atlas-client";

function jsonText(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorText(err: unknown): CallToolResult {
  if (err instanceof AtlasError) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `error[${err.code}]: ${err.message}`,
        },
      ],
    };
  }
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `error: ${(err as Error).message ?? String(err)}`,
      },
    ],
  };
}

const stageEnum = z.enum([
  "idea",
  "pre_seed",
  "mvp",
  "paying_customers",
  "growth",
  "mature",
]);
const goalEnum = z.enum([
  "start_business",
  "raise_seed_round",
  "raise_growth_round",
  "find_customers",
  "hire",
  "export",
  "commercialize_research",
  "find_workspace",
  "find_mentors",
  "scale_business",
]);

const profileShape = {
  passport_id: z.string().optional().describe("Pre-existing fp_<id>; use this OR a body, not both."),
  county: z.string().optional(),
  city: z.string().optional(),
  stage: stageEnum.optional(),
  industry: z.string().optional(),
  communities: z.array(z.string()).optional(),
  goal: goalEnum.optional(),
  urgency: z.string().optional(),
  needs: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  website_url: z.string().url().optional(),
};

export function registerReadTools(server: McpServer, client: AtlasClient) {
  // 1) recommend_resources
  server.registerTool(
    "recommend_resources",
    {
      title: "Recommend Utah resources",
      description:
        "Score and bucket Utah resources for a founder profile. Pass passport_id (one of fp_jordan, fp_maria, fp_marcus, fp_priya, fp_david, fp_amir) OR an inline profile body.",
      inputSchema: profileShape,
    },
    async (args) => {
      try {
        const body: RecommendBody = { ...args };
        if (body.passport_id) {
          // Conflicting fields would 400; let the saved row win.
          delete body.stage;
          delete body.industry;
          delete body.goal;
        }
        const result = await client.recommend(body);
        return jsonText(result);
      } catch (err) {
        return errorText(err);
      }
    },
  );

  // 2) search_resources
  server.registerTool(
    "search_resources",
    {
      title: "Search startup resources",
      description: "Free-text search the Utah resource library by title and description.",
      inputSchema: {
        query: z.string().describe("Free-text query"),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ query, limit }) => {
      try {
        const out = await client.listResources(query, limit);
        return jsonText(out);
      } catch (err) {
        return errorText(err);
      }
    },
  );

  // 3) get_resource
  server.registerTool(
    "get_resource",
    {
      title: "Get a resource by id",
      description: "Fetch a single resource (e.g. r_2628). Use this to verify a citation before recommending.",
      inputSchema: {
        id: z.string().describe("Resource id, e.g. r_2628"),
      },
    },
    async ({ id }) => {
      try {
        const out = await client.getResource(id);
        return jsonText(out);
      } catch (err) {
        return errorText(err);
      }
    },
  );

  // 4) search_companies
  server.registerTool(
    "search_companies",
    {
      title: "Search Utah companies",
      description:
        "Search companies by free-text plus optional sector/stage/employee filters. The sector and stage filters are substring-matched client-side.",
      inputSchema: {
        query: z.string().optional(),
        sector: z.string().optional(),
        stage: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ query, sector, stage, limit }) => {
      try {
        const out = await client.listCompanies(query ?? sector, limit);
        const filtered = out.companies.filter((c) => {
          if (sector && !(c.sector ?? "").toLowerCase().includes(sector.toLowerCase()))
            return false;
          if (stage && !(c.stage ?? "").toLowerCase().includes(stage.toLowerCase()))
            return false;
          return true;
        });
        return jsonText({ companies: filtered });
      } catch (err) {
        return errorText(err);
      }
    },
  );

  // 5) get_company
  server.registerTool(
    "get_company",
    {
      title: "Get a company by slug",
      description: "Fetch the full Utah company profile by slug (e.g. crew, divvy).",
      inputSchema: {
        slug: z.string().describe("Company slug"),
      },
    },
    async ({ slug }) => {
      try {
        const out = await client.getCompany(slug);
        return jsonText(out);
      } catch (err) {
        return errorText(err);
      }
    },
  );

  // 7) generate_founder_plan
  server.registerTool(
    "generate_founder_plan",
    {
      title: "Generate a founder plan",
      description:
        "Wraps recommend and produces a tightly-formatted plan: top recommendations grouped by bucket (now / next), with action notes. Same inputs as recommend_resources.",
      inputSchema: profileShape,
    },
    async (args) => {
      try {
        const body: RecommendBody = { ...args };
        if (body.passport_id) {
          delete body.stage;
          delete body.industry;
          delete body.goal;
        }
        const r = await client.recommend(body);
        const groups: Record<string, typeof r.recommendations> = {
          now: [],
          next: [],
        };
        for (const rec of r.recommendations) {
          if (rec.bucket === "now" || rec.bucket === "next") {
            groups[rec.bucket].push(rec);
          }
        }
        const lines = [
          `# Founder plan (passport ${r.passport_id})`,
          "",
          `Generated ${r.generated_at}`,
          "",
        ];
        for (const bucket of ["now", "next"] as const) {
          const items = groups[bucket];
          if (items.length === 0) continue;
          lines.push(`## ${bucket === "now" ? "Do now" : "Do next"}`);
          lines.push("");
          for (const rec of items) {
            lines.push(`### ${rec.title} (${rec.resource_id}, score ${rec.score})`);
            if (rec.because) lines.push(rec.because);
            if (rec.reasons.length > 0)
              lines.push(`Reasons: ${rec.reasons.slice(0, 4).join("; ")}`);
            if (rec.source_url) lines.push(`Link: ${rec.source_url}`);
            if (rec.contact_email) lines.push(`Contact: ${rec.contact_email}`);
            lines.push("");
          }
        }
        return {
          content: [{ type: "text", text: lines.join("\n").trimEnd() }],
        };
      } catch (err) {
        return errorText(err);
      }
    },
  );

  // 8) generate_investor_tour
  server.registerTool(
    "generate_investor_tour",
    {
      title: "Generate an investor tour",
      description:
        "Curate Utah companies for a thesis-driven tour. Filters by sector and stage; returns a Markdown brief with stop-by-stop notes.",
      inputSchema: {
        sector: z
          .string()
          .optional()
          .describe("Sector substring (e.g. 'fintech', 'medical_device')"),
        stage: z
          .string()
          .optional()
          .describe("Stage substring (e.g. 'seed', 'growth')"),
        limit: z.number().int().min(1).max(20).optional(),
      },
    },
    async ({ sector, stage, limit }) => {
      try {
        const search = sector ?? stage ?? "";
        const out = await client.listCompanies(search, limit ?? 10);
        const stops = out.companies.filter((c) => {
          if (sector && !(c.sector ?? "").toLowerCase().includes(sector.toLowerCase()))
            return false;
          if (stage && !(c.stage ?? "").toLowerCase().includes(stage.toLowerCase()))
            return false;
          return true;
        });
        const lines = [
          `# Utah investor tour`,
          "",
          `Filter: ${[
            sector && `sector=${sector}`,
            stage && `stage=${stage}`,
          ]
            .filter(Boolean)
            .join(", ") || "(none)"}`,
          "",
        ];
        if (stops.length === 0) {
          lines.push("No companies matched. Loosen filters or try different terms.");
        }
        for (let i = 0; i < stops.length; i++) {
          const c = stops[i];
          lines.push(`## ${i + 1}. ${c.name}  (${c.slug})`);
          if (c.sector || c.stage)
            lines.push(`  ${c.sector ?? "—"} · ${c.stage ?? "—"}`);
          if (c.website) lines.push(`  ${c.website}`);
          lines.push(`  status: ${c.status}`);
          lines.push("");
        }
        return {
          content: [{ type: "text", text: lines.join("\n").trimEnd() }],
        };
      } catch (err) {
        return errorText(err);
      }
    },
  );
}

// Write tools — local stdio MCP only. The remote /api/mcp endpoint
// constructs the AtlasClient WITHOUT an admin token, so even if a
// future caller wires this in by mistake, the hasAdminToken() check
// below refuses (defense-in-depth — the real protection is that
// app/api/mcp/route.ts never invokes this function).
export function registerWriteTools(server: McpServer, client: AtlasClient) {
  server.registerTool(
    "update_company_profile",
    {
      title: "Update a company profile (privileged)",
      description:
        "Apply a partial update to a company. Requires the X-Atlas-Admin-Token header (the MCP server reads ATLAS_ADMIN_TOKEN from env). Refuses when no token is configured. Local stdio MCP only — not exposed via the remote /api/mcp endpoint.",
      inputSchema: {
        slug: z.string(),
        patch: z
          .record(z.string(), z.unknown())
          .describe(
            "Partial update body. Fields: name, website, description, sector, stage, employee_count, hiring_status, founding_year, logo_url, founder_team_json, lat, lng, slug (admin), linkedin (admin), address_text (admin).",
          ),
      },
    },
    async ({ slug, patch }) => {
      if (!client.hasAdminToken()) {
        return errorText(
          new AtlasError({
            code: "missing_admin_token",
            message:
              "Set ATLAS_ADMIN_TOKEN before calling update_company_profile.",
            status: 0,
          }),
        );
      }
      try {
        const out = await client.patchCompany(slug, patch);
        return jsonText(out);
      } catch (err) {
        return errorText(err);
      }
    },
  );
}
