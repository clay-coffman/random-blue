#!/usr/bin/env bash
# Auto-approve Bash commands invoking the Doppler CLI
COMMAND=$(jq -r '.tool_input.command // ""')

# Block destructive Doppler mutations
if echo "$COMMAND" | grep -qiE 'doppler[[:space:]]+(secrets|configs|projects|environments|service-tokens)[[:space:]]+delete|doppler[[:space:]]+(configs|projects)[[:space:]]+rename|doppler[[:space:]]+configs[[:space:]]+unlock'; then
  echo '{"block": true, "message": "Blocked: destructive Doppler mutation. Review and run manually."}' >&2
  exit 2
fi

# Auto-approve any other Doppler invocation
if echo "$COMMAND" | grep -qE '(^|[[:space:]])doppler([[:space:]]|$)'; then
  cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Auto-approved: Doppler CLI command"
  }
}
EOF
fi
exit 0
