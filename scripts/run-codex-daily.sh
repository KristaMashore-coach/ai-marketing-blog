#!/bin/zsh

set -euo pipefail

ROOT="${0:A:h:h}"
MODE="${1:---preflight}"
CODEX_BIN="${CODEX_BIN:-/Applications/ChatGPT.app/Contents/Resources/codex}"
CODEX_AUTOMATION_HOME="${CODEX_AUTOMATION_HOME:-$HOME/.codex/automation-runtime}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.6-luna}"
CODEX_REASONING_EFFORT="${CODEX_REASONING_EFFORT:-medium}"
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
# Raised 3 -> 8 on 2026-09-17 by os-self-repair, matching the blog repo (raised
# there 2026-09-16). ROOT CAUSE of the chronic repair on com.kristamashore.codex-925move
# and com.kristamashore.codex-kristamashore-ai: the 6:20 AM run regularly exhausted
# 3 attempts and exited 1, the 8 AM health check kickstarted it, and the kickstart
# run then published fine. The kickstart was masking the fact that 3 attempts is
# simply not enough budget. On 2026-09-17 attempt 1 missed on word count (603/900),
# attempt 2 missed by TEN words (890/900) and a 180-char metaDescription, and
# attempt 3 produced zero articles purely because of an apply_patch format error --
# a mechanical failure that consumed the last content attempt.
#
# NOTHING WAS LOOSENED. Every deterministic guard (900-1800 words, 120-155 char
# metaDescription, link and image checks) is byte-for-byte unchanged. This raises
# only the number of chances the generator gets to MEET those unchanged guards,
# which is the opposite of lowering a threshold so a failing case stops failing
# (.claude/rules/change-contract.md banned move). A run that cannot satisfy the
# guards in 8 attempts still publishes nothing, still exits non-zero, and is still
# flagged.
#
# RESTORED 8 -> 5 on 2026-09-18. The 8-attempt budget was never the fix for the
# 2026-09-17 incident above (apply_patch failures, short word counts) — it was
# a workaround that let the generator brute-force past real gate failures,
# including the in-body links gate added the same day (scripts/lib/in-prose-
# links.cjs): the checker only ever verified the internalLinks METADATA count,
# so a body with zero real editorial links always passed, and extra attempts
# were spent on unrelated retries while the real defect shipped anyway. Now
# that the body gate is real, an inflated attempt budget just burns more Codex
# calls hunting for a lucky pass instead of the model actually meeting the
# rule the first time. 5 was the value before the 2026-09-17 bump.
MAX_GENERATION_ATTEMPTS="${CODEX_GENERATION_ATTEMPTS:-5}"
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

# 2026-09-14 fix, ported from the blog runner the same day after that repo hit
# this exact defect for real (blog.kristamashore.com published zero articles
# 2026-09-10 through 2026-09-14). ensure-backlog.cjs and reconcile-published-
# topics.cjs (below) write topic-backlog.json/pending-wave.json before
# generation starts. The success path already commits them, but any OTHER exit
# after those two scripts run used to leave the tree dirty, and the clean-repo
# precondition at the top of the NEXT run then aborted before generating
# anything — for as many days as the tree stayed dirty. This site already lost
# 2026-08-31 through roughly 2026-09-06 to the reconcile-gate half of this same
# disease (see the comment above reconcile-published-topics.cjs below); this is
# the other half, for the case where every generation attempt fails validation.
# --live only; never touch git in --preflight/--canary. No-ops if nothing
# changed.
commit_backlog_bookkeeping() {
  [[ "$MODE" == "--live" ]] || return 0
  git add data/blog/topic-backlog.json data/blog/pending-wave.json
  if git diff --cached --quiet -- data/blog/topic-backlog.json data/blog/pending-wave.json; then
    return 0
  fi
  git commit -m "content: reconcile backlog bookkeeping (no article published this run)"
  GIT_TERMINAL_PROMPT=0 git pull --rebase origin main
  GIT_TERMINAL_PROMPT=0 /usr/bin/perl -e '$timeout = shift; alarm $timeout; exec @ARGV' 180 git push origin main
}

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
# SELF-HEAL a leftover scratch queue (added 2026-09-07).
#
# A run that dies after Codex writes data/blog/queue.json but before publish
# leaves exactly that one file modified. The clean precondition below then aborts
# every FUTURE run, so one bad morning becomes a permanent outage. queue.json is
# scratch: it is only ever committed together with posts.json at publish time,
# the assigned topics stay `status: ready` in topic-backlog.json until they are
# actually published, and this run is about to overwrite the file anyway. So
# restoring the committed copy costs nothing durable and buys back the next run.
#
# Narrow on purpose: it fires ONLY when queue.json is the sole dirty path. Any
# other dirty file still stops the run, because that could be real work.
DIRTY_PATHS="$(git status --porcelain --untracked-files=all | awk '{ print substr($0,4) }')"
if [[ "$DIRTY_PATHS" == "data/blog/queue.json" ]]; then
  print "[codex-daily] SELF-HEAL: discarding a leftover scratch queue left by a run that died before publish"
  git show HEAD:data/blog/queue.json > "$QUEUE_PATH"
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
# FAIL-OPEN TOP-UP (added 2026-08-20, Krista-directed in chat: "even if they
# don't get back to you in time, it never inhibits the articles from being
# written"). Promotes topics out of data/blog/pending-wave.json into the
# backlog when runway drops below 2 days, so approval latency can no longer
# halt publishing the way it did on 2026-08-09 and 2026-08-15. It never
# invents a topic and never promotes one that would fail the validator below.
node scripts/ensure-backlog.cjs --target "$DAILY_TARGET" || true

