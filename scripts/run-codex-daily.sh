#!/bin/zsh

set -euo pipefail

ROOT="${0:A:h:h}"
MODE="${1:---preflight}"
CODEX_BIN="${CODEX_BIN:-/Applications/ChatGPT.app/Contents/Resources/codex}"
CODEX_AUTOMATION_HOME="${CODEX_AUTOMATION_HOME:-$HOME/.codex/automation-runtime}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.6-luna}"
CODEX_REASONING_EFFORT="${CODEX_REASONING_EFFORT:-low}"
CODEX_SERVICE_TIER="${CODEX_SERVICE_TIER:-standard}"
LIVE_URL="${KRISTAMASHORE_AI_LIVE_URL:-https://kristamashore.ai}"
PROMPT_FILE="$ROOT/prompts/codex-daily-article-writer.md"
PRESERVATION_SCRIPT="$ROOT/scripts/check-published-preservation.cjs"
QUEUE_PATH="$ROOT/data/blog/queue.json"
CONTEXT_PATH="$ROOT/.codex-daily-context.json"
LOG_DIR="${CODEX_LOG_DIR:-$HOME/Library/Logs/KristaMashoreAICodex}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="$LOG_DIR/$STAMP"
# 5/day cadence (Krista-directed 2026-08-16; was 1/day since the Codex
# migration). DAILY_TARGET is the full daily cadence; ARTICLE_COUNT is what
# THIS run generates (reduced by anything already published today, so a
# mid-day re-run only produces the remainder).
DAILY_TARGET="${CODEX_DAILY_ARTICLE_COUNT:-5}"
ARTICLE_COUNT="$DAILY_TARGET"
MAX_GENERATION_ATTEMPTS="${CODEX_GENERATION_ATTEMPTS:-3}"
LIVE_VERIFY_ATTEMPTS="${CODEX_LIVE_VERIFY_ATTEMPTS:-90}"

case "$MODE" in
  --preflight|--canary|--live) ;;
  *)
    print -u2 "Usage: $0 [--preflight|--canary|--live]"
    exit 2
    ;;
esac

mkdir -p "$RUN_DIR"
exec > >(tee -a "$RUN_DIR/run.log") 2>&1
cd "$ROOT"
print "[codex-daily] site=kristamashore.ai mode=$MODE articles=1 started=$STAMP"

for required in \
  "$CODEX_BIN" \
  "$PROMPT_FILE" \
  "$PRESERVATION_SCRIPT" \
  "$ROOT/scripts/build-codex-daily-context.cjs" \
  "$ROOT/scripts/check-codex-daily-article.cjs" \
  "$ROOT/scripts/normalize-codex-queue.cjs" \
  "$ROOT/scripts/publish-batch.cjs"; do
  if [[ ! -e "$required" ]]; then
    print -u2 "[codex-daily] required file is missing: $required"
    exit 1
  fi
done

if [[ ! -r "$CODEX_AUTOMATION_HOME/auth.json" ]]; then
  print -u2 "[codex-daily] automation profile is missing ChatGPT subscription auth"
  exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  print -u2 "[codex-daily] repository must be clean before a run"
  git status --short
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$MODE" == "--live" && "$BRANCH" != "main" ]]; then
  print -u2 "[codex-daily] live runs require main"
  exit 1
fi

LOGIN_STATUS="$(CODEX_HOME="$CODEX_AUTOMATION_HOME" "$CODEX_BIN" login status 2>&1)"
print -r -- "$LOGIN_STATUS"
if [[ "$LOGIN_STATUS" != *"Logged in using ChatGPT"* ]]; then
  print -u2 "[codex-daily] ChatGPT subscription login is required; API-key mode is not allowed"
  exit 1
fi

if [[ "$MODE" == "--live" ]]; then
  git pull --ff-only origin main
  TODAY_UTC="$(date -u +%Y-%m-%d)"
  PUBLISHED_TODAY="$(node - "$ROOT/data/blog/posts.json" "$TODAY_UTC" <<'NODE'
