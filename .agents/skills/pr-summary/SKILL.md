---
description: Generate a PR summary from the current branch's commits and diff.
allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep
---

# Generate PR Summary

Generate a pull request description for the current branch.

## Instructions

1. Get branch context:

   ```bash
   git branch --show-current
   git log dev..HEAD --oneline
   ```

2. Get the diff summary:

   ```bash
   git diff dev...HEAD --stat
   ```

3. Generate PR description using this format:

```markdown
## Summary

- [1-3 bullets describing the main changes]

## Changes

- [Specific changes made]

## Test plan

- [ ] [Validation step]
```

4. Output the formatted PR description.

## Notes

- Focus on why the change matters, not only what files changed.
- Include breaking changes prominently.
- PRs must target `dev`.
