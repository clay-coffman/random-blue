---
description:
  Create a new git worktree with isolated local D1, ports, and config for
  startup-state-atlas (Cloudflare Workers + D1 + Drizzle stack).
allowed-tools:
  Bash(git:*), Bash(npm install*), Bash(npm run*), Bash(ls *), Bash(mkdir *),
  Bash(ln *), Bash(cp *), Bash(grep *), Bash(test *), Bash(touch *),
  Bash(wrangler *), Read, Edit, Write, Glob, Grep
---

# Create Worktree (startup-state-atlas)

Create a new git worktree with its own SQLite-backed local D1, its own
`PORT`/`WRANGLER_PORT`, and config symlinks. **Branch name:** `$ARGUMENTS`.

> Project-local override of agent-kit's generic `create-worktree` skill.
> No Docker, no Postgres, no Doppler — D1 is per-worktree under
> `<worktree>/.wrangler/state/v3/d1/` (the `.wrangler/` dir is in
> `.gitignore` and isolated by default since each worktree has its own).

## Env isolation model

- **Two env files, two purposes** (see `CLAUDE.md` § Hard rules):
  - `.env.local` — `process.env` consumers (Next.js dev, drizzle-kit,
    wrangler CLI). Carries `PORT`, `WRANGLER_PORT`,
    `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
    `D1_DATABASE_ID`. **No provider secrets.**
  - `.dev.vars` — `env()` consumers (anything in `lib/*` reading via
    the Cloudflare binding helper, populated in dev by
    `initOpenNextCloudflareForDev()`). Carries `ANTHROPIC_API_KEY`,
    `PARALLEL_API_KEY`, `ATLAS_ADMIN_TOKEN`, `BETTER_AUTH_SECRET`,
    `BETTER_AUTH_URL`, `RESEND_API_KEY`. If a secret only lives in
    `.env.local`, lib code can't see it.
- **Per-worktree differences:** `PORT` and `WRANGLER_PORT` in
  `.env.local`, plus the port suffix on `BETTER_AUTH_URL` in
  `.dev.vars`. Everything else mirrors the main checkout.
- **Per-worktree D1:** `wrangler d1 ... --local` and `wrangler dev`
  read/write `.wrangler/state/v3/d1/<binding-name>.sqlite` inside the
  current worktree. Different worktrees → different SQLite files. No
  manual setup required.

## Instructions

1. **Validate `$ARGUMENTS`.** Must be a branch name like
   `feat/<slice>`, `fix/<slug>`, `chore/<slug>`, etc. If empty, ask
   the user. If it's `main`, refuse — the `protect-main` hook blocks
   edits there anyway.

2. **Find next free worktree index N.** Worktrees live as siblings to
   the main checkout, named `startup-state-atlas-wt<N>`:

   ```bash
   ls -d ../startup-state-atlas-wt* 2>/dev/null || true
   ```

   Pick the lowest unused N starting at 1.

3. **Create the worktree** (base branch is `main` unless the user
   says otherwise):

   ```bash
   git worktree add ../startup-state-atlas-wt<N> -b <branch-name> main
   ```

   If the branch already exists, drop `-b`.

4. **Generate `.env.local`** in the new worktree with per-worktree
   port overrides. Use `cat > … << EOF` (heredoc) instead of Edit /
   Write — the `protect-main` hook keys off the source checkout's
   branch and would block both, even though `.env.local` is
   gitignored:

   ```bash
   cat > ../startup-state-atlas-wt<N>/.env.local << EOF
   # Per-worktree overrides for startup-state-atlas-wt<N> (N=<N>).
   # Secrets read by lib/ code via env() live in .dev.vars, not here.
   # Do NOT commit.
   PORT=$((3000 + N))
   WRANGLER_PORT=$((8787 + N))
   EOF
   ```

   If `../startup-state-atlas/.env.local` exists in the main checkout,
   also copy its non-port lines (e.g. `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`) into the new worktree's
   `.env.local`, preserving the per-worktree port values above.

5. **Generate `.dev.vars`** in the new worktree (provider secrets
   read by `env()`). Same heredoc pattern, same protect-main reason.

   - If `../startup-state-atlas/.dev.vars` exists in the main
     checkout, copy it verbatim, then rewrite **both** per-worktree
     URLs:
     - `BETTER_AUTH_URL` → `http://localhost:$((3000+N))`
     - `MAILPIT_URL` → `http://localhost:$((8025+N))`
   - If main has no `.dev.vars` yet, copy `.dev.vars.example` and
     warn the user that lib/ code won't have working secrets until
     they fill it in (they should do it in main, then re-run
     `/refresh-worktrees` to propagate).

   Example (assuming main has a populated `.dev.vars`):

   ```bash
   sed -e "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=http://localhost:$((3000+N))|" \
       -e "s|^MAILPIT_URL=.*|MAILPIT_URL=http://localhost:$((8025+N))|" \
     ../startup-state-atlas/.dev.vars \
     > ../startup-state-atlas-wt<N>/.dev.vars
   ```

   See `CLAUDE.md` § Local authentication testing for the mailpit
   port formula and why each worktree gets its own instance.

6. **Symlink shared local config files** from the main checkout, only
   if they exist in main:

   ```bash
   for f in .mcp.json .claude/settings.local.json; do
     if [ -e ../startup-state-atlas/$f ]; then
       mkdir -p ../startup-state-atlas-wt<N>/$(dirname $f)
       ln -sf $(realpath ../startup-state-atlas)/$f \
              ../startup-state-atlas-wt<N>/$f
     fi
   done
   ```

7. **Install dependencies:**

   ```bash
   cd ../startup-state-atlas-wt<N> && npm install
   ```

8. **(Conditional) Initialize the local D1.** If `db/migrations/` has
   any `.sql` files (i.e. Agent 1 has landed):

   ```bash
   cd ../startup-state-atlas-wt<N> && npm run db:migrate:local
   cd ../startup-state-atlas-wt<N> && npm run seed   # if seed is wired
   ```

   Otherwise skip — Agent 0 / Agent 1 will set up the schema later in
   this worktree's lifecycle.

9. **Report:**
   - Worktree path: `../startup-state-atlas-wt<N>`
   - Branch: `<branch-name>` (forked from `main`)
   - Index: `N=<N>` → `PORT=<3000+N>`, `WRANGLER_PORT=<8787+N>`
   - `.dev.vars` status (copied from main / fell back to example /
     main has none — user action required)
   - Symlinks created (if any)
   - Whether `db:migrate:local` + `seed` ran (skipped vs success)
   - Suggested next: `cd ../startup-state-atlas-wt<N> && npm run dev`

## Notes

- Run worktree creation **sequentially** — racing the index search
  produces collisions.
- Don't preemptively run `wrangler d1 create` here — that creates the
  *production* D1, which Agent 0 handles at deploy time. Local
  development doesn't need a remote D1.
- The `.wrangler/` directory is gitignored. If you ever need to wipe
  a worktree's local D1, `rm -rf .wrangler/` then re-run
  `npm run db:migrate:local && npm run seed`.
- Config files (`.mcp.json`, `.claude/settings.local.json`) are
  symlinked from the main checkout so worktrees stay in sync if you
  edit MCP config.
