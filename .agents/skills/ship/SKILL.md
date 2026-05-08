---
description:
  Commit current changes, open or update a PR against main, monitor checks, and
  handle review feedback.
allowed-tools:
  Bash(git:*), Bash(gh:*), Bash(npm:*), Bash(curl:*), Bash(doppler:*), Read,
  Edit, Write, Glob, Grep
---

# Ship

Commit current changes, open or update a PR targeting `main`, monitor checks,
and address actionable review feedback until the branch is ready.

This repo uses a trunk-based flow: feature branches (`feat/*`, `fix/*`,
`chore/*`, `docs/*`, `refactor/*`) merge directly into `main`. There is
no `dev` branch.

**Commit message hint:** `$ARGUMENTS`

## Phase 1: Inspect and Commit

1. Check the branch and diff:

   ```bash
   git branch --show-current
   git status
   git diff --stat
   ```

2. If there are changes to commit, review recent style:

   ```bash
   git log --oneline -5
   ```

3. Stage only relevant files and commit with a conventional message. Do not
   amend unless the user asks.

4. Push the branch:

   ```bash
   git push -u origin "$(git branch --show-current)"
   ```

## Phase 2: Open or Update PR

1. Check whether a PR already exists:

   ```bash
   gh pr view --json number,url 2>/dev/null || echo "NO_PR"
   ```

2. If no PR exists, gather context:

   ```bash
   git log main..HEAD --oneline
   git diff --stat main..HEAD
   ```

3. Create the PR against `main`:

   ```bash
   gh pr create --base main --title "<title>" --body "<body>"
   ```

The PR body must include `Summary` and `Test plan` sections.

## Phase 3: Monitor Checks

1. Watch checks:

   ```bash
   gh pr checks --watch
   ```

2. If a check fails, inspect the failing run logs, fix the issue, run focused
   local verification, commit the fix, push, and re-check.

3. If checks remain pending for more than 10 minutes, report the pending state
   and stop.

## Phase 4: Address Review Feedback

After CI completes, inspect PR reviews and comments:

```bash
PR_NUMBER=$(gh pr view --json number -q '.number')
gh api repos/{owner}/{repo}/pulls/$PR_NUMBER/reviews
gh api repos/{owner}/{repo}/issues/$PR_NUMBER/comments
```

Fix every actionable issue from automated or human review. After fixes, run at
least:

```bash
npm run typecheck
npm test -- --run
```

Commit review fixes as new commits and push.

## Phase 5: Linear

If the branch, commits, or PR reference a Linear issue (e.g. `ABC-123`), move
it to `In Review` after the PR is open. Use the Linear app/tools when available.
If using the API directly, wrap curl with your secrets-injection runner (e.g.
`doppler run --`) so `LINEAR_API_KEY` is available. Do not mark the issue
`Done`; that only happens after merge.

## Report

Report the PR URL, branch, commits, check status, review status, and Linear
status. If anything is blocked, include the exact blocker and the next required
action.
