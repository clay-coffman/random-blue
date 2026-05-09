import type { Command } from "commander";
import { createAtlasClient, AtlasError } from "../lib/atlas-client.js";
import { formatCompany, pickMode } from "../lib/format.js";

type GetOptions = {
  json?: boolean;
  compact?: boolean;
};

type PatchOptions = {
  field?: string[];
  json?: boolean;
};

// Parse "key=value" or "key=" into [key, value]. Values are passed
// through as strings; the route handler handles type coercion. Booleans
// `true`/`false` are converted; numbers are converted; everything else
// stays a string.
function parseField(raw: string): [string, unknown] {
  const idx = raw.indexOf("=");
  if (idx <= 0) {
    throw new Error(`Invalid --field "${raw}". Use key=value.`);
  }
  const key = raw.slice(0, idx);
  const v = raw.slice(idx + 1);
  if (v === "true") return [key, true];
  if (v === "false") return [key, false];
  if (v === "null") return [key, null];
  if (/^-?\d+$/.test(v)) return [key, Number(v)];
  if (/^-?\d+\.\d+$/.test(v)) return [key, Number(v)];
  return [key, v];
}

export function registerCompany(program: Command) {
  const company = program
    .command("company")
    .description("Inspect and edit Utah company profiles.");

  company
    .command("get <slug>")
    .description("Fetch a single company by slug.")
    .option("--json", "Emit raw JSON")
    .option("--compact", "Compact text")
    .action(async (slug: string, opts: GetOptions) => {
      const client = createAtlasClient();
      const mode = pickMode(opts);
      try {
        const { company: row } = await client.getCompany(slug);
        process.stdout.write(formatCompany(row, mode) + "\n");
      } catch (err) {
        if (err instanceof AtlasError) {
          process.stderr.write(`error[${err.code}]: ${err.message}\n`);
          process.exit(1);
        }
        throw err;
      }
    });

  company
    .command("patch <slug>")
    .description(
      "Update a company profile. Requires ATLAS_ADMIN_TOKEN in env. Repeat --field for each key=value.",
    )
    .option("--field <key=value...>", "Field to set (repeatable)")
    .option("--json", "Emit the updated row as JSON")
    .action(async (slug: string, opts: PatchOptions) => {
      const client = createAtlasClient();
      if (!opts.field || opts.field.length === 0) {
        process.stderr.write(
          "error: at least one --field key=value is required.\n",
        );
        process.exit(2);
      }
      const patch: Record<string, unknown> = {};
      try {
        for (const f of opts.field) {
          const [k, v] = parseField(f);
          patch[k] = v;
        }
      } catch (err) {
        process.stderr.write(`error: ${(err as Error).message}\n`);
        process.exit(2);
      }
      try {
        const { company: row } = await client.patchCompany(slug, patch);
        if (opts.json) {
          process.stdout.write(JSON.stringify({ company: row }, null, 2) + "\n");
        } else {
          process.stdout.write(`updated company ${slug}\n`);
          for (const [k, v] of Object.entries(patch)) {
            process.stdout.write(`  ${k} → ${JSON.stringify(v)}\n`);
          }
        }
      } catch (err) {
        if (err instanceof AtlasError) {
          process.stderr.write(`error[${err.code}]: ${err.message}\n`);
          process.exit(1);
        }
        throw err;
      }
    });
}
