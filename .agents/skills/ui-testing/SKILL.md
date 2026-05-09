---
name: ui-testing
description:
  Run the app locally and visually test the current feature/fix/chore using
  agent-browser
allowed-tools:
  Bash(npm run dev*), Bash(npm run build*), Bash(npm run seed*), Bash(git *),
  Bash(curl *), Bash(lsof *), Bash(sleep *), Bash(docker *), Bash(doppler *),
  Bash(agent-browser *), Bash(npx agent-browser *), Bash(grep *), Bash($AB *),
  Bash(AB="agent-browser*), Read, Glob, Grep
---

# UI Testing

Visually test the current branch's feature, fix, or chore using a real browser
via agent-browser.

## Instructions

### 1. Determine what to test

- Run `git log --oneline main..HEAD` and `git diff --stat main..HEAD` to
  understand what the current branch changes.
- Identify the affected routes, components, and user flows.
- Build a mental test plan covering: happy path, edge cases, responsive
  behavior, and error states.

### 2. Identify this worktree's ports

This project uses multiple worktrees, each with its own server port. **Never
hardcode local ports** - always read ports from `.env.local`.

```bash
APP_PORT=$(grep '^PORT=' .env.local | cut -d= -f2)
echo "App: localhost:${APP_PORT:-3000}"
```

Use `$APP_PORT` (falling back to 3000 if unset) for all URLs throughout testing.

Derive a unique agent-browser session name from the current directory so
multiple worktrees can run isolated browser instances simultaneously:

```bash
WORKTREE_NAME=$(basename "$PWD")
AB="agent-browser --session $WORKTREE_NAME"
echo "agent-browser session: $WORKTREE_NAME"
```

Use `$AB` in place of `agent-browser` for all commands throughout testing.

### 3. Ensure the dev server is running

**CRITICAL: Do NOT kill processes on other ports.** Other worktrees run their
own servers on different ports; never interfere with them.

First check if this worktree's server is already listening on `$APP_PORT`:

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:$APP_PORT || true
```

If it returns 200, the server is already running; skip to the next step.

If it's **not** running, check that nothing else is using this port:

```bash
lsof -i :$APP_PORT -t 2>/dev/null || echo "Port $APP_PORT is free"
```

If the port is occupied by a process that isn't this worktree's server, **stop
and ask the user**. Do not kill it.

If the port is free, start the dev server in the background:

```bash
npm run dev
```

Wait up to 30 seconds for it to respond:

```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w '%{http_code}' http://localhost:$APP_PORT 2>/dev/null | grep -q 200 && break
  sleep 1
done
```

If the server fails to start, report the error and stop.

### 4. Open the app in agent-browser

```bash
$AB open http://localhost:$APP_PORT && $AB wait --load networkidle && $AB snapshot -i
```

### 5. Authenticate if needed

If the feature under test requires authentication:

1. Navigate to `http://localhost:$APP_PORT/login`
2. Take a snapshot to get element refs:
   ```bash
   $AB open http://localhost:$APP_PORT/login && $AB wait --load networkidle && $AB snapshot -i
   ```
3. Fill the email field with the appropriate test user. Most projects keep a
   small set of seeded test accounts (e.g. `free@example.test`,
   `paid@example.test`, `admin@example.test`); pick the one matching the
   feature's expected tier/role. If your project does not seed test users,
   create them via the seed script before testing.
4. Submit the login form using refs from the snapshot.
5. The project is OTP-only — every sign-in shows the verify screen.
   Set `MAILPIT_URL=http://localhost:$((8025+N))` in `.dev.vars`
   (mailpit must be running on the host for that worktree), then read
   the 6-digit code from the mailpit inbox at the same URL in a normal
   browser tab and type it into the verify screen. Full details:
   `CLAUDE.md` § Local authentication testing.
6. On the verify page, fill the code field with the OTP.
7. Submit and verify redirect to the post-login destination.

Default to the highest-privilege account that still represents a normal user
unless the feature specifically requires another role.

### 6. Execute the test plan

For each test scenario:

1. **Navigate** to the relevant page
2. **Snapshot** to understand interactive elements:
   ```bash
   $AB snapshot -i
   ```
3. **Interact** with the UI using refs from the snapshot:
   ```bash
   $AB click @e1
   $AB fill @e2 "text"
   $AB select @e3 "option"
   ```
4. **Wait** for loading states to resolve:
   ```bash
   $AB wait --load networkidle
   ```
5. **Screenshot** to visually verify the result:
   ```bash
   $AB screenshot
   ```
6. **Check console** for errors:
   ```bash
   $AB console
   ```
7. **Re-snapshot** after any page changes (refs are invalidated by
   navigation/DOM changes)

#### Responsive testing

Test at minimum two viewports:

- **Desktop:** `$AB viewport 1280 800`
- **Mobile:** `$AB viewport 375 812`

#### What to look for

- Layout renders correctly, no overflow or broken elements
- Interactive elements work (buttons, links, forms, modals)
- Loading and empty states display properly
- No console errors (warnings are acceptable if pre-existing)
- Navigation works as expected
- Data displays correctly

### 7. Clean up

Always close this worktree's browser session when done. This only affects the
`$WORKTREE_NAME` session; other worktrees are not impacted.

```bash
$AB close
```

### 8. Report results

Summarize findings in this format:

```
## UI Test Results - <branch-name>

### What was tested
- <list of pages/flows tested>

### Results
- Pass: <passing scenario>
- Fail: <failing scenario with description>

### Screenshots
<reference any screenshots taken during testing>

### Console Issues
- <any errors found, or "No console errors">

### Notes
- <any observations, edge cases, or suggestions>
```

## Notes

- If your dev server mocks external services (e.g. via MSW), confirm mocks
  are enabled before testing flows that hit third-party APIs.
- If testing admin-only features, sign in as an admin-tier seeded user.
- If the page under test is data-dependent and looks empty, try running
  `npm run seed` (or your project's seed command) first.
- Refs (`@e1`, `@e2`, etc.) are invalidated when the page changes; always
  re-snapshot after navigation or DOM mutations.
