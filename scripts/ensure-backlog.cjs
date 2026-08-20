#!/usr/bin/env node
// ensure-backlog.cjs — keep the topic backlog deep enough that waiting on a
// human reply can never stop articles from being written.
//
// KRISTA-DIRECTED 2026-08-20, in chat:
//   "I want to make sure that even if they don't get back to you in time, it
//    never inhibits the articles from being written and they get written anyway."
//
// WHAT IT REPLACES. Until today the chain was fail-CLOSED: aeo-article-strategy-
// refresh emailed a wave proposal, nothing entered the backlog until Krista
// replied APPROVED, and run-codex-daily.sh threw "BACKLOG EMPTY" the morning the
// last approved topic was consumed. That fired for real on 2026-08-15 (blog
// backlog dry, publishing paused) and again ~2026-08-09. Approval latency, not
// topic supply, was stopping the presses.
//
// WHAT IT DOES. The weekly refresh now always writes its mined wave to
// data/blog/pending-wave.json whether or not anyone has replied. This script
// runs at the top of every daily run and promotes topics out of the pending wave
// into topic-backlog.json when the backlog can no longer cover the next batch.
// Approval becomes a chance to EDIT the wave, not a gate that halts it.
//
// WHAT IT DELIBERATELY DOES NOT DO. It never invents a topic. If there is no
// pending wave to draw from it promotes nothing and exits 0, letting the
// existing BACKLOG EMPTY guard fire with its own message. "Never blocked by a
// human" is not the same as "publish anything" — Krista's standing rule is that
// every article answers a question real people actually ask, so topic supply
// stays sourced from the refresh's question-intent mining.
//
// It also validates every topic against the SAME limits check-topic-backlog.cjs
// enforces (title <= 70, metaTitle <= 60, unique slug) BEFORE promoting it.
// Promoting an unsatisfiable topic would recreate the 2026-08-04 deadlock, where
// 5 over-length titles were reassigned every morning and the blog published
// nothing for 3 days. An invalid pending topic is skipped and reported, never
// promoted.
//
// Usage: node scripts/ensure-backlog.cjs [--target N] [--min-days N]
// Exit 0 always (advisory). Writes topic-backlog.json in place when it promotes.

const fs = require("fs");
const path = require("path");

const TITLE_MAX = 70;       // must match check-topic-backlog.cjs
const META_TITLE_MAX = 60;  // must match check-topic-backlog.cjs

const argv = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : dflt;
};
const DAILY_TARGET = argOf("--target", Number(process.env.CODEX_DAILY_ARTICLE_COUNT) || 5);
// Keep this many days of runway. 2 days means a promotion happens the run
// BEFORE the backlog would have gone dry, never on the dry morning itself.
const MIN_DAYS = argOf("--min-days", 2);

const DATA = path.join(__dirname, "..", "data", "blog");
const BACKLOG_PATH = path.join(DATA, "topic-backlog.json");
const PENDING_PATH = path.join(DATA, "pending-wave.json");
const POSTS_PATH = path.join(DATA, "posts.json");

const readJson = (p, dflt) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return dflt; }
};
// The backlog is an array in some sites and {topics:[...]} in others. Preserve
// whichever shape we were handed so we never silently rewrite the file format.
const unwrap = (raw) => (Array.isArray(raw) ? raw : (raw && (raw.topics || raw.items)) || []);
const rewrap = (raw, items) => {
  if (Array.isArray(raw)) return items;
  const out = { ...raw };
  if (raw && raw.topics) out.topics = items; else out.items = items;
  return out;
};

const backlogRaw = readJson(BACKLOG_PATH, null);
if (backlogRaw === null) {
  console.log("[ensure-backlog] no topic-backlog.json at this site; nothing to do");
  process.exit(0);
}
const backlog = unwrap(backlogRaw);
const posts = readJson(POSTS_PATH, []);
const publishedSlugs = new Set((Array.isArray(posts) ? posts : []).map((p) => p.slug));
const backlogSlugs = new Set(backlog.map((t) => t.slug).filter(Boolean));

const remaining = backlog.filter(
  (t) => (!t.status || t.status === "ready") && !publishedSlugs.has(t.slug)
);
const floor = DAILY_TARGET * MIN_DAYS;

console.log(
  `[ensure-backlog] runway: ${remaining.length} unpublished ready topic(s), ` +
  `target ${DAILY_TARGET}/day, floor ${floor} (${MIN_DAYS}d)`
);

if (remaining.length >= floor) {
  console.log("[ensure-backlog] backlog is deep enough; no promotion needed");
  process.exit(0);
}

const pendingRaw = readJson(PENDING_PATH, null);
const pending = unwrap(pendingRaw);
if (!pending.length) {
  // Deliberately quiet-but-visible. Publishing may still succeed off the
  // remaining topics; if it cannot, the BACKLOG EMPTY guard downstream is the
  // thing that fails the run, and daily-health-check greps for this line to
  // tell Krista the refresh owes a wave.
  console.log(
    "[ensure-backlog] NO PENDING WAVE to promote — the weekly refresh has not " +
    "left one at data/blog/pending-wave.json. Topics are never invented here."
  );
  process.exit(0);
}

const need = floor - remaining.length;
const promoted = [];
const skipped = [];

for (const t of pending) {
  if (promoted.length >= need) break;
  const id = t.slug || t.title || "(unnamed)";
  if (!t.slug || !t.title) { skipped.push(`${id}: missing slug or title`); continue; }
  if (backlogSlugs.has(t.slug)) { skipped.push(`${id}: already in backlog`); continue; }
  if (publishedSlugs.has(t.slug)) { skipped.push(`${id}: already published`); continue; }
  if (t.title.length > TITLE_MAX) {
    skipped.push(`${id}: title ${t.title.length} chars > ${TITLE_MAX} (would deadlock the writer)`);
    continue;
  }
  if (typeof t.metaTitle === "string" && t.metaTitle.length > META_TITLE_MAX) {
    skipped.push(`${id}: metaTitle ${t.metaTitle.length} chars > ${META_TITLE_MAX}`);
    continue;
  }
  backlogSlugs.add(t.slug);
  promoted.push({
    ...t,
    status: "ready",
    autoLoaded: true,
    autoLoadedAt: new Date().toISOString(),
    autoLoadedReason: `backlog runway fell to ${remaining.length} (floor ${floor}); promoted without waiting on approval per Krista 2026-08-20`,
  });
}

for (const s of skipped) console.log(`[ensure-backlog] skipped ${s}`);

if (!promoted.length) {
  console.log("[ensure-backlog] pending wave had nothing promotable; backlog unchanged");
  process.exit(0);
}

const nextBacklog = rewrap(backlogRaw, backlog.concat(promoted));
const nextPending = pending.filter((t) => !promoted.some((p) => p.slug === t.slug));

fs.writeFileSync(BACKLOG_PATH, JSON.stringify(nextBacklog, null, 2) + "\n");
fs.writeFileSync(PENDING_PATH, JSON.stringify(rewrap(pendingRaw, nextPending), null, 2) + "\n");

console.log(
  `[ensure-backlog] AUTO-LOADED ${promoted.length} topic(s) from the pending wave ` +
  `so publishing continues without waiting on a reply:`
);
for (const p of promoted) console.log(`[ensure-backlog]   + ${p.title}`);
console.log(`[ensure-backlog] ${nextPending.length} topic(s) remain in the pending wave`);
process.exit(0);
