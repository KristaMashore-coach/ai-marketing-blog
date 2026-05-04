#!/bin/bash
# Daily article generation runner. Invoked by launchd at 5:00 AM PT.

set -uo pipefail

LOG_DIR="$HOME/Library/Logs"
LOG_FILE="$LOG_DIR/krista-daily-articles.log"
mkdir -p "$LOG_DIR"

PROJECT="/Users/kristamashore/Desktop/krista-mashore-content-site"
PROMPT_FILE="$PROJECT/scripts/daily-article-prompt.md"
CLAUDE_BIN="/Users/kristamashore/.local/bin/claude"

TODAY=$(date +%Y-%m-%d)

{
  echo ""
  echo "===== Daily article run START $(date) ====="
  echo "Today: $TODAY"
} >> "$LOG_FILE"

mkdir -p "/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/Articles/$TODAY/.queue"

cd "$PROJECT"

"$CLAUDE_BIN" \
  --print \
  --dangerously-skip-permissions \
  "$(cat "$PROMPT_FILE")" \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

{
  echo "===== Daily article run END $(date) (exit $EXIT_CODE) ====="
} >> "$LOG_FILE"

if [ "$EXIT_CODE" -ne 0 ]; then
  osascript <<MAIL_EOF
tell application "Mail"
    set failMsg to make new outgoing message with properties {subject:"⚠️ Daily article run FAILED — $TODAY", content:"The daily article writer exited with code $EXIT_CODE. Check ~/Library/Logs/krista-daily-articles.log for details.", visible:false}
    tell failMsg
        make new to recipient with properties {address:"doit@kristamashore.com"}
    end tell
    send failMsg
end tell
MAIL_EOF
fi

exit "$EXIT_CODE"
