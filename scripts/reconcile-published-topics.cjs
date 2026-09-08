#!/usr/bin/env node
/**
 * reconcile-published-topics.cjs
 *
 * Closes out backlog topics that have actually been published.
 *
 * WHY THIS EXISTS (2026-09-08 incident):
 * Nothing in the pipeline ever marked a topic as done. A topic stayed
 * status:"ready" forever and was excluded from selection only by a
 * consumption-time filter (build-codex-daily-context.cjs: status === "ready"
 * AND not in publishedSlugs). That was fine until check-topic-backlog.cjs
 * gained a cannibalisation gate scoped to new waves (>= wave 9): the moment a
 * wave-9 topic published, its own slug appeared in posts.json, and the gate
 * then flagged it as an unsatisfiable entry and ABORTED every subsequent run.
 * Four topics published on 2026-09-08 and the 15:05 run aborted on those exact
 * four. Left alone, every future wave-9+ topic would arm the same trap the day
 * it published, and the blog would have stopped publishing entirely.
 *
 * The gate is correct and is NOT weakened. What was missing is the housekeeping
 * step the gate's own error message asks a human to perform. This does it, in
 * code, before the gate runs.
 *
 * Idempotent. Reports its denominator (scanned=) so a zero can never be read as
 * a pass — see .claude/rules/nothing-ships-alone.md.
 */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data", "blog");
const BACKLOG_PATH = path.join(DATA, "topic-backlog.json");
const POSTS_PATH = path.join(DATA, "posts.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

let backlog;
let posts;
try {
  backlog = readJson(BACKLOG_PATH);
  posts = readJson(POSTS_PATH);
} catch (err) {
  console.error(`[reconcile-published] GATE DOWN: could not read inputs (${err.message}). Not reporting clean.`);
  process.exit(2);
}

const topics = Array.isArray(backlog.topics) ? backlog.topics : [];
const postList = Array.isArray(posts) ? posts : Array.isArray(posts.posts) ? posts.posts : [];

if (!postList.length) {
  console.error("[reconcile-published] GATE DOWN: posts.json read as empty. Refusing to reconcile against an empty published set.");
  process.exit(2);
}

const publishedDateBySlug = new Map();
for (const p of postList) {
  if (p && p.slug) publishedDateBySlug.set(p.slug, p.publishedDate || p.modifiedDate || null);
}

const changed = [];
for (const t of topics) {
  if (!t || t.status !== "ready" || !t.slug) continue;
  if (!publishedDateBySlug.has(t.slug)) continue;
  t.status = "published";
  t.publishedAt = publishedDateBySlug.get(t.slug);
  changed.push(t.slug);
}

console.error(
  `[reconcile-published] scanned=${topics.length} published_slugs_read=${publishedDateBySlug.size} closed=${changed.length}`
);

if (!changed.length) process.exit(0);

for (const s of changed) console.error(`[reconcile-published]   closed ${s}`);

const DRY = process.argv.includes("--dry-run");
if (DRY) {
  console.error("[reconcile-published] --dry-run: no file written.");
  process.exit(0);
}

fs.writeFileSync(BACKLOG_PATH, `${JSON.stringify(backlog, null, 2)}\n`);
console.error(`[reconcile-published] wrote ${path.relative(process.cwd(), BACKLOG_PATH)}`);