const fs = require("fs");
const posts = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const today = process.argv[3];
console.log(posts.filter((article) => String(article.publishedDate || "").slice(0, 10) === today).length);
NODE
)"
  if (( PUBLISHED_TODAY >= DAILY_TARGET )); then
    print "[codex-daily] $PUBLISHED_TODAY/$DAILY_TARGET already published for $TODAY_UTC UTC; exiting"
    exit 0
  fi
  ARTICLE_COUNT=$(( DAILY_TARGET - PUBLISHED_TODAY ))
  print "[codex-daily] $PUBLISHED_TODAY/$DAILY_TARGET published for $TODAY_UTC UTC; generating the remaining $ARTICLE_COUNT article(s)"
fi

# PREFLIGHT (ported from krista-mashore-content-codex 2026-08-15): refuse a
# backlog whose entries can never pass the article validator — the deadlock
# class where the same doomed topic gets reassigned every morning forever.
node scripts/check-topic-backlog.cjs || {
  print -u2 "[codex-daily] ABORTED: topic backlog contains entries no article can satisfy (see above). Fix data/blog/topic-backlog.json."
  exit 1
}

trap 'rm -f "$CONTEXT_PATH"' EXIT
node scripts/build-codex-daily-context.cjs "$CONTEXT_PATH"
node - "$CONTEXT_PATH" "$QUEUE_PATH" "$DAILY_TARGET" <<'NODE'
const fs = require("fs");
const context = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const queue = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const expectedCadence = Number(process.argv[4]);
if (context?.cadence?.ongoingPerDay !== expectedCadence) throw new Error(`ongoing cadence must equal ${expectedCadence}`);
if (!Array.isArray(queue) || queue.length !== 0) throw new Error("queue must be empty before generation");
if (!Array.isArray(context.existingArticles) || context.existingArticles.length < 10) throw new Error("published inventory is incomplete");
// FAIL CLOSED (2026-08-15): an empty backlog must stop the run before any
// Codex generation attempt is spent. The old design free-generated topics with
// no search-question grounding — the writer must NEVER invent a topic. The
// distinct message below is what daily-health-check.sh greps for.
if (!Array.isArray(context.assignedTopics) || context.assignedTopics.length === 0)
  throw new Error("BACKLOG EMPTY: no assigned topics — refill data/blog/topic-backlog.json with question-intent research. The writer never invents topics.");
console.log(`[codex-daily] compact context ready: ${context.existingArticles.length} articles, cadence=${expectedCadence}, assigned=${context.assignedTopics.length}`);
NODE

if [[ "$MODE" == "--preflight" ]]; then
  print "[codex-daily] PREFLIGHT PASSED. ChatGPT subscription, $DAILY_TARGET-per-day cadence, context, and empty queue are ready."
  exit 0
fi

SNAPSHOT="$RUN_DIR/published-snapshot.json"
QUEUE_BASELINE="$RUN_DIR/queue-before.json"
node "$PRESERVATION_SCRIPT" snapshot "$SNAPSHOT"
cp "$QUEUE_PATH" "$QUEUE_BASELINE"

restore_queue() {
  cp "$QUEUE_BASELINE" "$QUEUE_PATH"
}

validate_candidate() {
  node scripts/normalize-codex-queue.cjs || return 1
  local queue_count
  queue_count="$(node -e 'const q=require(process.argv[1]); console.log(Array.isArray(q) ? q.length : -1)' "$QUEUE_PATH")"
  if [[ "$queue_count" != "$ARTICLE_COUNT" ]]; then
    print -u2 "[codex-daily] expected $ARTICLE_COUNT queued article(s); found $queue_count"
    return 1
  fi
  if git diff --quiet -- data/blog/queue.json; then
    print -u2 "[codex-daily] Codex did not change queue.json"
    return 1
  fi
  node scripts/check-codex-daily-article.cjs --queue "$ARTICLE_COUNT" || return 1
  node scripts/publish-batch.cjs --validate-only "--count=$ARTICLE_COUNT" || return 1
  node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" 0 || return 1
}

