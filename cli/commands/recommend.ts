import type { Command } from "commander";
import { createAtlasClient, AtlasError, type RecommendBody } from "../lib/atlas-client.js";
import { resolvePersona, PERSONA_NAMES } from "../lib/persona-resolver.js";
import { formatRecommendations, pickMode } from "../lib/format.js";

type Options = {
  persona?: string;
  county?: string;
  city?: string;
  stage?: string;
  industry?: string;
  goal?: string;
  urgency?: string;
  websiteUrl?: string;
  json?: boolean;
  compact?: boolean;
};

export function registerRecommend(program: Command) {
  program
    .command("recommend")
    .description(
      `Score Utah resources against a founder profile.\n\nWith --persona <${PERSONA_NAMES.join("|")}> the canonical fp_<name>\npassport is loaded and its saved fields win — other flags are ignored.\nTo score a custom profile, omit --persona and pass --stage --industry --goal\n(plus optional --county / --city / --communities ... ).`,
    )
    .option("--persona <name>", `One of: ${PERSONA_NAMES.join(", ")}`)
    .option("--county <county>", "Utah county (e.g. 'Salt Lake')")
    .option("--city <city>", "City (e.g. 'Salt Lake City')")
    .option("--stage <stage>", "idea | pre_seed | mvp | paying_customers | growth | mature")
    .option("--industry <industry>", "Free-text industry (e.g. 'B2B SaaS')")
    .option("--goal <goal>", "start_business | raise_seed_round | …")
    .option("--urgency <urgency>", "this_week | this_month | this_quarter | next_quarter | this_year")
    .option("--website-url <url>", "Optional website url for the founder's company")
    .option("--json", "Emit raw JSON")
    .option("--compact", "One line per recommendation")
    .action(async (opts: Options) => {
      const client = createAtlasClient();
      const mode = pickMode(opts);

      // Path A: --persona only, no other overrides → fast path: GET /plan
      const overrideFlags = (
        ["county", "city", "stage", "industry", "goal", "urgency", "websiteUrl"] as const
      ).filter((k) => opts[k] !== undefined);

      try {
        if (opts.persona && overrideFlags.length === 0) {
          const id = resolvePersona(opts.persona);
          const plan = await client.getPlan(id);
          if (plan.recommendations.length === 0) {
            // First time for this persona — trigger the recompute via POST.
            const fresh = await client.recommend({ passport_id: id });
            process.stdout.write(formatRecommendations(fresh, mode) + "\n");
            return;
          }
          process.stdout.write(formatRecommendations(plan, mode) + "\n");
          return;
        }

        // Path B: build a recommend body. When a persona id is given,
        // the saved row wins — send the id alone and ignore any
        // body-shaped flags. The recommend endpoint's id-only schema
        // is strict and rejects extra fields.
        let body: RecommendBody;
        if (opts.persona) {
          body = { passport_id: resolvePersona(opts.persona) };
        } else {
          body = {};
          if (opts.county) body.county = opts.county;
          if (opts.city) body.city = opts.city;
          if (opts.stage) body.stage = opts.stage;
          if (opts.industry) body.industry = opts.industry;
          if (opts.goal) body.goal = opts.goal;
          if (opts.urgency) body.urgency = opts.urgency;
          if (opts.websiteUrl) body.website_url = opts.websiteUrl;
          body.communities = [];
          body.needs = [];
          body.constraints = [];
        }

        const result = await client.recommend(body);
        process.stdout.write(formatRecommendations(result, mode) + "\n");
      } catch (err) {
        if (err instanceof AtlasError) {
          process.stderr.write(`error[${err.code}]: ${err.message}\n`);
          process.exit(1);
        }
        throw err;
      }
    });
}
