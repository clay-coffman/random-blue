// 6 MCP resources exposed under the `startupstate://` URI scheme.
// Two are static schema documents; two are paginated dataset listings;
// two are dynamic templates parameterised by `id` / `slug`.

import {
  type McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import type { AtlasClient } from "@/cli/lib/atlas-client";

const FOUNDER_PASSPORT_SCHEMA_DOC = `# Founder Passport

Required fields when calling \`POST /api/v1/resources/recommend\` or
\`POST /api/v1/founder-passports\`. All wire fields are snake_case.

| Field | Required | Notes |
| --- | --- | --- |
| stage | yes | One of: idea, pre_seed, mvp, paying_customers, growth, mature |
| industry | yes | Free-text |
| goal | yes | One of: start_business, raise_seed_round, raise_growth_round, find_customers, hire, export, commercialize_research, find_workspace, find_mentors, scale_business |
| county | no | Utah county |
| city | no | Utah city |
| communities | no | Array of strings (e.g. women, veteran, student, rural, researcher) |
| urgency | no | this_week, this_month, this_quarter, next_quarter, this_year |
| business_size | no | Free-text |
| business_type | no | Free-text |
| needs | no | Array of strings |
| constraints | no | Array of strings |
| website_url | no | http(s) only |
| enrichment_source | no | Set when prefilled via /enrich |

The full zod schema lives at \`schemas/founder-passport.ts\`.
`;

const COMPANY_PROFILE_SCHEMA_DOC = `# Company Profile

Returned by \`GET /api/v1/companies\` (summary) and \`GET /api/v1/companies/{slug}\` (full).

## Summary fields (list endpoint)

| Field | Type |
| --- | --- |
| id | string (co_*) |
| slug | string |
| name | string |
| website | string \\| null |
| sector | string \\| null |
| stage | string \\| null |
| employee_count | string \\| null |
| city | string \\| null |
| county | string \\| null |
| status | "claimed" \\| "pending" \\| "unclaimed" |

## Full row (single get)

Adds: description, hiring_status, founding_year, logo_url,
founder_team_json, lat, lng, address_text, linkedin,
claimed_by_user_id, verified_at, claimed_at, plus the audit
columns last_updated_by / last_updated_at.

## Owner-edit whitelist

Owners may PATCH only: name, website, description, sector, stage,
employee_count, hiring_status, founding_year, logo_url,
founder_team_json, lat, lng. Admins (goeo_admin, superadmin) and
machine clients (X-Atlas-Admin-Token) may also edit slug, linkedin,
address_text.
`;

function textResource(uri: string, text: string): ReadResourceResult {
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text,
      },
    ],
  };
}

function jsonResource(uri: string, data: unknown): ReadResourceResult {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function registerResources(server: McpServer, client: AtlasClient) {
  // 1) Founder passport schema (static markdown).
  server.registerResource(
    "founder-passport-schema",
    "startupstate://schemas/founder-passport",
    {
      title: "Founder Passport schema",
      description: "Required fields and vocabulary for /resources/recommend.",
      mimeType: "text/markdown",
    },
    async (uri) => textResource(uri.toString(), FOUNDER_PASSPORT_SCHEMA_DOC),
  );

  // 2) Company profile schema (static markdown).
  server.registerResource(
    "company-profile-schema",
    "startupstate://schemas/company-profile",
    {
      title: "Company Profile schema",
      description: "Owner / admin / machine edit surfaces for companies.",
      mimeType: "text/markdown",
    },
    async (uri) => textResource(uri.toString(), COMPANY_PROFILE_SCHEMA_DOC),
  );

  // 3) Resources dataset (paginated list of all resources).
  server.registerResource(
    "resources-dataset",
    "startupstate://datasets/resources",
    {
      title: "Resources dataset",
      description:
        "Full Utah resources library as JSON. Use the search_resources tool for filtered lookups.",
      mimeType: "application/json",
    },
    async (uri) => {
      const out = await client.listResources(undefined, 100);
      return jsonResource(uri.toString(), out);
    },
  );

  // 4) Companies dataset (paginated list of all companies).
  server.registerResource(
    "companies-dataset",
    "startupstate://datasets/companies",
    {
      title: "Companies dataset",
      description:
        "Utah company directory as JSON. Use the search_companies tool for filtered lookups.",
      mimeType: "application/json",
    },
    async (uri) => {
      const out = await client.listCompanies(undefined, 50);
      return jsonResource(uri.toString(), out);
    },
  );

  // 5) Per-resource template (resource id is dynamic).
  server.registerResource(
    "resource",
    new ResourceTemplate("startupstate://resources/{id}", {
      list: async () => {
        const out = await client.listResources(undefined, 100);
        return {
          resources: out.resources.map((r) => ({
            uri: `startupstate://resources/${r.id}`,
            name: r.title,
            mimeType: "application/json",
          })),
        };
      },
    }),
    {
      title: "Resource by id",
      description: "Fetch one resource (e.g. r_2628) as JSON.",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const id = String(
        Array.isArray(vars.id) ? vars.id[0] : (vars.id ?? ""),
      );
      if (!id) {
        return jsonResource(uri.toString(), {
          error: { code: "bad_request", message: "Missing id." },
        });
      }
      const out = await client.getResource(id);
      return jsonResource(uri.toString(), out);
    },
  );

  // 6) Per-company template (slug is dynamic).
  server.registerResource(
    "company",
    new ResourceTemplate("startupstate://companies/{slug}", {
      list: async () => {
        const out = await client.listCompanies(undefined, 50);
        return {
          resources: out.companies.map((c) => ({
            uri: `startupstate://companies/${c.slug}`,
            name: c.name,
            mimeType: "application/json",
          })),
        };
      },
    }),
    {
      title: "Company by slug",
      description: "Fetch one company (e.g. crew) as JSON.",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const slug = String(
        Array.isArray(vars.slug) ? vars.slug[0] : (vars.slug ?? ""),
      );
      if (!slug) {
        return jsonResource(uri.toString(), {
          error: { code: "bad_request", message: "Missing slug." },
        });
      }
      const out = await client.getCompany(slug);
      return jsonResource(uri.toString(), out);
    },
  );
}