# Close out topics that have actually published, before the cannibalisation gate
# reads them. Ported from the blog runner 2026-09-08 after that repo's gate
# aborted on four topics it had published itself the same day. This repo had the
# identical gate and the identical missing housekeeping; it had simply not
# published a wave-9+ topic yet.
node scripts/reconcile-published-topics.cjs || true

node scripts/check-topic-backlog.cjs || {
  print -u2 "[codex-daily] ABORTED: topic backlog contains entries no article can satisfy (see above). Fix data/blog/topic-backlog.json."
  commit_backlog_bookkeeping
  exit 1
}

# Snapshot what is dirty BEFORE Codex runs, so the post-Codex guard can tell
# "Codex wrote somewhere it should not have" apart from "the runner's own earlier
# steps wrote the files they own". ensure-backlog.cjs above writes
# data/blog/topic-backlog.json and data/blog/pending-wave.json; nothing told the
# guard that, and on 2026-08-31 it killed the run and the six that followed.
mkdir -p "$RUN_DIR"
PRE_CODEX_DIRTY="$RUN_DIR/pre-codex-dirty.txt"
git status --porcelain --untracked-files=all | awk '{ print substr($0,4) }' | sort > "$PRE_CODEX_DIRTY"

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

# PARTIAL BATCH (added 2026-09-26, os-self-repair cause-fix, kristamashore.ai
# published 0 of 1 while holding one perfectly good article).
#
# ARTICLE_COUNT is derived purely from the CADENCE (DAILY_TARGET minus what is
# already published today). The number of articles that can actually be WRITTEN
# is a different number: build-codex-daily-context.cjs assigns
# `available.slice(0, DAILY_CADENCE)`, so a thin backlog yields fewer assigned
# topics, and the writer is forbidden from inventing one to make up the
# difference ("The writer never invents topics", the fail-closed guard above).
#
# The batch gate then tested `queue_count != ARTICLE_COUNT` — exact equality
# against the cadence — so a run with 1 assigned topic wrote 1 valid article and
# failed the very first gate 6 times in a row. save_fallback_candidate() also
# excludes this case by name (`grep -qE '^\[codex-daily\] (expected|...)'`), so
# even the fail-open could not rescue it. Measured 2026-09-26: two runs, 12
# Codex generation attempts, one article that PASSED the link gate, zero
# published.
#
# CLASS: two halves of one pipeline disagreeing about the batch size, where the
# upstream half is capped by real supply and the downstream half asserts the
# ideal. Second instance of this class on these runners (2026-09-25: weave-links
# repaired to a count floor the anti-orphan gate could never accept).
#
# This lowers no quality gate. Every per-article check — word count, in-prose
# links, batch overlap, preservation, crawlability — runs unchanged on whatever
# is written. It only stops the run demanding more articles than the backlog can
# supply. The under-cadence condition stays visible: this line, plus the
# topic-backlog runway check ([24] in daily-health-check.sh), which is the
# detector that actually owns "not enough topics".
ASSIGNED_COUNT="$(node -e 'const c=require(process.argv[1]); const a=c.assignedTopics; console.log(Array.isArray(a) ? a.length : -1)' "$CONTEXT_PATH" 2>/dev/null || print -- -1)"
if [[ "$ASSIGNED_COUNT" != <-> ]]; then
  print -u2 "[codex-daily] WARN: could not read assignedTopics from the context; leaving the target at $ARTICLE_COUNT"
