---
description:
  Read-only health check across startup-state-atlas worktrees: ports,
  .env.local, symlinks, local D1 state.
allowed-tools:
  Bash(git:*), Bash(ls *), Bash(grep *), Bash(test *), Bash(readlink *),
  Bash(wrangler d1 list*), Read, Glob, Grep
---

# Validate Worktrees (startup-state-atlas)

Read-only health check across the main checkout and every sibling
`startup-state-atlas-wt<N>`. Reports problems; does **not** fix them
(use `/refresh-worktrees` for fixes).

> Project-local override of agent-kit's generic `validate-worktrees`
> skill. No Docker check, no Doppler check.

## Instructions

1. **Discover worktrees:**

   ```bash
   git worktree list --porcelain
   ls -d ../startup-state-atlas-wt* 2>/dev/null
   ```

   Worktrees not registered with git but matching the naming pattern
   are stale — flag them.

2. **For each worktree, check:**

   ### a. `.env.local` exists with correct ports

   Derive `N` from the directory name (`startup-state-atlas-wt<N>`,
   `N=0` for main).

   Expected values:

   - `PORT` = `3000 + N`
   - `WRANGLER_PORT` = `8787 + N`

   Report missing file, missing keys, or mismatched values.

   ### b. Port uniqueness

   Collect each worktree's `PORT` and `WRANGLER_PORT`. Flag any
   duplicates — two worktrees claiming the same port can't run the
   dev server simultaneously.

   ### c. Symlink integrity

   For non-main worktrees, verify these point at valid files:

   - `.mcp.json` → `<main>/.mcp.json`
   - `.claude/settings.local.json` → `<main>/.claude/settings.local.json`

   Skip checks for symlinks whose source file doesn't exist in the
   main checkout (some hackathon-bootstrap worktrees legitimately
   pre-date these files).

   ### d. Local D1 state

   Look for `<worktree>/.wrangler/state/v3/d1/` and any `.sqlite`
   files inside. Report:

   - **initialized** — at least one `.sqlite` file present
   - **empty** — directory exists but no SQLite file (worktree
     created before migrations were applied)
   - **uninitialized** — `.wrangler/` doesn't exist yet

   Don't error on empty/uninitialized — they're expected for fresh
   worktrees and pre-Agent-1 worktrees. Just surface the state so
   the user knows whether to run `npm run db:migrate:local && npm
   run seed`.

   ### e. Branch status

   Report branch name, whether on a `feat/*`/`fix/*`/`chore/*` etc.
   branch (not `main`), and dirty/clean.

3. **Output a summary table:**

   ```
   Worktree    Branch                .env.local  Ports          Symlinks  Local D1
   ─────────── ───────────────────── ─────────── ────────────── ───────── ─────────────
   main        chore/local-db-pivot  ok          3000 / 8787    n/a       initialized
   wt1         feat/agent-0-found…   ok          3001 / 8788    ok        uninitialized
   wt2         feat/agent-2          ok          3002 / 8789    ok        initialized
   ```

4. **Issue list at the bottom:**
   - Port duplicates
   - Missing or malformed `.env.local`
   - Broken symlinks
   - Stale worktrees (sibling dir present, not registered with git)
   - Suggest `/refresh-worktrees` for any fixable issues

## Notes

- This skill is read-only. Use `/refresh-worktrees` to apply fixes.
- A worktree with `Local D1: empty` or `uninitialized` is normal
  before Agent 1 has landed. Flag it as a state, not an error.
- Production D1 (the `--remote` instance) is out of scope for this
  skill — `wrangler d1 list` against the production binding is the
  way to verify that, and only one of those exists per project.
