#!/bin/zsh
# send-publish-email.zsh — daily article-publish notification (pure code, no AI).
#
# Krista-directed 2026-08-15, registered as auto-send exception (j) in the
# vault's CLAUDE.md: every day articles publish, the team gets them BY EMAIL
# for review ("I want them in my email, not in my obsidian"). Articles publish
# first; this email is the review copy.
#
# Recipients are fixed per site (Krista's words, 2026-08-15):
#   kristamashore.ai        -> socialmedia@kristamashore.com, doit@kristamashore.com
#   blog.kristamashore.com  -> doit@, jaynlin@kristahomes.com, tc@kristahomes.com
#
# Sends via ~/Scripts/kaia-send-email.sh (hardened: requires successful:true,
# logs proof to ~/Library/Logs/kaia-sent-emails.log). One send per recipient so
# one bad address never blocks the rest.
#
# NEVER fails the publish run: email is a bonus channel per the vault's
# scheduled-jobs rule. Always exits 0.
#
# Usage: send-publish-email.zsh "<site-label>" "<live-url>" "<recipients space-sep>" <<< "$NEW_SLUGS"

set -u

SITE_LABEL="${1:?site label required}"
LIVE_URL="${2:?live url required}"
RECIPIENTS="${3:?recipients required}"
SENDER="$HOME/Scripts/kaia-send-email.sh"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTS="$ROOT/data/blog/posts.json"

SLUGS=()
while IFS= read -r line; do
  [[ -n "$line" ]] && SLUGS+=("$line")
done

if (( ${#SLUGS[@]} == 0 )); then
  print "[publish-email] no new slugs; nothing to email"
  exit 0
fi

BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

node - "$POSTS" "$LIVE_URL" "${SLUGS[@]}" > "$BODY_FILE" <<'NODE' || { print -u2 "[publish-email] body build failed; skipping email (publish unaffected)"; exit 0; }
const fs = require("fs");
const posts = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const base = process.argv[3].replace(/\/$/, "");
const slugs = process.argv.slice(4);
const bySlug = new Map(posts.map(p => [p.slug, p]));
const lines = [];
lines.push(`Published today and live now. Reply to this email with any change and it gets fixed.`);
lines.push("");
for (const s of slugs) {
  const p = bySlug.get(s);
  lines.push(`• ${p ? p.title : s}`);
  lines.push(`  ${base}/articles/${s}`);
  if (p && p.metaDescription) lines.push(`  ${p.metaDescription}`);
  lines.push("");
}
lines.push(`— automated publish notification (${new Date().toISOString().slice(0,10)})`);
console.log(lines.join("\n"));
NODE

COUNT=${#SLUGS[@]}
SUBJECT="📝 $COUNT new article$([[ $COUNT -gt 1 ]] && print -n s) on $SITE_LABEL — $(date +%Y-%m-%d)"

for r in ${(z)RECIPIENTS}; do
  if "$SENDER" "$r" "$SUBJECT" "$BODY_FILE"; then
    print "[publish-email] sent to $r"
  else
    print -u2 "[publish-email] SEND FAILED to $r (publish unaffected; see kaia-send-email output above)"
  fi
done

exit 0