elif (( ASSIGNED_COUNT > 0 && ASSIGNED_COUNT < ARTICLE_COUNT )); then
  print "[codex-daily] PARTIAL BATCH: the backlog can supply only $ASSIGNED_COUNT of $ARTICLE_COUNT article(s) this run; targeting $ASSIGNED_COUNT so the writable article(s) publish instead of being discarded (refill data/blog/topic-backlog.json to restore the full cadence)"
  ARTICLE_COUNT="$ASSIGNED_COUNT"
fi

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
  # Deterministic link repair (added 2026-09-18, scripts/lib/weave-links.cjs):
  # strips links that can never pass the in-prose gate (generic anchors,
  # repeats, self-links), collapses the dumped-block paragraphs, and weaves the
  # missing links into existing paragraphs as short bridge sentences. A body
  # that already passes is untouched, so the writer keeps first crack. Runs
  # BEFORE normalize so the recomputed word counts include what it added.
  node scripts/lib/weave-links.cjs --queue "$QUEUE_PATH" --posts "$ROOT/data/blog/posts.json" --min 3 || print -u2 "[codex-daily] WARN: weave-links did not run cleanly; the gate below still decides"
  # Stamped-paragraph repair (added 2026-09-18 PM, scripts/lib/rewrite-stamped-paragraphs.cjs --queue):
  # a paragraph duplicated between batchmates, or copied from a published
  # article, is rewritten for its article by Codex here, BEFORE the batch-overlap
  # gate runs, the same way weave-links repairs links.
  node scripts/lib/rewrite-stamped-paragraphs.cjs --queue "$QUEUE_PATH" --posts "$ROOT/data/blog/posts.json" --site "kristamashore.ai (Krista Mashore on using AI in a real estate or small business, plain and practical)" --effort medium || print -u2 "[codex-daily] WARN: stamped-paragraph repair did not run; the gate below still decides"
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

# Fallback batch (2026-09-18 PM). The first scheduled blog run under the
# batch-overlap gate failed all 8 attempts: attempts 2 and 4 failed ONLY the
# overlap gate (five publishable articles each), later attempts fixed the
# overlap and broke word count instead, and the fail-open below only ever
# looked at the LAST attempt. Keep the most recent batch whose only failures
# were the two quality gates (in-prose links, batch overlap) so the fail-open
# has a real candidate at the end. Krista 2026-08-24: "no matter what... make
# sure that the articles are created and posted." The sentinel and health
# check [46] still say exactly what was bypassed.
save_fallback_candidate() {
  # $1 = validation log of an attempt that just failed
  local checker non_bypassable
  checker="$(grep -E '^\[(check-codex-daily-article|codex-daily-check|codex-batch-check)\]' "$1" 2>/dev/null || true)"
  [[ -n "$checker" ]] || return 0
  non_bypassable="$(print -r -- "$checker" | grep -vE '\[IN-PROSE-LINKS\]|\[BATCH-OVERLAP\]' || true)"
  [[ -z "$non_bypassable" ]] || return 0
  grep -qE '^\[codex-daily\] (expected|Codex did not change)' "$1" 2>/dev/null && return 0
  cp "$QUEUE_PATH" "$RUN_DIR/fallback-queue.json"
  cp "$1" "$RUN_DIR/fallback-validation.log"
  print "[codex-daily] kept this attempt's batch as the fallback candidate (only the link/overlap quality gates failed)"
}

