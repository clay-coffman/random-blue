#!/usr/bin/env tsx

// `startup-state` CLI — wraps the public Startup State Atlas REST API
// for terminal users, scripts, and external agents. Always uses the
// machine token path (`X-Atlas-Admin-Token`); never impersonates a
// human session.
//
// Configuration (env vars):
//   STARTUP_STATE_API_URL  — base url, default http://localhost:3000
//   ATLAS_ADMIN_TOKEN      — required for write subcommands
//
// Local dev: `npm run cli -- <args>`. The `tsx` runner is wired via
// the `cli` script in package.json.

import { Command } from "commander";
import { registerRecommend } from "./commands/recommend.js";
import { registerMap } from "./commands/map.js";
import { registerCompany } from "./commands/company.js";
import { registerProfileBuild } from "./commands/profile-build.js";

const program = new Command();
program
  .name("startup-state")
  .description(
    "CLI for the Startup State Atlas API. https://startupstateatlas.dev/agents",
  )
  .version("1.0.0");

registerRecommend(program);
registerMap(program);
registerCompany(program);
registerProfileBuild(program);

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`error: ${err.message}\n`);
  process.exit(1);
});
