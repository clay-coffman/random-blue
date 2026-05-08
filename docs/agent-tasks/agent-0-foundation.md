# Agent 0 — Foundation

You are the bootstrap agent. Nothing else can start until you finish.
Aim for ~60 minutes; less is better.

## Branch + worktree

- **Worktree:** `wt1` (or run on `main`'s checkout). Whichever you
  use, the next agent will continue from your branch.
- **Branch:** `feat/bootstrap`. First action: `git checkout -b feat/bootstrap`.

## Reads first

1. `docs/agent-tasks/00-shared-context.md`
2. `docs/architecture.md`
3. `docs/requirements.md`
4. The loaded Claude Code skills `claude-api`, `cloudflare:wrangler`,
   `cloudflare:cloudflare`, `cloudflare:workers-best-practices`.
5. `.agents/skills/stripe-projects/SKILL.md` — the Stripe Projects
   workflow you'll invoke for Cloudflare credentials.

## Depends on

Nothing. You run first.

## Owns (write surface)

Scaffold the entire app. Other agents will build into this skeleton.

- `package.json`, `tsconfig.json`, `next.config.mjs`
- `wrangler.jsonc`, `open-next.config.ts`
- `app/layout.tsx`, `app/page.tsx` (placeholder)
- `lib/db.ts`, `lib/anthropic.ts`, `lib/api-error.ts`,
  `lib/ids.ts`, `lib/cf.ts`
- `drizzle.config.ts`, `db/migrations/.gitkeep`
- `tailwind.config.ts`, `app/globals.css`
- `.env.example`
- `components/ui/*` (shadcn primitives — button, card, input, select,
  dialog, badge)

You do NOT touch:

- `db/schema.ts` (Agent 1).
- `app/api/v1/...` route handlers (Agents 2, 4, 5, 6).
- `app/founder/*`, `app/map/*`, `app/startups/*`, `app/claim/*`,
  `app/admin/*`, `app/agents/*` (later agents).
- `cli/`, `mcp/`, `public/AGENTS.md`, `public/llms.txt` (Agent 6).

## Deliverables

1. **Scaffold via C3** (`create-cloudflare`):
   ```bash
   npm create cloudflare@latest . -- \
     --framework=next \
     --ts \
     --git=false \
     --deploy=false \
     --auto-update=false
   ```
   This generates Next.js 15 + TS + Tailwind + a working
   `wrangler.jsonc` + `@opennextjs/cloudflare` adapter. C3 may prompt
   for confirmation if the directory isn't empty — accept and let it
   merge.

2. **Provision Cloudflare credentials via Stripe Projects** (uses the
   `stripe-projects` skill):
   ```bash
   stripe projects add cloudflare/workers
   ```
   Confirm `.env.local` now contains `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID`. (The user has already run
   `stripe projects init` before spawning you; verify with
   `stripe projects list` if it exists.)

3. **Install runtime deps:**
   ```bash
   npm install drizzle-orm @anthropic-ai/sdk zod maplibre-gl
   npm install -D drizzle-kit @cloudflare/workers-types tsx dotenv
   ```

4. **Set up shadcn/ui:**
   ```bash
   npx shadcn@latest init        # accept defaults
   npx shadcn@latest add button card input select dialog badge
   ```

5. **Create the D1 database:**
   ```bash
   wrangler d1 create startup-state-atlas-db
   ```
   Capture the `database_id` from the output and add the binding to
   `wrangler.jsonc`:
   ```jsonc
   "d1_databases": [
     { "binding": "DB",
       "database_name": "startup-state-atlas-db",
       "database_id": "<paste id here>",
       "migrations_dir": "db/migrations" }
   ]
   ```

6. **Enable observability** in `wrangler.jsonc`:
   ```jsonc
   "observability": { "enabled": true }
   ```

7. **Write `lib/cf.ts`** — typed accessor for Workers env:
   ```ts
   import { getRequestContext } from '@opennextjs/cloudflare';
   export function env() {
     return getRequestContext().env as CloudflareEnv;
   }
   ```
   Generate `CloudflareEnv` types via
   `wrangler types --env-interface CloudflareEnv`.

8. **Write `lib/db.ts`** — Drizzle client wired to the D1 binding:
   ```ts
   import { drizzle } from 'drizzle-orm/d1';
   import { env } from './cf';
   export const db = () => drizzle(env().DB);
   ```
   (Lazy because `env()` only resolves inside a request context.)

9. **Write `lib/anthropic.ts`** — uses the `claude-api` skill's
   guidance (prompt caching enabled). Default model:
   `claude-opus-4-7`. Reads `ANTHROPIC_API_KEY` from env.

10. **Write `lib/api-error.ts`** — `ApiError` class with the frozen
    error shape `{ error: { code, message, details? } }`.

11. **Write `lib/ids.ts`** — `newId(prefix)` using nanoid:
    ```ts
    import { customAlphabet } from 'nanoid';
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    const generate = customAlphabet(alphabet, 16);
    export const newId = (prefix: 'fp' | 'co' | 'r' | 'rec' | 'cl') =>
      `${prefix}_${generate()}`;
    ```
    `npm install nanoid`.

12. **`drizzle.config.ts`:**
    ```ts
    import type { Config } from 'drizzle-kit';
    export default {
      schema: './db/schema.ts',
      out: './db/migrations',
      dialect: 'sqlite',
      driver: 'd1-http',     // for `drizzle-kit push` if needed
      dbCredentials: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: '<from wrangler.jsonc>',
        token: process.env.CLOUDFLARE_API_TOKEN!,
      },
    } satisfies Config;
    ```

13. **Wire npm scripts** in `package.json`:
    ```jsonc
    "scripts": {
      "dev": "next dev --port ${PORT:-3000}",
      "preview": "wrangler dev --port ${WRANGLER_PORT:-8787}",
      "deploy": "opennextjs-cloudflare build && wrangler deploy",
      "build": "next build",
      "start": "next start",
      "db:generate": "drizzle-kit generate",
      "db:migrate:local": "wrangler d1 migrations apply startup-state-atlas-db --local",
      "db:migrate:remote": "wrangler d1 migrations apply startup-state-atlas-db --remote",
      "seed": "tsx db/seed/index.ts",
      "cli": "tsx cli/index.ts",
      "mcp": "tsx mcp/server.ts",
      "lint": "next lint",
      "typecheck": "tsc --noEmit",
      "postinstall": "agent-kit sync"
    }
    ```

14. **Create `.env.example`:**
    ```
    ANTHROPIC_API_KEY=
    CLOUDFLARE_API_TOKEN=
    CLOUDFLARE_ACCOUNT_ID=
    ATLAS_ADMIN_TOKEN=dev-only-replace-me
    PORT=3000
    WRANGLER_PORT=8787
    ```

15. **Apply an empty migration to confirm wiring:**
    ```bash
    mkdir -p db/migrations
    touch db/migrations/.gitkeep
    # No schema yet — Agent 1 generates the first real migration.
    ```

16. **Set production secrets via wrangler:**
    ```bash
    wrangler secret put ANTHROPIC_API_KEY      # paste the key
    wrangler secret put ATLAS_ADMIN_TOKEN      # paste any string
    ```

17. **Deploy the empty scaffold** to confirm wiring works:
    ```bash
    npm run deploy
    ```
    Confirm the Worker URL renders. Output the URL — Agents 1+ will
    use it for `wrangler tail` and remote queries.

18. **Commit + open PR:**
    ```bash
    git add -A
    git commit -m "feat(bootstrap): scaffold Next.js on CF Workers + lib/ stubs + D1 binding"
    git push -u origin feat/bootstrap
    gh pr create --base main --title "Bootstrap foundation" --body-file - <<'EOF'
    Scaffolds Next.js 15 (App Router) on Cloudflare Workers via OpenNext.
    Adds Drizzle config, lib/ stubs, D1 binding, .env.example, and a
    working `wrangler deploy`.
    EOF
    ```

## DONE when

Verify each in order:

1. `npm run dev` starts Next.js on `http://localhost:${PORT:-3000}`
   and serves the placeholder home page.
2. `npx wrangler dev` (or `npm run preview`) starts the Worker on
   port `${WRANGLER_PORT:-8787}` with the D1 binding live.
3. `wrangler d1 list` shows `startup-state-atlas-db`.
4. `wrangler d1 execute startup-state-atlas-db --command "SELECT 1"`
   returns `1`.
5. `npm run deploy` produces a live URL that renders the placeholder.
6. `lib/cf.ts`, `lib/db.ts`, `lib/anthropic.ts`, `lib/api-error.ts`,
   `lib/ids.ts` all type-check (`npm run typecheck`).
7. `.env.example` exists; `.env.local` is gitignored.
8. PR is open against `main`.

## Demo path

You don't enable any demo scene directly — but every other agent
depends on you. The "live deployed URL" you produce becomes the
hackathon's demo URL.

## Cuts allowed if time-pressed

- **Skip R2 bucket creation** — only Agent 4 needs it, and only if
  photos are in scope.
- **Skip Playwright setup** — agents do manual smoke tests.
- **Skip a `deploy.yml` GitHub Action** — manual `npm run deploy`
  works for the hackathon.
- **Don't fight type-perfection** — `as any` casts in `lib/cf.ts` /
  `lib/db.ts` are acceptable as long as the pattern is established.

## Common pitfalls

- **C3 may complain about non-empty directory.** It will offer to
  merge. Accept. The agent-kit `.agents/`, `.claude/`, `.github/`
  directories must survive — verify after C3 finishes.
- **OpenNext + Next.js 15 may need `nodejs_compat` flag** in
  `wrangler.jsonc`. C3 usually adds it; if not, add it.
- **`agent-kit sync` runs in postinstall** — if you change
  `package.json` scripts, keep `postinstall: agent-kit sync`.
- **Never edit `.agents/skills/<name>/`** — those are symlinks. The
  `guard-shared-edits.sh` hook will block, but be aware.
- **Don't commit `node_modules`** — `.gitignore` already excludes it,
  but double-check before pushing.