GENERATION_OK=0
ATTEMPT_FEEDBACK=""
# Guard feedback from the last attempt that actually produced articles, so an
# empty attempt in between no longer erases what the writer was told to fix
# (2026-09-18: attempt 1 failed the link gate, attempt 2 wrote nothing, and
# attempt 3 was told only "write something", not "fix the links").
LAST_GUARD_FEEDBACK=""
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
    print "Model budget: GPT-5.6 Luna, medium reasoning, standard service tier, at most 8 tool calls."
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

  # Compare against what was already dirty when this run started generating, not
  # against one hardcoded filename. Fixed 2026-09-07.
  #
  # This guard exists to catch CODEX writing outside the queue, and it was written
  # before scripts/ensure-backlog.cjs existed, so its allow-set was the literal
  # string "data/blog/queue.json". ensure-backlog.cjs (shipped 2026-08-24) writes
  # topic-backlog.json and pending-wave.json well before Codex ever runs. The first
  # time it actually auto-loaded — 2026-08-31, "[ensure-backlog] AUTO-LOADED 5
  # topic(s)" — this guard saw the runner's OWN two files, reported them as
  # "Codex changed files outside queue.json", and exit 1'd. That left the tree
  # dirty, and the clean precondition at the top then aborted every run for the
  # next seven days. One missing arrival edit, seven days of a dead publisher.
  # See .claude/rules/nothing-ships-alone.md, kind 3.
  #
  # Deriving the baseline rather than lengthening the literal is the point: the
  # next script that legitimately writes before Codex must not have to remember to
  # come back and edit this line, which is precisely the failure that cost a week.
  UNEXPECTED="$(git status --porcelain --untracked-files=all | awk '{ print substr($0,4) }' \
    | sort | comm -23 - "$PRE_CODEX_DIRTY" | grep -v '^data/blog/queue.json$' || true)"
  if [[ -n "$UNEXPECTED" ]]; then
    print -u2 "[codex-daily] Codex changed files outside queue.json:"
    print -r -- "$UNEXPECTED"
    exit 1
  fi
  if [[ "$CODEX_EXIT" != "0" ]]; then
    ATTEMPT_FEEDBACK="Codex exited with status $CODEX_EXIT. Produce a fresh valid queue."
    continue
  fi

  # Keep every attempt's candidate batch beside its logs (2026-09-18 PM).

  cp "$QUEUE_PATH" "$ATTEMPT_DIR/queue.json" 2>/dev/null || true

  VALIDATION_LOG="$ATTEMPT_DIR/validation.log"
  if validate_candidate > "$VALIDATION_LOG" 2>&1; then
    cat "$VALIDATION_LOG"
    GENERATION_OK=1
    break
  fi
  cat "$VALIDATION_LOG"
  save_fallback_candidate "$VALIDATION_LOG"
  ATTEMPT_FEEDBACK="$(tail -60 "$VALIDATION_LOG")"
  LAST_GUARD_FEEDBACK="$ATTEMPT_FEEDBACK"
done

# Fail-open for the in-prose-links gate ONLY (Krista 2026-08-24, verbatim:
# "no matter what, even if I don't approve, still make sure that the
# articles are created and posted on my blogs"). If every attempt is
# exhausted and the ONLY reason the last candidate failed is the
# in-prose-links gate (every other deterministic gate on it passed), publish
# it anyway rather than losing the whole day, and leave a dated sentinel plus
# a WARN log line instead of silently lowering the bar. Any OTHER failure
# still fails the run. See scripts/lib/in-prose-links.cjs.
# Fallback batch restore (2026-09-18 PM, see save_fallback_candidate above).
if [[ "$GENERATION_OK" != "1" && -f "$RUN_DIR/fallback-queue.json" ]]; then
  cp "$RUN_DIR/fallback-queue.json" "$QUEUE_PATH"
  VALIDATION_LOG="$RUN_DIR/fallback-validation.log"
  print "[codex-daily] no clean batch after $MAX_GENERATION_ATTEMPTS attempts; trying the fallback batch under the fail-open quality gates"
fi
IN_PROSE_BYPASSED=0
if [[ "$GENERATION_OK" != "1" ]]; then
  IN_PROSE_BYPASS_REASONS=""
  QUEUE_COUNT_NOW="$(node -e 'const q=require(process.argv[1]); console.log(Array.isArray(q)?q.length:0)' "$QUEUE_PATH" 2>/dev/null || echo 0)"
  CHECKER_LINES="$(grep -E '^\[codex-daily-check\]' "$VALIDATION_LOG" 2>/dev/null || true)"
  NON_BYPASSABLE="$(print -r -- "$CHECKER_LINES" | grep -vE '\[IN-PROSE-LINKS\]|\[BATCH-OVERLAP\]' || true)"
  BYPASS_LOG="$RUN_DIR/in-prose-bypass-validation.log"
  if [[ -n "$CHECKER_LINES" && -z "$NON_BYPASSABLE" && "$QUEUE_COUNT_NOW" == "$ARTICLE_COUNT" ]] \
     && CODEX_BYPASS_IN_PROSE_LINKS=1 validate_candidate > "$BYPASS_LOG" 2>&1; then
    cat "$BYPASS_LOG"
    IN_PROSE_BYPASS_REASONS="$(print -r -- "$CHECKER_LINES" | grep -E '\[IN-PROSE-LINKS\]|\[BATCH-OVERLAP\]' || true)"
    GENERATION_OK=1
    IN_PROSE_BYPASSED=1
    print "[codex-daily] publishing $ARTICLE_COUNT article(s) (in-prose-links gate bypassed)"
  else
    restore_queue
    node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" 0
    commit_backlog_bookkeeping
    print -u2 "[codex-daily] no article passed validation; published content is unchanged"
    exit 1
  fi
