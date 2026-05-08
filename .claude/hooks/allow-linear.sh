#!/usr/bin/env bash
# Auto-approve Bash commands involving the Linear API
COMMAND=$(jq -r '.tool_input.command // ""')

# Block destructive org/project/team-level mutations
if echo "$COMMAND" | grep -qiE 'organizationDelete|teamDelete|projectDelete|userDelete|userAccountDelete|workspaceDelete'; then
  echo '{"block": true, "message": "Blocked: destructive Linear mutation. Review and run manually."}' >&2
  exit 2
fi

# Auto-approve any command hitting the Linear API
if echo "$COMMAND" | grep -qE 'api\.linear\.app'; then
  cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Auto-approved: Linear API command"
  }
}
EOF
fi
exit 0
