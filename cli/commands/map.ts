import type { Command } from "commander";
import { createAtlasClient, AtlasError, type CompanySummary } from "../lib/atlas-client.js";
import { formatCompanyList, pickMode } from "../lib/format.js";

type SearchOptions = {
  q?: string;
  sector?: string;
  stage?: string;
  employees?: string;
  limit?: string;
  json?: boolean;
  compact?: boolean;
};

function parseEmployeeRange(range: string): {
  min?: number;
  max?: number;
} {
  // "2-10" → min 2 max 10. "10+" → min 10. "5" → exact.
  const m = range.match(/^(\d+)\+$/);
  if (m) return { min: Number(m[1]) };
  const r = range.match(/^(\d+)-(\d+)$/);
  if (r) return { min: Number(r[1]), max: Number(r[2]) };
  const single = range.match(/^(\d+)$/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return {};
}

function parseEmployeeCount(s: string | null | undefined): number | null {
  if (!s) return null;
  // "1-10", "11-50", "5", "100+" → take the lower bound for filtering
  const m = s.match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

export function registerMap(program: Command) {
  const map = program
    .command("map")
    .description("Search and inspect the Utah company directory.");

  map
    .command("search")
    .description("Search companies by free-text and filter by sector / stage / employee range.")
    .option("--q <query>", "Free-text query (matches name, slug, website)")
    .option("--sector <sector>", "Sector filter (substring match)")
    .option("--stage <stage>", "Stage filter (substring match)")
    .option("--employees <range>", 'Range like "2-10", "10+", or "5"')
    .option("--limit <n>", "Max results (default 20, max 50)")
    .option("--json", "Emit raw JSON")
    .option("--compact", "One line per company")
    .action(async (opts: SearchOptions) => {
      const client = createAtlasClient();
      const mode = pickMode(opts);

      try {
        const limit = opts.limit ? Number(opts.limit) : 20;
        const q = opts.q ?? opts.sector ?? "";
        const { companies } = await client.listCompanies(q, limit);

        const empRange = opts.employees
          ? parseEmployeeRange(opts.employees)
          : undefined;

        const filtered = companies.filter((c: CompanySummary) => {
          if (opts.sector && !(c.sector ?? "").toLowerCase().includes(opts.sector.toLowerCase()))
            return false;
          if (opts.stage && !(c.stage ?? "").toLowerCase().includes(opts.stage.toLowerCase()))
            return false;
          if (empRange) {
            const n = parseEmployeeCount(c.employee_count);
            if (n === null) return false;
            if (empRange.min !== undefined && n < empRange.min) return false;
            if (empRange.max !== undefined && n > empRange.max) return false;
          }
          return true;
        });

        process.stdout.write(formatCompanyList(filtered, mode) + "\n");
      } catch (err) {
        if (err instanceof AtlasError) {
          process.stderr.write(`error[${err.code}]: ${err.message}\n`);
          process.exit(1);
        }
        throw err;
      }
    });
}
