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

- **Shared secrets** (`ANTHROPIC_API_KEY`, `BETTER_AUTH_SECRET`,
  `RESEND_API_KEY`, `ATLAS_ADMIN_TOKEN`) come from `.env.local`.
  `stripe projects` populates a few of these on first setup; the rest
  the user pastes in. Per-worktree `.env.local` files do NOT need to
  carry the same secret values — copy from the main checkout.
- **`.env.local` per-worktree collisions:** only `PORT` and
  `WRANGLER_PORT` differ between worktrees. Everything else is shared.
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
   port overrides. Use `cat > … << EOF` from inside the new worktree
   so the `protect-main` hook (which keys off the source checkout's
   branch) doesn't fire:

   ```bash
   cat > ../startup-state-atlas-wt<N>/.env.local << EOF
   # Per-worktree overrides for startup-state-atlas-wt<N> (N=<N>).
   # Shared secrets (ANTHROPIC_API_KEY, BETTER_AUTH_SECRET, RESEND_API_KEY,
   # ATLAS_ADMIN_TOKEN) live in this file — copy them from the main
   # checkout's .env.local if you have one. Do NOT commit.
   PORT=$((3000 + N))
   WRANGLER_PORT=$((8787 + N))
   EOF
   ```

   If `../startup-state-atlas/.env.local` already exists in the main
   checkout, also copy its non-port lines into the new worktree's
   `.env.local` (preserving the per-worktree port values above).

5. **Symlink shared local config files** from the main checkout, only
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

6. **Install dependencies:**

   ```bash
   cd ../startup-state-atlas-wt<N> && npm install
   ```

7. **(Conditional) Initialize the local D1.** If `db/migrations/` has
   any `.sql` files (i.e. Agent 1 has landed):

   ```bash
   cd ../startup-state-atlas-wt<N> && npm run db:migrate:local
   cd ../startup-state-atlas-wt<N> && npm run seed   # if seed is wired
   ```

   Otherwise skip — Agent 0 / Agent 1 will set up the schema later in
   this worktree's lifecycle.

8. **Report:**
   - Worktree path: `../startup-state-atlas-wt<N>`
   - Branch: `<branch-name>` (forked from `main`)
   - Index: `N=<N>` → `PORT=<3000+N>`, `WRANGLER_PORT=<8787+N>`
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
