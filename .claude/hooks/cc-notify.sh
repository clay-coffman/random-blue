#!/usr/bin/env bash
# cc-notify.sh — Desktop notification hook for Claude Code
# Place in .claude/hooks/ and configure in .claude/settings.json
#
# Reads hook JSON from stdin, sends a KDE desktop notification.

INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // "unknown"')

# Identify which worktree/window this is from
CWD=$(echo "$INPUT" | jq -r '.cwd // ""')
LABEL=$(basename "$CWD")

case "$EVENT" in
Notification)
  TYPE=$(echo "$INPUT" | jq -r '.notification_type // ""')
  MSG=$(echo "$INPUT" | jq -r '.message // "Needs attention"')
  TITLE=$(echo "$INPUT" | jq -r '.title // "Claude Code"')

  case "$TYPE" in
  permission_prompt)
    notify-send -u critical -a "Claude Code" -i dialog-password \
      "🔐 $TITLE [$LABEL]" "$MSG"
    ;;
  idle_prompt)
    notify-send -u normal -a "Claude Code" -i dialog-question \
      "💤 Claude Idle [$LABEL]" "$MSG"
    ;;
  elicitation_dialog)
    notify-send -u normal -a "Claude Code" -i dialog-question \
      "❓ Question [$LABEL]" "$MSG"
    ;;
  *)
    notify-send -u low -a "Claude Code" -i dialog-information \
      "Claude Code [$LABEL]" "$MSG"
    ;;
  esac
  ;;

Stop)
  notify-send -u normal -a "Claude Code" -i dialog-apply \
    "✅ Claude Finished [$LABEL]" "Ready for review"
  ;;

esac

exit 0