GENERATION_OK=0
ATTEMPT_FEEDBACK=""
for attempt in $(seq 1 "$MAX_GENERATION_ATTEMPTS"); do
  restore_queue
  ATTEMPT_DIR="$RUN_DIR/attempt-$attempt"
  mkdir -p "$ATTEMPT_DIR"
  ATTEMPT_PROMPT="$ATTEMPT_DIR/prompt.txt"
  {
    sed -n '1,$p' "$PROMPT_FILE"
    print ""
    print "## Run context"
    print ""
    print "Generate exactly $ARTICLE_COUNT new article(s) in this run."
    print "Model budget: GPT-5.6 Luna, low reasoning, standard service tier, at most 8 tool calls."
    if [[ -n "$ATTEMPT_FEEDBACK" ]]; then
      print ""
      print "## Correction required from the prior attempt"
      print -r -- "$ATTEMPT_FEEDBACK"
      print "Replace the queue with a corrected article. Do not reuse the rejected slug."
    fi
  } > "$ATTEMPT_PROMPT"

  print "[codex-daily] generation attempt $attempt of $MAX_GENERATION_ATTEMPTS"
  CODEX_EXIT=0
  CODEX_HOME="$CODEX_AUTOMATION_HOME" "$CODEX_BIN" \
    --ask-for-approval never \
    exec \
    --ignore-user-config \
    --ephemeral \
    --sandbox workspace-write \
    --cd "$ROOT" \
    --model "$CODEX_MODEL" \
    --config "model_reasoning_effort=\"$CODEX_REASONING_EFFORT\"" \
    --config "service_tier=\"$CODEX_SERVICE_TIER\"" \
    --disable plugins \
    --disable remote_plugin \
    --disable plugin_sharing \
    --disable apps \
    --disable browser_use \
    --disable browser_use_external \
    --disable browser_use_full_cdp_access \
    --disable computer_use \
    --disable image_generation \
    --disable in_app_browser \
    --disable multi_agent \
    --disable goals \
    --disable workspace_dependencies \
    --json \
    --output-last-message "$ATTEMPT_DIR/last-message.txt" \
    - < "$ATTEMPT_PROMPT" > "$ATTEMPT_DIR/codex-events.jsonl" || CODEX_EXIT=$?

  UNEXPECTED="$(git status --porcelain --untracked-files=all | awk 'substr($0,4) != "data/blog/queue.json" { print }')"
  if [[ -n "$UNEXPECTED" ]]; then
    print -u2 "[codex-daily] Codex changed files outside queue.json:"
    print -r -- "$UNEXPECTED"
    exit 1
  fi
  if [[ "$CODEX_EXIT" != "0" ]]; then
    ATTEMPT_FEEDBACK="Codex exited with status $CODEX_EXIT. Produce a fresh valid queue."
    continue
  fi

  VALIDATION_LOG="$ATTEMPT_DIR/validation.log"
  if validate_candidate > "$VALIDATION_LOG" 2>&1; then
    cat "$VALIDATION_LOG"
    GENERATION_OK=1
    break
  fi
  cat "$VALIDATION_LOG"
  ATTEMPT_FEEDBACK="$(tail -60 "$VALIDATION_LOG")"
done

if [[ "$GENERATION_OK" != "1" ]]; then
  restore_queue
  node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" 0
  print -u2 "[codex-daily] no article passed validation; published content is unchanged"
  exit 1
fi

# HOLD FOR APPROVAL (2026-08-16, Krista-directed): articles land as draft:true
# and stay invisible (no page rendered, absent from sitemap.xml and llms.txt)
# until she approves. kristamashore.ai ONLY - she said explicitly she does NOT
# want to approve blog.kristamashore.com articles, only these.
node scripts/publish-batch.cjs --no-git --hold-for-approval "--count=$ARTICLE_COUNT"
node scripts/check-codex-daily-article.cjs --posts-head "$ARTICLE_COUNT"
node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" "$ARTICLE_COUNT"
if [[ "$(node -e 'const q=require(process.argv[1]); console.log(q.length)' "$QUEUE_PATH")" != "0" ]]; then
  print -u2 "[codex-daily] queue is not empty after publish"
  exit 1
