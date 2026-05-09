#!/usr/bin/env tsx
// Pre-check the port that `next dev` (mode=dev) or
// `opennextjs-cloudflare preview` (mode=preview) is about to bind.
// Exit non-zero with a human-readable message if the port is held
// by another process, or if the shell-exported port disagrees with
// the worktree's `.env.local`. See B-DevSrv-1 in
// `docs/investor-e2e-findings-2026-05-09.md` for the trap this fixes.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

type Mode = "dev" | "preview";

const mode = process.argv[2] as Mode | undefined;
if (mode !== "dev" && mode !== "preview") {
  console.error(
    `dev-preflight: expected "dev" or "preview" as first arg, got ${JSON.stringify(process.argv[2])}`,
  );
  process.exit(2);
}

const root = resolve(import.meta.dirname, "..");
const envLocal = parseEnvFile(resolve(root, ".env.local"));
const devVars = parseEnvFile(resolve(root, ".dev.vars"));

const portKey = mode === "preview" ? "WRANGLER_PORT" : "PORT";
const defaultPort = mode === "preview" ? 8787 : 3000;

const fileVal = envLocal[portKey];
const shellVal = process.env[portKey];

// The npm `dev` / `preview` scripts do `next dev --port ${PORT:-3000}` /
// `... --port ${WRANGLER_PORT:-8787}` — pure bash expansion, which only
// sees shell-exported env, not values that live solely in .env.local.
// So shellVal is what `next dev` will actually bind; the preflight has
// to probe that, not fileVal.
if (fileVal && shellVal && fileVal !== shellVal) {
  console.error(
    `✗ ${portKey} mismatch: shell has ${shellVal}, .env.local has ${fileVal}.`,
  );
  console.error(
    `  The dev server will bind ${shellVal} (shell wins), but .dev.vars / .env.local reference ${fileVal}.`,
  );
  console.error(
    `  Either unset ${portKey} in your shell or align .env.local.`,
  );
  process.exit(1);
}

if (fileVal && !shellVal) {
  console.error(
    `✗ ${portKey} is set in .env.local (=${fileVal}) but not exported to the shell.`,
  );
  console.error(
    `  next dev / wrangler preview only see shell env for the --port arg, so they would bind ${defaultPort} instead of ${fileVal}.`,
  );
  console.error(
    `  Run \`export ${portKey}=${fileVal}\` (or source the worktree's env) before \`npm run ${mode}\`.`,
  );
  process.exit(1);
}

const effectiveStr = shellVal ?? String(defaultPort);
const effective = Number(effectiveStr);
if (!Number.isInteger(effective) || effective <= 0 || effective > 65535) {
  console.error(
    `✗ ${portKey}=${effectiveStr} is not a valid TCP port. Fix it in .env.local.`,
  );
  process.exit(1);
}

const probeError = await probePort(effective);
if (probeError) {
  if (probeError.code === "EADDRINUSE") {
    console.error(`✗ Port ${effective} (${portKey}) is already in use.`);
    const holder = describeHolder(effective);
    if (holder) console.error(`  Holder: ${holder}`);
    console.error(
      `  Kill the other process or pick a free ${portKey} in .env.local.`,
    );
    console.error(
      `  Worktree convention: PORT = 3000 + N, WRANGLER_PORT = 8787 + N.`,
    );
    process.exit(1);
  }
  console.error(
    `✗ Could not probe port ${effective}: ${probeError.message ?? probeError.code}`,
  );
  process.exit(1);
}

if (mode === "dev") {
  const bauUrl = devVars.BETTER_AUTH_URL;
  if (bauUrl) {
    let bauPort = NaN;
    try {
      const parsed = new URL(bauUrl);
      if (parsed.port) bauPort = Number(parsed.port);
    } catch {
      // Invalid URL — skip the warn rather than fail the preflight.
    }
    if (Number.isInteger(bauPort) && bauPort !== effective) {
      console.warn(
        `! BETTER_AUTH_URL in .dev.vars is ${bauUrl} but next dev will bind :${effective}.`,
      );
      console.warn(
        `  Update .dev.vars to http://localhost:${effective} to silence Better Auth's "Base URL could not be determined" warnings.`,
      );
    }
  }
}

console.log(`✓ ${portKey}=${effective} is free.`);

// --- helpers -----------------------------------------------------

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trimStart();
    if (!line || line.startsWith("#")) continue;
    const m = rawLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

async function probePort(
  port: number,
): Promise<{ code?: string; message?: string } | null> {
  return new Promise((resolvePromise) => {
    const server = createServer();
    server.unref();
    server.once("error", (err: NodeJS.ErrnoException) => {
      resolvePromise({ code: err.code, message: err.message });
    });
    server.once("listening", () => {
      server.close(() => resolvePromise(null));
    });
    server.listen(port, "127.0.0.1");
  });
}

function describeHolder(port: number): string | null {
  try {
    const out = execFileSync(
      "lsof",
      ["-i", `:${port}`, "-sTCP:LISTEN", "-P", "-t"],
      { stdio: ["ignore", "pipe", "ignore"] },
    )
      .toString()
      .trim();
    const pids = out.split("\n").filter(Boolean);
    if (pids.length === 0) return null;
    const parts = pids.map((pid) => {
      try {
        const args = execFileSync("ps", ["-p", pid, "-o", "args="], {
          stdio: ["ignore", "pipe", "ignore"],
        })
          .toString()
          .trim();
        return `pid ${pid} (${args})`;
      } catch {
        return `pid ${pid}`;
      }
    });
    return parts.join(" ; ");
  } catch {
    return null;
  }
}
