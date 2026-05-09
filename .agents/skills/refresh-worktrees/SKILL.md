---
description:
  Sync per-worktree config (.env.local ports, symlinks, deps) across
  startup-state-atlas worktrees. Optionally re-apply local D1 migrations.
allowed-tools:
  Bash(git:*), Bash(npm install*), Bash(npm run*), Bash(ls *), Bash(mkdir *),
  Bash(ln *), Bash(cp *), Bash(grep *), Bash(test *), Bash(touch *),
  Bash(wrangler *), Read, Edit, Write, Glob, Grep
---

# Refresh Worktrees (startup-state-atlas)

Repair or sync per-worktree state across all sibling
`startup-state-atlas-wt<N>` checkouts. Always-safe operations only,
unless the user explicitly asks for a destructive reset.

> Project-local override of agent-kit's generic `refresh-worktrees`
> skill. No Docker, no Postgres, no Doppler — D1 is per-worktree at
> `<worktree>/.wrangler/state/v3/d1/`.

## Port table

`N` is the worktree index (`startup-state-atlas-wt<N>`). Main checkout
is `N=0`.

| Variable                          | Formula  | main | wt1  | wt2  | wt3  |
| --------------------------------- | -------- | ---- | ---- | ---- | ---- |
| `PORT` (`next dev`)               | 3000 + N | 3000 | 3001 | 3002 | 3003 |
| `WRANGLER_PORT` (`wrangler dev`)  | 8787 + N | 8787 | 8788 | 8789 | 8790 |
| `MAILPIT_URL` HTTP (inbox + send) | 8025 + N | 8025 | 8026 | 8027 | 8028 |
| Mailpit SMTP intake               | 1025 + N | 1025 | 1026 | 1027 | 1028 |

## Instructions

1. **Discover worktrees:**

   ```bash
   git worktree list --porcelain
   ```

   The first entry is the main checkout. Sibling worktrees match
   `../startup-state-atlas-wt*`.

2. **Per-worktree status check** (before changing anything):

   ```bash
   git -C <worktree-path> status --porcelain
   git -C <worktree-path> log --oneline -1
   ```

   Report branch, dirty/clean, and HEAD commit per worktree.

3. **For each worktree, apply always-safe sync** (sequential, never
   parallel):

   ### a. `.env.local` exists with correct ports

   Derive `N` from the directory name. The main checkout uses `N=0`.

   - If `.env.local` is missing, create it with `PORT=$((3000+N))` and
     `WRANGLER_PORT=$((8787+N))`.
   - If it exists, verify those two values match. If they differ, do
     **not** silently overwrite — surface the mismatch to the user.
   - **Backfill missing keys (additive only):** if either `PORT` or
     `WRANGLER_PORT` is absent, append it. Leave any other keys
     (CLI tokens, etc.) alone.
   - If a non-main worktree's `.env.local` contains lib/ secrets
     (`ANTHROPIC_API_KEY`, `PARALLEL_API_KEY`, `RESEND_API_KEY`,
     `ATLAS_ADMIN_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`),
     surface that as a mismatch — those belong in `.dev.vars`, and
     the secrets file is what lib/ code actually reads via `env()`.
     Do not silently move them.

   ### b. `.dev.vars` exists and matches main (skip the main checkout)

   `.dev.vars` carries provider secrets read by `env()` in lib/ code.
   Main is the source of truth.

   - If main has no `.dev.vars`, skip this step and warn the user
     that lib/ secrets are not configured anywhere.
   - For each non-main worktree:
     - If `.dev.vars` is missing, copy main's verbatim, then rewrite
       **both** per-worktree URLs (port formulas: `3000+N` for the
       app, `8025+N` for mailpit):

       ```bash
       sed -e "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=http://localhost:$((3000+N))|" \
           -e "s|^MAILPIT_URL=.*|MAILPIT_URL=http://localhost:$((8025+N))|" \
         <main>/.dev.vars > <worktree>/.dev.vars
       ```

     - If it exists, verify the non-`BETTER_AUTH_URL` /
       non-`MAILPIT_URL` lines match main. If they differ, surface
       the mismatch — do not overwrite. Verify both per-worktree
       URLs end with the correct port (`3000+N` and `8025+N`); if
       not, surface that too.

   ### c. Symlink shared local config files

   Skip the main checkout — it holds the canonical files.

   For each non-main worktree:

   ```bash
   for f in .mcp.json .claude/settings.local.json; do
     if [ -e <main>/$f ]; then
       mkdir -p <worktree>/$(dirname $f)
       ln -sf $(realpath <main>)/$f <worktree>/$f
     fi
   done
   ```

   Verify the main copy is a regular file (not itself a symlink)
   before linking.

4. **Re-install dependencies** in each worktree (idempotent):

   ```bash
   cd <worktree-path> && npm install
   ```

5. **(Optional) Apply pending local D1 migrations.** If
   `db/migrations/` has any `.sql` files and the user invoked this
   skill after pulling new migrations from `main`, run:

   ```bash
   cd <worktree-path> && npm run db:migrate:local
   ```

   Drizzle skips already-applied migrations; this is idempotent. Skip
   if `db/migrations/` is empty (Agent 1 hasn't landed yet).

6. **Report** for each worktree:
   - Path, branch, dirty/clean
   - `.env.local` status (created / verified / backfilled / mismatch)
   - `.dev.vars` status (created / verified / port-corrected /
     mismatch / "main has none")
   - Which symlinks were created or already correct
   - Whether `npm install` updated packages
   - Whether `db:migrate:local` ran and produced new migrations
   - Whether `.wrangler/state/v3/d1/` contains a SQLite file (yes /
     "uninitialized — run `npm run db:migrate:local && npm run seed`")

7. **Stop here** unless the user explicitly asked for a destructive
   reset. Always-safe sync ends at step 6.

## Destructive operations (only on explicit request)

### Reset branch to `main`

Only if the user asks. **Skip worktrees with uncommitted changes** —
warn and move on.

```bash
git -C <worktree-path> checkout -B <branch-name> main
```

### Wipe + reseed local D1

Only if the user asks ("reseed databases", "reset DB"). This deletes
all per-worktree local D1 state.

- Warn the user that local seed data and any test fixtures will be
  lost.
- Confirm before proceeding.
- For each named worktree:

  ```bash
  rm -rf <worktree>/.wrangler/state/v3/d1/
  cd <worktree> && npm run db:migrate:local && npm run seed
  ```

  Production D1 is **not** touched — this is local-only.

## Notes

- Always-safe sync is idempotent — run it whenever a worktree feels
  stale.
- Branch resets and DB wipes are destructive — explicit request only.
- Process worktrees sequentially. Parallel `npm install` against the
  same lockfile is fine; parallel `db:migrate:local` against the
  same `.wrangler/` would not be (each worktree has its own
  `.wrangler/`, so this is naturally per-worktree).
- To create a brand new worktree, use `/create-worktree` instead.
