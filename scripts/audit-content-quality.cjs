#!/usr/bin/env node
// Standalone audit of ALREADY-PUBLISHED posts. Read-only, never blocks a build.
//
// Ported from krista-mashore-content-site/scripts/audit-content-quality.cjs
// 2026-08-22 (kristamashore.ai had no equivalent). Adapted for this site's
// schema: internalLinks is an array of bare slug strings (confirmed live
// before writing this — see check-internal-links.cjs), not inline body
// links, so the floor check counts internalLinks.length.
//
// As of 2026-08-22, every one of 59 posts carries 3-4 internalLinks entries
// (schema enforced from day one), so this floor is expected to stay clean.
// This script exists as ongoing insurance, not because a known backlog exists.
//
//   node scripts/audit-content-quality.cjs
//   node scripts/audit-content-quality.cjs --worst 25
//   node scripts/audit-content-quality.cjs --since 2026-07-01

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data", "blog", "posts.json");
const MIN_INTERNAL_LINKS = 3;

const args = process.argv.slice(2);
const argVal = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const SINCE = argVal("--since", null);
const WORST = Number(argVal("--worst", 40));

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
const scoped = SINCE ? posts.filter((p) => (p.publishedDate || "") >= SINCE) : posts;

// Same shape comparison the write-time gate uses: the tail carries boilerplate,
// the head carries the topic noun.
function metaShape(desc) {
  return String(desc || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-10)
    .join(" ");
}

function internalLinkCount(post) {
  return Array.isArray(post.internalLinks) ? post.internalLinks.length : 0;
}

const byShape = new Map();
for (const p of scoped) {
  const shape = metaShape(p.metaDescription);
  if (!shape) continue;
  if (!byShape.has(shape)) byShape.set(shape, []);
  byShape.get(shape).push(p.slug);
}
const dupeGroups = [...byShape.values()].filter((v) => v.length > 1);

const linkCounts = scoped.map((p) => ({ slug: p.slug, n: internalLinkCount(p) }));
const under = linkCounts.filter((x) => x.n < MIN_INTERNAL_LINKS).sort((a, b) => a.n - b.n);

console.log(
  `[audit-content-quality] ${scoped.length} post(s)${SINCE ? ` published on/after ${SINCE}` : ""} of ${posts.length} total\n`
);

if (dupeGroups.length) {
  console.log(`✗ ${dupeGroups.length} group(s) sharing a metaDescription pattern:`);
  for (const g of dupeGroups) {
    console.log(`   [${g.length}] ${g.join(", ")}`);
  }
  console.log("");
} else {
  console.log("✓ every metaDescription is distinct\n");
}

const pct = scoped.length ? ((under.length / scoped.length) * 100).toFixed(1) : "0.0";
if (under.length) {
  console.log(
    `✗ ${under.length} of ${scoped.length} post(s) (${pct}%) are below the ${MIN_INTERNAL_LINKS} internalLinks floor.`
  );
  console.log(`  Worst ${Math.min(WORST, under.length)}:`);
  for (const u of under.slice(0, WORST)) console.log(`   ${String(u.n).padStart(2)} links  ${u.slug}`);
  if (under.length > WORST) console.log(`   ... and ${under.length - WORST} more (--worst N to see more)`);
} else {
  console.log(`✓ every post meets the ${MIN_INTERNAL_LINKS} internalLinks floor`);
}
