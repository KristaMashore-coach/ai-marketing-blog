#!/bin/bash
# Fires when launchd detects a save in the Obsidian Drafts-Review folder.
# Debounces, runs the importer, rebuilds, commits, pushes. Vercel auto-deploys.
#
# Triggered by ~/Library/LaunchAgents/com.kristamashore.obsidian-sync.plist
# (WatchPaths = the Drafts-Review folder).

set -uo pipefail

PROJECT="/Users/kristamashore/Sites/krista-mashore-content-site"
LOG_DIR="$HOME/Library/Logs"
LOG_FILE="$LOG_DIR/krista-obsidian-sync.log"
LOCK_FILE="/tmp/krista-obsidian-sync.lock"
DEBOUNCE_SEC=15

mkdir -p "$LOG_DIR"

# Single-instance: if a sync is already running or queued, exit clean.
exec 9>"$LOCK_FILE"
if ! /usr/bin/flock -n 9; then
  echo "[$(date)] another sync already pending — exiting" >> "$LOG_FILE"
  exit 0
fi

echo "" >> "$LOG_FILE"
echo "===== Obsidian sync START $(date) =====" >> "$LOG_FILE"

# Debounce: rapid saves coalesce into one run.
sleep "$DEBOUNCE_SEC"

cd "$PROJECT"

# Import edits from Obsidian markdown back into posts.json
/Users/kristamashore/.local/node/bin/node scripts/import-drafts-from-obsidian.cjs >> "$LOG_FILE" 2>&1
IMPORT_RC=$?
if [ "$IMPORT_RC" -ne 0 ]; then
  echo "Import failed (rc=$IMPORT_RC) — aborting sync" >> "$LOG_FILE"
  /usr/bin/osascript -e 'display notification "Obsidian sync FAILED — check log" with title "AEO/GEO Sync" sound name "Basso"' >> "$LOG_FILE" 2>&1
  exit 1
fi

# If nothing changed, no commit needed.
if /usr/bin/git diff --quiet -- data/blog/posts.json; then
  echo "No changes to posts.json — nothing to commit" >> "$LOG_FILE"
  exit 0
fi

# Run citation guard on every article touched in this diff.
TOUCHED_SLUGS=$(/Users/kristamashore/.local/node/bin/node -e "
  const fs = require('fs');
  const { execSync } = require('child_process');
  const diff = execSync('git diff -U0 -- data/blog/posts.json').toString();
  // Find slug fields in the modified lines
  const m = [...diff.matchAll(/\"slug\":\\s*\"([^\"]+)\"/g)];
  const seen = new Set(m.map(x => x[1]));
  console.log([...seen].join('\\n'));
" 2>>"$LOG_FILE")

GUARD_FAILED=0
if [ -n "$TOUCHED_SLUGS" ]; then
  while IFS= read -r SLUG; do
    [ -z "$SLUG" ] && continue
    /Users/kristamashore/.local/node/bin/node -e "
      const p = require('./data/blog/posts.json');
      const a = p.find(x => x.slug === '$SLUG');
      if (a) require('fs').writeFileSync('/tmp/guard-check.json', JSON.stringify(a));
    " 2>>"$LOG_FILE"
    if ! /Users/kristamashore/.local/node/bin/node scripts/citation-guard.cjs /tmp/guard-check.json >> "$LOG_FILE" 2>&1; then
      GUARD_FAILED=$((GUARD_FAILED + 1))
      echo "Citation guard FAILED for $SLUG — will commit but flag" >> "$LOG_FILE"
    fi
  done <<< "$TOUCHED_SLUGS"
fi

# Build to make sure nothing is broken before we push
echo "Running build..." >> "$LOG_FILE"
/Users/kristamashore/.local/node/bin/npm run build:fast >> "$LOG_FILE" 2>&1
BUILD_RC=$?
if [ "$BUILD_RC" -ne 0 ]; then
  echo "Build FAILED (rc=$BUILD_RC) — reverting posts.json" >> "$LOG_FILE"
  /usr/bin/git checkout -- data/blog/posts.json >> "$LOG_FILE" 2>&1
  /usr/bin/osascript -e 'display notification "Obsidian sync: BUILD FAILED, reverted" with title "AEO/GEO Sync" sound name "Basso"' >> "$LOG_FILE" 2>&1
  exit 1
fi

# Commit and push
/usr/bin/git add data/blog/posts.json dist/ public/sitemap.xml public/llms*.txt 2>>"$LOG_FILE"
COMMIT_MSG="Auto-sync: Obsidian edits to $(echo "$TOUCHED_SLUGS" | wc -l | tr -d ' ') article(s)"
/usr/bin/git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1
/usr/bin/git push >> "$LOG_FILE" 2>&1
PUSH_RC=$?

if [ "$PUSH_RC" -eq 0 ]; then
  MSG="Obsidian edits synced and pushed. Vercel deploying."
  if [ "$GUARD_FAILED" -gt 0 ]; then
    MSG="$MSG ($GUARD_FAILED article(s) flagged for missing citations.)"
  fi
  /usr/bin/osascript -e "display notification \"$MSG\" with title \"AEO/GEO Sync\" sound name \"Glass\"" >> "$LOG_FILE" 2>&1
else
  /usr/bin/osascript -e 'display notification "Obsidian sync: push FAILED" with title "AEO/GEO Sync" sound name "Basso"' >> "$LOG_FILE" 2>&1
fi

echo "===== Obsidian sync END $(date) =====" >> "$LOG_FILE"
