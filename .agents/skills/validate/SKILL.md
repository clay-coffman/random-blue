---
description: Run the full validation suite (tests, lint, typecheck, e2e)
allowed-tools: Bash(npm:*)
---

# Validate

Run the full project validation suite.

## Instructions

Run the validation command:

```bash
npm run validate
```

This runs:

1. **Unit tests** (Vitest)
2. **Linting** (ESLint)
3. **Type checking** (TypeScript)
4. **E2E tests** (Playwright)

## On Failure

If validation fails:

1. Report which check failed
2. Show the relevant error output
3. Suggest fixes if obvious

## Notes

- This is the same check that runs in CI
- All checks must pass before merging PRs
- E2E tests require a build first (handled by validate script)
