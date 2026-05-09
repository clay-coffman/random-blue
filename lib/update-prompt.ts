// Builds the structured prompt template the "Update with Claude/ChatGPT"
// button copies to the user's clipboard. Per docs/product-plan.md
// lines 498–501, this is the agent-handoff path: the owner pastes the
// prompt into Claude / ChatGPT (configured with the X-Atlas-Admin-Token
// in their MCP / system prompt) and the agent crafts a PATCH call.

import type { CompanyCard } from "@/lib/company-card";

const OWNER_EDITABLE_FIELDS = [
  "name",
  "website",
  "description",
  "sector",
  "stage",
  "employee_count",
  "hiring_status",
  "founding_year",
  "logo_url",
  "founder_team_json",
  "lat",
  "lng",
] as const;

export function buildUpdatePrompt(card: CompanyCard, baseUrl?: string): string {
  const root = baseUrl ?? "https://startupstateatlas.dev";
  const url = `${root}/api/v1/companies/${card.slug}`;
  const current = JSON.stringify(
    {
      slug: card.slug,
      name: card.name,
      website: card.website,
      description: card.description,
      sector: card.sector,
      stage: card.stage,
      employee_count: card.employee_count,
      hiring_status: card.hiring_status,
      founding_year: card.founding_year,
      logo_url: card.logo_url,
      city: card.city,
      county: card.county,
    },
    null,
    2,
  );

  return [
    `# Update ${card.name} on the Utah Startup State Atlas`,
    "",
    `You're helping me update my company's profile at ${root}/startups/${card.slug}.`,
    "",
    `## Current canonical fields`,
    "",
    "```json",
    current,
    "```",
    "",
    `## How to update`,
    "",
    `Send a PATCH request to:`,
    "",
    `    ${url}`,
    "",
    `with the \`X-Atlas-Admin-Token\` header (the owner provides this from`,
    `their MCP config) and a JSON body containing only the fields you want`,
    `to change. Only these fields are owner-editable; the API will silently`,
    `ignore anything else:`,
    "",
    OWNER_EDITABLE_FIELDS.map((f) => `- \`${f}\``).join("\n"),
    "",
    `## Example`,
    "",
    "```bash",
    `curl -X PATCH ${url} \\`,
    `  -H 'content-type: application/json' \\`,
    `  -H 'x-atlas-admin-token: <YOUR_TOKEN>' \\`,
    `  -d '{ "description": "Updated tagline...", "hiring_status": true }'`,
    "```",
    "",
    `## What I want to change`,
    "",
    `<describe the edits you want made — the agent will draft the PATCH body and confirm before sending>`,
    "",
  ].join("\n");
}
