---
name: sentry
description:
  Monitor errors, traces, and logs in Sentry. Use when investigating production
  issues, checking error rates, viewing stack traces, or triaging alerts. Uses
  the `sentry` CLI.
allowed-tools: Bash(sentry:*)
---

# Sentry CLI Skill

Investigate errors, performance issues, and logs using the `sentry` CLI
(v0.12+).

## Project

Set the project shorthand once for your project — most commands auto-detect,
but you can also pass it explicitly. Throughout this doc we use
`<org>/<project>` as a placeholder; replace with your Sentry org slug and
project slug (for example `acme/web`).

## Common Operations

### List Issues (Errors)

```bash
sentry issues <org>/<project>
sentry issues <org>/<project> --limit 50
sentry issues <org>/<project> --sort freq
sentry issues <org>/<project> -q "is:unresolved level:error"
```

Sort options: `date` (default), `new`, `freq`, `user`.

### View Issue Details

```bash
sentry issue view <ISSUE_ID>            # numeric or short ID
sentry issue view <ISSUE_ID> --web      # open in browser
sentry issue view <ISSUE_ID> --json     # full JSON output
```

### AI Root Cause Analysis

```bash
sentry issue explain <ISSUE_ID>         # Seer AI root cause analysis
sentry issue plan <ISSUE_ID>            # Seer AI solution plan
```

### List Recent Traces

```bash
sentry traces <org>/<project>
sentry traces <org>/<project> --limit 50
sentry traces <org>/<project> --sort duration
sentry traces <org>/<project> -q "transaction:GET /api/users"
```

### View Trace Details

```bash
sentry trace view <TRACE_ID>
sentry trace view <TRACE_ID> --spans all    # full span tree
```

### List Logs

```bash
sentry logs <org>/<project>
sentry logs <org>/<project> --limit 50
sentry logs <org>/<project> -q "level:error"
sentry logs <org>/<project> -f          # stream live (2s poll)
sentry logs <org>/<project> -f 5        # stream live (5s poll)
```

### View Event Details

```bash
sentry event view <EVENT_ID>
sentry event view <EVENT_ID> --json
```

### API Escape Hatch

For anything not covered by built-in commands:

```bash
sentry api /api/0/projects/<org>/<project>/
sentry api /api/0/projects/<org>/<project>/stats/
sentry api --method POST --field 'query=is:unresolved' /api/0/organizations/<org>/issues/
```

## Workflow: Investigating a Production Issue

1. **List recent errors:**
   `sentry issues <org>/<project> -q "is:unresolved"`
2. **View issue details:** `sentry issue view <ID>` (includes latest event,
   stack trace)
3. **Get AI analysis:** `sentry issue explain <ID>`
4. **Check related traces:**
   `sentry traces <org>/<project> -q "transaction:<endpoint>"`
5. **View trace spans:** `sentry trace view <TRACE_ID> --spans all`
6. **Check logs around the time:**
   `sentry logs <org>/<project> -q "level:error"`

## Key Notes

- The CLI auth is persistent (no token needed per-command after `sentry login`)
- `--json` flag available on all commands for machine-readable output
- Environments (`staging`, `production`) are set via `SENTRY_ENVIRONMENT` in
  your runtime
- Source maps require `SENTRY_AUTH_TOKEN` at build time (e.g. in CI)
