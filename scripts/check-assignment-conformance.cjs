#!/usr/bin/env node
// check-assignment-conformance.cjs, proves the third gate that
// audit-content-quality.cjs's docs claimed but never implemented.
//
// WHY (2026-08-24): a state file recorded "assignment_conformance_failing: 0"
// for two consecutive runs. There was no script anywhere that produced that
// number. It was a check that never ran, reporting a clean result on a defect
// class nobody had ever measured. Per .claude/rules/authoritative-state.md,
// a zero with no denominator is not evidence, it's a record about a thing
// that was never read. This script is the thing.
//
// It compares every SHIPPED post against its BACKLOG assignment (the topic
// the writer was actually handed) on four fields: topicalPillar,
// contentTypePillar, funnelStage, and whether the assigned primaryKeyword
// made it into the post's keywords array. A mismatch means the writer (or a
// later edit) drifted from the plan and nothing caught it.
//
//   node scripts/check-assignment-conformance.cjs
//   node scripts/check-assignment-conformance.cjs --json
//   node scripts/check-assignment-conformance.cjs path/to/other-backlog.json

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DEFAULT_BACKLOG_PATH = path.join(ROOT, "data", "blog", "topic-backlog.json");
const POSTS_PATH = path.join(ROOT, "data", "blog", "posts.json");
const WORST_CAP = 20;

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const positional = args.find((a) => !a.startsWith("--"));
const backlogPath = positional || DEFAULT_BACKLOG_PATH;

function gateDown(reason) {
  if (jsonMode) {
    console.log(JSON.stringify({ error: "gate-down", reason }));
  } else {
    console.error(`[check-assignment-conformance] GATE DOWN: ${reason}`);
  }
  process.exit(2);
}

let backlogRaw;
try {
  backlogRaw = JSON.parse(fs.readFileSync(backlogPath, "utf8"));
} catch (e) {
  gateDown(`cannot read/parse backlog at ${backlogPath}: ${e.message}`);
}

let postsRaw;
try {
  postsRaw = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
} catch (e) {
  gateDown(`cannot read/parse posts at ${POSTS_PATH}: ${e.message}`);
}

const topics = Array.isArray(backlogRaw) ? backlogRaw : backlogRaw.topics || [];
const posts = Array.isArray(postsRaw) ? postsRaw : [];

if (!topics.length) {
  gateDown(`scanned=0, backlog has no topics (${backlogPath})`);
}
if (!posts.length) {
  gateDown(`scanned=0, posts.json has no entries (${POSTS_PATH})`);
}

const postsBySlug = new Map();
for (const p of posts) {
  if (p && p.slug) postsBySlug.set(p.slug, p);
}

function normKeyword(k) {
  return String(k || "").trim().toLowerCase();
}

function keywordPresent(primaryKeyword, keywords) {
  if (!primaryKeyword) return true; // nothing assigned, nothing to violate
  const target = normKeyword(primaryKeyword);
  const list = Array.isArray(keywords) ? keywords : [];
  return list.some((k) => normKeyword(k) === target);
}

const FIELD_KEYS = ["topicalPillar", "contentTypePillar", "funnelStage", "primaryKeyword"];
const byField = { topicalPillar: 0, contentTypePillar: 0, funnelStage: 0, primaryKeyword: 0 };
const mismatches = [];
let matched = 0;

for (const t of topics) {
  const post = postsBySlug.get(t.slug);
  if (!post) continue; // topic not shipped yet (or slug drifted) - not this gate's job
  matched++;

  const fieldMismatches = [];

  if (t.topicalPillar !== post.topicalPillar) {
    fieldMismatches.push(`topicalPillar: backlog=${JSON.stringify(t.topicalPillar)} post=${JSON.stringify(post.topicalPillar)}`);
    byField.topicalPillar++;
  }
  if (t.contentTypePillar !== post.contentTypePillar) {
    fieldMismatches.push(`contentTypePillar: backlog=${JSON.stringify(t.contentTypePillar)} post=${JSON.stringify(post.contentTypePillar)}`);
    byField.contentTypePillar++;
  }
  if (t.funnelStage !== post.funnelStage) {
    fieldMismatches.push(`funnelStage: backlog=${JSON.stringify(t.funnelStage)} post=${JSON.stringify(post.funnelStage)}`);
    byField.funnelStage++;
  }
  if (!keywordPresent(t.primaryKeyword, post.keywords)) {
    fieldMismatches.push(`primaryKeyword: backlog=${JSON.stringify(t.primaryKeyword)} not found in post keywords=${JSON.stringify(post.keywords)}`);
    byField.primaryKeyword++;
  }

  if (fieldMismatches.length) {
    mismatches.push({ slug: t.slug, fields: fieldMismatches });
  }
}

const scanned = topics.length;
const mismatchedCount = mismatches.length;

if (jsonMode) {
  console.log(JSON.stringify({
    scanned,
    matched,
    mismatched: mismatchedCount,
    byField,
  }));
  process.exit(mismatchedCount ? 1 : 0);
}

console.log(
  `[check-assignment-conformance] scanned=${scanned} matched=${matched} mismatched=${mismatchedCount}`
);
console.log("");

if (matched === 0) {
  console.log("✗ 0 backlog topics matched a shipped post by slug. Nothing was actually compared.");
  console.log("  This is not the same as a clean pass, treat it as unverified, not green.");
} else if (mismatchedCount === 0) {
  console.log(`✓ all ${matched} matched post(s) conform to their backlog assignment on all 4 fields`);
} else {
  const pct = ((mismatchedCount / matched) * 100).toFixed(1);
  console.log(`✗ ${mismatchedCount} of ${matched} matched post(s) (${pct}%) drifted from their backlog assignment`);
  console.log("");
  console.log("  Per-field mismatch counts:");
  for (const key of FIELD_KEYS) {
    console.log(`   ${key.padEnd(18)} ${byField[key]}`);
  }
  console.log("");
  const shown = mismatches.slice(0, WORST_CAP);
  console.log(`  Worst offenders (showing ${shown.length} of ${mismatchedCount}):`);
  for (const m of shown) {
    console.log(`   ${m.slug}`);
    for (const f of m.fields) console.log(`     - ${f}`);
  }
  if (mismatches.length > WORST_CAP) {
    console.log(`   ... and ${mismatches.length - WORST_CAP} more omitted (raise the cap in-script to see more)`);
  }
}

process.exit(mismatchedCount ? 1 : 0);