fi
if (( IN_PROSE_BYPASSED == 1 )); then
  IN_PROSE_SENTINEL="$ROOT/data/blog/.in-prose-links-failed"
  mkdir -p "$(dirname "$IN_PROSE_SENTINEL")"
  {
    print "date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    print "slugs: $(node -e 'const q=require(process.argv[1]); console.log(q.map(a=>a.slug).join(","))' "$QUEUE_PATH")"
    print "reasons:"
    print -r -- "$IN_PROSE_BYPASS_REASONS"
  } > "$IN_PROSE_SENTINEL"
  print -u2 "[codex-daily] WARN: published with the in-prose-links gate bypassed (fail-open, Krista 2026-08-24) — see $IN_PROSE_SENTINEL"
fi

node scripts/publish-batch.cjs --no-git "--count=$ARTICLE_COUNT"
node scripts/check-codex-daily-article.cjs --posts-head "$ARTICLE_COUNT"
node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" "$ARTICLE_COUNT"
if [[ "$(node -e 'const q=require(process.argv[1]); console.log(q.length)' "$QUEUE_PATH")" != "0" ]]; then
  print -u2 "[codex-daily] queue is not empty after publish"
  exit 1
fi

# 2026-09-14 fix: this used to be a bare `npm run build`, so a build failure
# (e.g. a bad internal link in the freshly merged posts.json — the live
# incident that blocked this site 2026-09-13/14) killed the script via set -e
# with NOTHING restored: publish-batch.cjs had already merged the unverified
# article into posts.json and emptied queue.json, and both stayed dirty,
# unpublished, and un-built. Every run after that died instantly on the
# clean-repo precondition, same disease as the bookkeeping bug above but for
# a different pair of files and a different trigger. git checkout is safe
# here because nothing from this run has been committed yet at this point.
if ! npm run build; then
  print -u2 "[codex-daily] build failed after merging the batch into posts.json; reverting posts.json and queue.json to the last committed state"
  git checkout -- data/blog/posts.json data/blog/queue.json
  commit_backlog_bookkeeping
  exit 1
fi
node "$PRESERVATION_SCRIPT" verify "$SNAPSHOT" "$ARTICLE_COUNT"
NEW_SLUGS="$(node "$PRESERVATION_SCRIPT" new-slugs "$SNAPSHOT")"
print "[codex-daily] new slugs:"
print -r -- "$NEW_SLUGS"

if [[ "$MODE" == "--canary" ]]; then
  print "[codex-daily] CANARY PASSED. Nothing was committed, pushed, deployed, or published live."
  exit 0
fi

# topic-backlog.json and pending-wave.json are the second half of the same
# 2026-08-24 arrival edit that the guard above was missing: ensure-backlog.cjs
# writes them, and without them here they stay uncommitted after every auto-load
# and re-block the next morning's clean precondition. Added 2026-09-07.
git add data/blog/posts.json data/blog/queue.json data/blog/topic-backlog.json data/blog/pending-wave.json public
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
    # Every new article in the batch must be live and crawlable.
    ALL_NEW_OK=1
    while IFS= read -r slug; do
      [[ -z "$slug" ]] && continue
      if ! curl -fsSL -A "GPTBot/1.0" "$LIVE_URL/articles/$slug" > "$RUN_DIR/live-$slug.html" \
        || ! grep -qi '<article' "$RUN_DIR/live-$slug.html"; then
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

# Daily review email (auto-send exception (j) in the vault's CLAUDE.md).
# Krista removed HERSELF 2026-08-19 ("I do not need these emails"). Her
# approval point for this site is the weekly Monday title-wave proposal
# (exception (k)), not per-article emails. Hailey (socialmedia@) gets the
# daily review copy. Do NOT re-add doit@ without her explicit direction.
# Bonus channel — never fails the run.
print -r -- "$NEW_SLUGS" | "$ROOT/scripts/send-publish-email.zsh" \
  "kristamashore.ai" "$LIVE_URL" \
  "socialmedia@kristamashore.com tc@kristahomes.com" || true

print "[codex-daily] LIVE RUN PASSED. Existing articles remained unchanged and the new article is crawlable."
