import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Command } from "commander";
import { createAtlasClient, AtlasError } from "../lib/atlas-client.js";

type Options = {
  company: string;
  fromUrl: string;
  emit?: string;
  out?: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function registerProfileBuild(program: Command) {
  const profile = program
    .command("profile")
    .description("Build company profile artifacts from a URL via the API enrich endpoint.");

  profile
    .command("build")
    .description(
      "Run the enrich pipeline against a website url and emit one or more artifacts.",
    )
    .requiredOption("--company <name>", "Company display name (used to derive output slug)")
    .requiredOption("--from-url <url>", "Source website url (http/https)")
    .option(
      "--emit <kinds>",
      "Comma-separated list of artifacts: md, json, llms (default: md,json,llms)",
      "md,json,llms",
    )
    .option("--out <dir>", "Output directory (default: ./profiles/<slug>)")
    .action(async (opts: Options) => {
      const client = createAtlasClient();
      const slug = slugify(opts.company);
      const outDir = opts.out ? resolve(opts.out) : resolve(`./profiles/${slug}`);
      const emit = (opts.emit ?? "md,json,llms")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      try {
        const enrich = await client.enrich(opts.fromUrl);
        if (enrich.degraded || enrich.fields.length === 0) {
          process.stderr.write(
            `warning: enrich degraded for ${opts.fromUrl}; emitting empty artifact.\n`,
          );
        }

        // Index fields by name for the artifact templates.
        const fields: Record<string, unknown> = {};
        for (const f of enrich.fields) fields[f.name] = f.value;

        mkdirSync(outDir, { recursive: true });

        const written: string[] = [];

        if (emit.includes("json")) {
          const file = resolve(outDir, `${slug}.json`);
          const payload = {
            company: opts.company,
            slug,
            source_url: opts.fromUrl,
            generated_at: new Date().toISOString(),
            degraded: enrich.degraded ?? false,
            fields: enrich.fields,
          };
          writeFileSync(file, JSON.stringify(payload, null, 2) + "\n");
          written.push(file);
        }

        if (emit.includes("md")) {
          const file = resolve(outDir, `${slug}.md`);
          const lines = [
            `# ${opts.company}`,
            "",
            `Source: ${opts.fromUrl}`,
            `Generated: ${new Date().toISOString()}`,
            "",
            "## Profile",
            "",
          ];
          for (const f of enrich.fields) {
            lines.push(`- **${f.name}** (confidence ${f.confidence.toFixed(2)}): ${asString(f.value)}`);
          }
          if (enrich.degraded) {
            lines.push("");
            lines.push("> Enrichment ran in degraded mode (fetch / LLM failure).");
          }
          writeFileSync(file, lines.join("\n") + "\n");
          written.push(file);
        }

        if (emit.includes("llms")) {
          const file = resolve(outDir, `${slug}.llms.txt`);
          const lines = [
            `# ${opts.company}`,
            "",
            `> Auto-generated profile entry for ${opts.company}.`,
            "",
            "## Facts",
            "",
            ...enrich.fields.map(
              (f) => `- ${f.name}: ${asString(f.value)} (confidence ${f.confidence.toFixed(2)})`,
            ),
            "",
            `Source: ${opts.fromUrl}`,
          ];
          writeFileSync(file, lines.join("\n") + "\n");
          written.push(file);
        }

        process.stdout.write(
          `wrote ${written.length} artifact(s) to ${outDir}:\n` +
            written.map((f) => `  ${f}`).join("\n") +
            "\n",
        );
        if (Object.keys(fields).length > 0) {
          process.stdout.write(
            `extracted: ${Object.keys(fields).join(", ")}\n`,
          );
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
