#!/usr/bin/env bash
# guard-shared-edits.sh — refuse Edit/Write operations against files that are
# symlinked into the agent-kit package. Editing those files mutates the
# shared source for every project that uses agent-kit, which is almost never
# what the agent intended.
#
# Reads the PreToolUse hook payload on stdin (Claude Code passes a JSON
# document with tool_input.file_path). Exits 2 with a JSON block message on
# stderr if the target is a symlink into the agent-kit package.
#
# The package is identified by a marker file at its root: `.agent-kit-package`.
# This works for both `npm install agent-kit` (where the resolved path
# lands inside `node_modules/agent-kit/`) and `npm link agent-kit`
# (where the chain bypasses node_modules entirely).

set -euo pipefail

input=$(cat || true)

if command -v jq >/dev/null 2>&1; then
  file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
else
  file_path=$(printf '%s' "$input" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' | head -n1 | sed -E 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')
fi

[ -z "${file_path:-}" ] && exit 0

project_dir=${CLAUDE_PROJECT_DIR:-$PWD}
case "$file_path" in
  /*) abs_path=$file_path ;;
  *)  abs_path="$project_dir/$file_path" ;;
esac

# Only guard against paths under the well-known shared dirs.
case "$abs_path" in
  *"/.agents/skills/"*|*"/.claude/skills/"*|*"/.claude/hooks/"*|*"/.claude/agents/"*|*"/.github/workflows/claude"*) ;;
  *) exit 0 ;;
esac

# Walk up the path. For each directory component that exists, check whether
# the resolved real path contains an `.agent-kit-package` marker — i.e. it
# lives inside the agent-kit package's tree. If so, refuse.
check=$abs_path
while [ "$check" != "/" ] && [ -n "$check" ]; do
  if [ -e "$check" ] || [ -L "$check" ]; then
    real=$(readlink -f "$check" 2>/dev/null || readlink "$check" 2>/dev/null || echo "$check")
    # Walk the resolved path upward looking for the marker file.
    probe=$real
    while [ "$probe" != "/" ] && [ -n "$probe" ]; do
      if [ -f "$probe/.agent-kit-package" ]; then
        printf '%s\n' '{"block": true, "message": "This file is symlinked into agent-kit (the shared agent infrastructure package). Editing it would mutate the shared source for every project that uses agent-kit. Edit the file in the agent-kit checkout instead (e.g. ~/Dev/repos/agent-kit/), then `git push` + `npm update agent-kit` to roll, or use `npm link` for live iteration."}' >&2
        exit 2
      fi
      probe=${probe%/*}
    done
  fi
  check=${check%/*}
done

exit 0
