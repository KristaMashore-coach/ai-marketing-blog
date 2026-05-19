#!/bin/bash
# Daily AEO/GEO draft review reminder. Invoked by launchd at 8:00 AM PT.
#
# What it does:
#   1. Reads posts.json, finds every article still flagged draft:true
#   2. Starts the Vite dev server if it isn't already running (drafts 404 on
#      production because prerender-blog.cjs filters them out — only local
#      dev serves them)
#   3. Opens each draft in a browser tab at http://localhost:5173/articles/<slug>
#   4. Pops a macOS notification AND emails doit@kristamashore.com via Mail.app
#      with the list of drafts and direct review links

set -uo pipefail

PROJECT="/Users/kristamashore/Sites/krista-mashore-content-site"
LOG_DIR="$HOME/Library/Logs"
LOG_FILE="$LOG_DIR/krista-daily-draft-reminder.log"
DEV_PORT=5173

mkdir -p "$LOG_DIR"

{
  echo ""
  echo "===== Daily draft reminder START $(date) ====="
} >> "$LOG_FILE"

cd "$PROJECT"

# Pull draft slugs out of posts.json
DRAFT_SLUGS=$(/Users/kristamashore/.local/node/bin/node -e "
  const posts = require('./data/blog/posts.json');
  posts.filter(p => p.draft).forEach(p => console.log(p.slug));
" 2>>"$LOG_FILE")

DRAFT_COUNT=$(echo -n "$DRAFT_SLUGS" | grep -c . || true)

echo "Found $DRAFT_COUNT draft(s)" >> "$LOG_FILE"

if [ "$DRAFT_COUNT" -eq 0 ]; then
  /usr/bin/osascript -e 'display notification "No drafts pending — inbox zero on the blog." with title "AEO/GEO Drafts" sound name "Glass"' >> "$LOG_FILE" 2>&1
  echo "No drafts — exiting" >> "$LOG_FILE"
  exit 0
fi

# Make sure whatever is bound to $DEV_PORT is THIS project's Vite — not a
# stale dev server from a moved/old project directory (that would 404 every
# article URL).
EXPECTED_VITE_CWD="$PROJECT"
HEALTHY=0
if /usr/sbin/lsof -i tcp:$DEV_PORT -sTCP:LISTEN >/dev/null 2>&1; then
  PIDS=$(/usr/sbin/lsof -ti tcp:$DEV_PORT -sTCP:LISTEN 2>/dev/null)
  for PID in $PIDS; do
    PID_CWD=$(/usr/sbin/lsof -p "$PID" -a -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//')
    if [ "$PID_CWD" = "$EXPECTED_VITE_CWD" ]; then
      HEALTHY=1
      echo "Dev server on :$DEV_PORT is from the right project (pid $PID)" >> "$LOG_FILE"
    else
      echo "Killing stale vite on :$DEV_PORT (pid $PID, cwd=$PID_CWD)" >> "$LOG_FILE"
      kill "$PID" 2>>"$LOG_FILE"
    fi
  done
fi

if [ "$HEALTHY" -ne 1 ]; then
  echo "Starting fresh dev server from $PROJECT" >> "$LOG_FILE"
  cd "$PROJECT"
  /usr/bin/nohup /Users/kristamashore/.local/node/bin/npm --prefix "$PROJECT" run dev >> "$LOG_FILE" 2>&1 &
  for i in $(seq 1 20); do
    if /usr/sbin/lsof -i tcp:$DEV_PORT -sTCP:LISTEN >/dev/null 2>&1; then
      echo "Dev server ready after ${i}s" >> "$LOG_FILE"
      break
    fi
    sleep 1
  done
fi

# Open each draft in a browser tab
while IFS= read -r SLUG; do
  [ -z "$SLUG" ] && continue
  URL="http://localhost:$DEV_PORT/articles/$SLUG"
  echo "Opening $URL" >> "$LOG_FILE"
  /usr/bin/open "$URL"
  sleep 0.3
done <<< "$DRAFT_SLUGS"

# Build the draft list with review links for both the notification and email
EMAIL_BODY="Good morning Krista,

You have $DRAFT_COUNT AEO/GEO blog draft(s) waiting for your review and approval.

Each draft has been opened in your browser. To approve any of them, just tell Claude (e.g. \"approve drafts 1, 3, and 5\" or paste the slug). To edit, open data/blog/posts.json in the project or tell Claude what to change.

Drafts pending:
"
i=1
while IFS= read -r SLUG; do
  [ -z "$SLUG" ] && continue
  EMAIL_BODY+="
  $i. http://localhost:$DEV_PORT/articles/$SLUG"
  i=$((i+1))
done <<< "$DRAFT_SLUGS"

EMAIL_BODY+="

Project: $PROJECT
Logs:    $LOG_FILE
"

# Send email via Apple Mail. Body is written to a temp file because embedding
# multi-line content with quotes directly into AppleScript breaks the parser.
BODY_FILE=$(/usr/bin/mktemp -t aeo-draft-reminder)
printf '%s' "$EMAIL_BODY" > "$BODY_FILE"
EMAIL_SUBJECT="AEO/GEO Draft Review — $DRAFT_COUNT pending"

/usr/bin/osascript >> "$LOG_FILE" 2>&1 <<APPLESCRIPT
set bodyText to (do shell script "cat " & quoted form of "$BODY_FILE")
tell application "Mail"
  set newMessage to make new outgoing message with properties {subject:"$EMAIL_SUBJECT", content:bodyText, visible:false}
  tell newMessage
    make new to recipient with properties {address:"doit@kristamashore.com"}
  end tell
  send newMessage
end tell
APPLESCRIPT

/bin/rm -f "$BODY_FILE"

# Desktop notification
/usr/bin/osascript -e "display notification \"$DRAFT_COUNT draft article(s) opened. Email sent. Tell Claude which to approve.\" with title \"AEO/GEO Draft Review\" sound name \"Glass\"" >> "$LOG_FILE" 2>&1

echo "===== Daily draft reminder END $(date) =====" >> "$LOG_FILE"