fi

npm run build
node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" "$ARTICLE_COUNT"
NEW_SLUGS="$(node "$PRESERVATION_SCRIPT" new-slugs "$SNAPSHOT")"
print "[codex-daily] new slugs:"
print -r -- "$NEW_SLUGS"

if [[ "$MODE" == "--canary" ]]; then
  print "[codex-daily] CANARY PASSED. Nothing was committed, pushed, deployed, or published live."
  exit 0
fi

git add data/blog/posts.json data/blog/queue.json public
if git diff --cached --quiet; then
  print -u2 "[codex-daily] no production changes were staged"
  exit 1
fi
git commit -m "content: publish kristamashore.ai Codex daily article"
# Rebase onto anything pushed during generation (see the blog runner's
# 2026-08-16 push-rejection incident); conflicts fail loudly, never force.
GIT_TERMINAL_PROMPT=0 git pull --rebase origin main
git push origin main

OLD_SLUG="$(node "$PRESERVATION_SCRIPT" first-slug "$SNAPSHOT")"
DEPLOY_OK=0
for attempt in $(seq 1 "$LIVE_VERIFY_ATTEMPTS"); do
  if curl -fsSL -A "GPTBot/1.0" "$LIVE_URL/" > "$RUN_DIR/live-home.html" \
    && grep -qi '<h1' "$RUN_DIR/live-home.html" \
    && curl -fsSL -A "GPTBot/1.0" "$LIVE_URL/articles/$OLD_SLUG" > "$RUN_DIR/live-old.html" \
    && grep -qi '<article' "$RUN_DIR/live-old.html"; then
    # INVERTED FOR THE APPROVAL GATE (2026-08-16). This loop used to require
    # every new slug to be LIVE and crawlable. Under hold-for-approval that is
    # exactly backwards: the articles are deliberately withheld, so demanding
    # they be live would fail the run every single day while the gate worked
    # perfectly. The real correctness condition for a held article is the
    # opposite - it must NOT be reachable. A held article that IS live means
    # the draft flag did not take and the gate has silently failed open, which
    # is worse than a missed publish because Krista would never know.
    ALL_NEW_OK=1
    while IFS= read -r slug; do
      [[ -z "$slug" ]] && continue
      if curl -fsSL -A "GPTBot/1.0" "$LIVE_URL/articles/$slug" > "$RUN_DIR/live-$slug.html" 2>/dev/null \
        && grep -qi '<article' "$RUN_DIR/live-$slug.html"; then
        print -u2 "[codex-daily] GATE FAILED OPEN: $slug is LIVE but was held for approval"
        ALL_NEW_OK=0
        break
      fi
    done <<< "$NEW_SLUGS"
    if [[ "$ALL_NEW_OK" == "1" ]]; then
      DEPLOY_OK=1
      break
    fi
  fi
  sleep 10
done
if [[ "$DEPLOY_OK" != "1" ]]; then
  print -u2 "[codex-daily] pushed, but live GPTBot verification timed out"
  exit 1
fi

# Daily review email (Krista-directed 2026-08-15; auto-send exception (j) in
# the vault's CLAUDE.md). Bonus channel — never fails the run.
# APPROVAL REQUEST, not a review copy. These articles are NOT live yet.
print -r -- "$NEW_SLUGS" | "$ROOT/scripts/send-publish-email.zsh" \
  "kristamashore.ai [APPROVAL NEEDED]" "$LIVE_URL" \
  "doit@kristamashore.com" || true

print "[codex-daily] RUN PASSED. Articles are HELD as drafts pending Krista's approval, confirmed not publicly reachable. Existing articles unchanged. To publish: node scripts/approve-drafts.cjs [slug], then npm run build, commit, push."
