#!/usr/bin/env bash
# Auto-approve Bash commands involving agent-browser
COMMAND=$(jq -r '.tool_input.command // ""')
if echo "$COMMAND" | grep -qE 'agent-browser|\$AB |\$AB$'; then
  cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Auto-approved: agent-browser command"
  }
}
EOF
fi
exit 0
