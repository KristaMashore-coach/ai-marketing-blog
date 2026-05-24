#!/bin/bash
# Daily AI article generation runner. Invoked by launchd at 6:00 AM PT for aiBlog.kristamashore.com.
# This is the AI BLOG version. The real estate blog uses a separate script.

set -uo pipefail

LOG_DIR="$HOME/Library/Logs"
LOG_FILE="$LOG_DIR/krista-ai-articles.log"
mkdir -p "$LOG_DIR"

PROJECT="/Users/kristamashore/ai-marketing-blog-folder"
PROMPT_FILE="$PROJECT/scripts/daily-article-prompt.md"
CLAUDE_BIN="/Users/kristamashore/.local/bin/claude"

TODAY=$(date +%Y-%m-%d)

{
  echo ""
  echo "===== AI article run START $(date) ====="
  echo "Today: $TODAY"
} >> "$LOG_FILE"

mkdir -p "/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/$TODAY/.queue"

cd "$PROJECT"

"$CLAUDE_BIN" \
  --print \
  --dangerously-skip-permissions \
  "$(cat "$PROMPT_FILE")" \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

{
  echo "===== AI article run END $(date) (exit $EXIT_CODE) ====="
} >> "$LOG_FILE"

if [ "$EXIT_CODE" -ne 0 ]; then
  osascript <<MAIL_EOF
tell application "Mail"
  set newMessage to make new outgoing message with properties {subject:"AI blog article writer FAILED $(date '+%Y-%m-%d')", content:"Exit code: $EXIT_CODE. See log: $LOG_FILE"}
  tell newMessage
    make new to recipient with properties {address:"doit@kristamashore.com"}
  end tell
  send newMessage
end tell
MAIL_EOF
fi

exit $EXIT_CODE
