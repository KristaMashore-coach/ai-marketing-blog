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
ARTICLE_COUNT=1
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
  ALREADY_PUBLISHED="$(node - "$ROOT/data/blog/posts.json" "$TODAY_UTC" <<'NODE'
const fs = require("fs");
const posts = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const today = process.argv[3];
console.log(posts.some((article) => String(article.publishedDate || "").slice(0, 10) === today) ? "yes" : "no");
NODE
)"
  if [[ "$ALREADY_PUBLISHED" == "yes" ]]; then
    print "[codex-daily] an article is already published for $TODAY_UTC UTC; exiting"
    exit 0
  fi
fi

trap 'rm -f "$CONTEXT_PATH"' EXIT
node scripts/build-codex-daily-context.cjs "$CONTEXT_PATH"
node - "$CONTEXT_PATH" "$QUEUE_PATH" <<'NODE'
const fs = require("fs");
const context = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const queue = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
if (context?.cadence?.ongoingPerDay !== 1) throw new Error("ongoing cadence must equal 1");
if (!Array.isArray(queue) || queue.length !== 0) throw new Error("queue must be empty before generation");
if (!Array.isArray(context.existingArticles) || context.existingArticles.length < 10) throw new Error("published inventory is incomplete");
console.log(`[codex-daily] compact context ready: ${context.existingArticles.length} articles, cadence=1`);
NODE

if [[ "$MODE" == "--preflight" ]]; then
  print "[codex-daily] PREFLIGHT PASSED. ChatGPT subscription, one-per-day cadence, context, and empty queue are ready."
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
    print -u2 "[codex-daily] expected 1 queued article; found $queue_count"
    return 1
  fi
  if git diff --quiet -- data/blog/queue.json; then
    print -u2 "[codex-daily] Codex did not change queue.json"
    return 1
  fi
  node scripts/check-codex-daily-article.cjs --queue || return 1
  node scripts/publish-batch.cjs --validate-only || return 1
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
    print "Generate exactly one article."
    print "Model budget: GPT-5.6 Luna, low reasoning, standard service tier, at most 6 tool calls."
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

node scripts/publish-batch.cjs --no-git
node scripts/check-codex-daily-article.cjs --posts-head
node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" 1
if [[ "$(node -e 'const q=require(process.argv[1]); console.log(q.length)' "$QUEUE_PATH")" != "0" ]]; then
  print -u2 "[codex-daily] queue is not empty after publish"
  exit 1
fi

npm run build
node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" 1
NEW_SLUG="$(node "$PRESERVATION_SCRIPT" new-slugs "$SNAPSHOT")"
print "[codex-daily] new slug: $NEW_SLUG"

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
git push origin main

OLD_SLUG="$(node "$PRESERVATION_SCRIPT" first-slug "$SNAPSHOT")"
DEPLOY_OK=0
for attempt in $(seq 1 "$LIVE_VERIFY_ATTEMPTS"); do
  if curl -fsSL -A "GPTBot/1.0" "$LIVE_URL/" > "$RUN_DIR/live-home.html" \
    && grep -qi '<h1' "$RUN_DIR/live-home.html" \
    && curl -fsSL -A "GPTBot/1.0" "$LIVE_URL/articles/$OLD_SLUG" > "$RUN_DIR/live-old.html" \
    && grep -qi '<article' "$RUN_DIR/live-old.html" \
    && curl -fsSL -A "GPTBot/1.0" "$LIVE_URL/articles/$NEW_SLUG" > "$RUN_DIR/live-new.html" \
    && grep -qi '<article' "$RUN_DIR/live-new.html"; then
    DEPLOY_OK=1
    break
  fi
  sleep 10
done
if [[ "$DEPLOY_OK" != "1" ]]; then
  print -u2 "[codex-daily] pushed, but live GPTBot verification timed out"
  exit 1
fi

print "[codex-daily] LIVE RUN PASSED. Existing articles remained unchanged and the new article is crawlable."
