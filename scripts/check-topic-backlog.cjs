#!/usr/bin/env node
// check-topic-backlog.cjs — refuse a backlog that cannot possibly pass the
// article validator.
//
// WHY (2026-08-04): blog.kristamashore.com published nothing for 3 days. The
// writer is handed an assigned title from the backlog and treats it as
// authoritative, but check-codex-daily-article.cjs hard-fails any title over 70
// characters. 5 of 48 backlog entries were over. Any batch drawing one of those
// could never pass, and because nothing published, the backlog never advanced,
// so the SAME doomed topics were reassigned every single morning. A permanent
// deadlock that looked like "the AI keeps failing."
//
// This makes that class of deadlock loud and immediate instead of silent.

const fs = require("fs");
const path = require("path");

const TITLE_MAX = 70;        // must match check-codex-daily-article.cjs
const META_TITLE_MAX = 60;

const file = process.argv[2] ||
  path.join(__dirname, "..", "data", "blog", "topic-backlog.json");

let raw;
try { raw = JSON.parse(fs.readFileSync(file, "utf8")); }
catch (e) { console.error(`[check-topic-backlog] cannot read ${file}: ${e.message}`); process.exit(1); }

const items = Array.isArray(raw) ? raw : (raw.topics || raw.items || []);
if (!items.length) { console.error("[check-topic-backlog] backlog is empty or unrecognised"); process.exit(1); }

const errors = [];
const seen = new Set();
for (const t of items) {
  const id = t.slug || "(no slug)";
  if (!t.slug) errors.push(`${id}: missing slug`);
  else if (seen.has(t.slug)) errors.push(`${id}: duplicate slug in backlog`);
  else seen.add(t.slug);

  if (typeof t.title === "string" && t.title.length > TITLE_MAX)
    errors.push(`${id}: assigned title is ${t.title.length} chars, over the ${TITLE_MAX} limit the article validator enforces. The writer cannot satisfy both. Shorten it here.`);

  if (typeof t.metaTitle === "string" && t.metaTitle.length > META_TITLE_MAX)
    errors.push(`${id}: assigned metaTitle is ${t.metaTitle.length} chars, over the ${META_TITLE_MAX} limit.`);
}

if (errors.length) {
  for (const e of errors) console.error(`[check-topic-backlog] ${e}`);
  console.error(`[check-topic-backlog] ${errors.length} unsatisfiable backlog entr${errors.length === 1 ? "y" : "ies"}. Fix these or the daily run will fail forever on them.`);
  process.exit(1);
}
console.log(`[check-topic-backlog] OK — ${items.length} entries, all satisfiable.`);
