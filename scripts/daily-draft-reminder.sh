#!/bin/bash
# Daily AEO/GEO draft review reminder. Invoked by launchd at 8:00 AM PT.
#
# What it does:
#   1. Reads posts.json, finds every article still flagged draft:true
#   2. Starts the Vite dev server if it isn't already running (drafts 404 on
#      production because prerender-blog.cjs filters them out — only local
#      dev serves them)
#   3. Opens each draft in a browser tab at http://localhost:5173/articles/<slug>
#   4. Pops a macOS notification with the draft count

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

# Start dev server if not already listening on $DEV_PORT
if ! /usr/bin/lsof -i tcp:$DEV_PORT >/dev/null 2>&1; then
  echo "Dev server not running — starting it" >> "$LOG_FILE"
  /usr/bin/nohup /Users/kristamashore/.local/node/bin/npm --prefix "$PROJECT" run dev >> "$LOG_FILE" 2>&1 &
  # Wait up to 20s for the port to come up
  for i in $(seq 1 20); do
    if /usr/bin/lsof -i tcp:$DEV_PORT >/dev/null 2>&1; then
      echo "Dev server ready after ${i}s" >> "$LOG_FILE"
      break
    fi
    sleep 1
  done
else
  echo "Dev server already running on :$DEV_PORT" >> "$LOG_FILE"
fi

# Open each draft in a browser tab
while IFS= read -r SLUG; do
  [ -z "$SLUG" ] && continue
  URL="http://localhost:$DEV_PORT/articles/$SLUG"
  echo "Opening $URL" >> "$LOG_FILE"
  /usr/bin/open "$URL"
  sleep 0.3
done <<< "$DRAFT_SLUGS"

# Notify
/usr/bin/osascript -e "display notification \"$DRAFT_COUNT draft article(s) opened in your browser. Review and tell Claude which to approve.\" with title \"AEO/GEO Draft Review\" sound name \"Glass\"" >> "$LOG_FILE" 2>&1

echo "===== Daily draft reminder END $(date) =====" >> "$LOG_FILE"
