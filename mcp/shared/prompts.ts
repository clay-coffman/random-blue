// 4 MCP prompts that scaffold the canonical conversation patterns
// against the Startup State Atlas.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer) {
  // 1) founder_intake — guided collection of the required fields.
  server.registerPrompt(
    "founder_intake",
    {
      title: "Founder intake",
      description:
        "Walk a founder through the required fields (county, stage, industry, goal, communities) before calling recommend_resources.",
      argsSchema: {
        founder_handle: z
          .string()
          .optional()
          .describe("How the founder wants to be addressed"),
        starting_context: z
          .string()
          .optional()
          .describe("Anything the user has already shared (e.g. a website url, a pitch sentence)"),
      },
    },
    ({ founder_handle, starting_context }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `You are an intake assistant for the Startup State Atlas (Utah).` +
              ` Collect the founder's profile before recommending resources.\n\n` +
              `## Required\n` +
              `- county or city (Utah)\n` +
              `- stage (idea, pre_seed, mvp, paying_customers, growth, mature)\n` +
              `- industry (e.g. B2B SaaS, agriculture, manufacturing)\n` +
              `- goal (start_business, raise_seed_round, raise_growth_round, find_customers, hire, export, commercialize_research, find_workspace, find_mentors, scale_business)\n\n` +
              `## High-signal optional\n` +
              `- communities (women, veteran, student, rural, researcher)\n` +
              `- urgency (this_week, this_month, this_quarter, next_quarter, this_year)\n` +
              `- needs / constraints (free-text arrays)\n\n` +
              `## Rules\n` +
              `- Ask one question at a time. Be brief.\n` +
              `- ${
                founder_handle
                  ? `Address them as "${founder_handle}".`
                  : "Ask their name on first turn."
              }\n` +
              `- Once required fields are collected, call recommend_resources with an inline profile.\n` +
              `- Never invent resources. Cite resource_id and the source_url for every recommendation.\n\n` +
              (starting_context
                ? `## Context already provided\n${starting_context}\n`
                : ""),
          },
        },
      ],
    }),
  );

  // 2) investor_tour — frame an investor's thesis-driven walkthrough.
  server.registerPrompt(
    "investor_tour",
    {
      title: "Investor tour",
      description:
        "Guide an investor through filtering Utah companies by sector / stage / check size, then call generate_investor_tour.",
      argsSchema: {
        sector: z.string().optional(),
        stage: z.string().optional(),
        check_size: z.string().optional().describe("e.g. '$250k–$1M'"),
      },
    },
    ({ sector, stage, check_size }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `You are an analyst preparing a Utah company tour for an investor.\n\n` +
              `## Filters known so far\n` +
              `- sector: ${sector ?? "(ask)"}\n` +
              `- stage: ${stage ?? "(ask)"}\n` +
              `- check size: ${check_size ?? "(ask)"}\n\n` +
              `## Workflow\n` +
              `1. Confirm sector + stage + check size with the investor.\n` +
              `2. Call search_companies({ sector, stage }) to surface candidates.\n` +
              `3. For top 5, call get_company(slug) to pull description, hiring status, founding year.\n` +
              `4. Call generate_investor_tour({ sector, stage }) to produce the brief.\n` +
              `5. Recommend at most 5 stops. Cite slug + website. Never invent a company.`,
          },
        },
      ],
    }),
  );

  // 3) company_profile_builder — scaffolds an enrich → review → patch flow.
  server.registerPrompt(
    "company_profile_builder",
    {
      title: "Company profile builder",
      description:
        "Help an operator (or agent) build/refresh a company profile from a website url and emit a clean PATCH body.",
      argsSchema: {
        slug: z.string().describe("Existing company slug; use a placeholder for new companies."),
        website_url: z.string().describe("Company website (http/https)."),
      },
    },
    ({ slug, website_url }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `You are building a company profile for slug=${slug} from ${website_url}.\n\n` +
              `## Workflow\n` +
              `1. Use the founder_passports/enrich path (or your own fetch + summarisation) to extract: name, sector, stage, employee_count, founding_year, description.\n` +
              `2. Reconcile against get_company(slug) — only suggest changes for fields that improve the row.\n` +
              `3. Print a JSON PATCH body suitable for update_company_profile(slug, patch). Owner whitelist: name, website, description, sector, stage, employee_count, hiring_status, founding_year, logo_url, founder_team_json, lat, lng. Admin/machine may also edit slug, linkedin, address_text.\n` +
              `4. Do not call update_company_profile until the operator confirms the patch. NOTE: update_company_profile is exposed only on the LOCAL stdio MCP (\`npm run mcp\` with ATLAS_ADMIN_TOKEN in env). On the REMOTE /api/mcp endpoint the tool is not registered — emit the patch as JSON for the operator to apply via the local stdio MCP, the CLI (\`npm run cli -- company patch ...\`), or PATCH /api/v1/companies/<slug>.\n` +
              `5. Cite the website url for every claim. Mark anything you can't verify with confidence < 0.5.`,
          },
        },
      ],
    }),
  );

  // 4) resource_update_reviewer — admin review of a resource library edit.
  server.registerPrompt(
    "resource_update_reviewer",
    {
      title: "Resource update reviewer",
      description:
        "Review a proposed resource edit (title, description, kind, source_url, contact_email) before an admin merges it.",
      argsSchema: {
        resource_id: z.string().describe("Existing resource id, e.g. r_2628"),
        proposed_patch: z
          .string()
          .describe("JSON-encoded proposed patch object."),
      },
    },
    ({ resource_id, proposed_patch }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `You are a Utah GOED admin reviewing a proposed update to ${resource_id}.\n\n` +
              `## Proposed patch\n\n\`\`\`json\n${proposed_patch}\n\`\`\`\n\n` +
              `## Workflow\n` +
              `1. Call get_resource(${resource_id}) to read the current row.\n` +
              `2. Validate each proposed field: source_url must be http(s); contact_email must be a valid email; kind should match the existing vocabulary (funding, accelerator, mentorship, workspace, education, etc.).\n` +
              `3. Flag risky changes (URL host change, contact email outside the .org/.gov/.edu of the old contact).\n` +
              `4. Output a "review notes" section and an APPROVE / REJECT recommendation.\n` +
              `5. The MCP server cannot apply the change directly — admins land it through the web admin UI.`,
          },
        },
      ],
    }),
  );
}
