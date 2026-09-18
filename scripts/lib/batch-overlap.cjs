#!/usr/bin/env node
// CANONICAL COPY: ~/Automation/krista-mashore-content-codex/scripts/lib/batch-overlap.cjs
// Mirrored byte-for-byte into kristamashore-ai-codex, 925move-codex, and
// mashore-autobody-codex. Edit the canonical copy first, then re-copy.
//
// Built 2026-09-18. On the first scheduled run under the in-prose link gate,
// the writer's third attempt did not write three articles: it wrote a node
// template with one shared `base` paragraph array and stamped it into all
// three, swapping a few words and the link slugs. Every article reported the
// same visible word count. Measured against the published archives the same
// morning, the pattern was already old: blog.kristamashore.com had 247
// paragraphs shared by exactly five posts (its batch size), kristamashore.ai
// 81 shared by five, 925move 40 shared by five, Mashore Autobody 149 shared by
// three (its batch size). Nothing had ever looked, because every gate checked
// one article at a time.
//
// This gate looks across the batch and at the archive:
//   - a paragraph or list item of 12+ words that appears in two articles of
//     the same batch is a template stamp, always rejected;
//   - a paragraph of 20+ words copied from a published article is rejected
//     UNLESS that paragraph is site boilerplate, defined as appearing in 8 or
//     more published posts already (the autobody call-us paragraph is in 37).
// Prints its denominator when run from the CLI, per nothing-ships-alone.md.
"use strict";

const BLOCK_RE = /<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;

function normalize(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:quot|#39);/g, "")
    .replace(/&(?:amp|lt|gt|nbsp);/g, " ")
    .toLowerCase()
    // Compare words only: punctuation, quotes, and entity spelling never hide a copy.
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function paragraphsOf(body, minWords) {
  const out = [];
  const seen = new Set();
  let m;
  BLOCK_RE.lastIndex = 0;
  while ((m = BLOCK_RE.exec(String(body || ""))) !== null) {
    if (/<(p|li)\b/i.test(m[2])) continue; // nested block, the inner one is counted
    const text = normalize(m[2]);
    if (!text || text.split(" ").length < minWords) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

/**
 * checkParagraphOverlap(article, batch, published, opts)
 *   article    the candidate being checked ({ slug, body })
 *   batch      every candidate in this batch, including `article`
 *   published  the site's published posts (may include the batch in --posts-tail mode;
 *              anything whose slug is in the batch is ignored)
 *   opts.minWords           batch comparison floor, default 12
 *   opts.publishedMinWords  archive comparison floor, default 20
 *   opts.boilerplateFloor   occurrences at which a published paragraph is site
 *                           boilerplate and exempt, default 8
 * Returns { ok, reasons, stats: { paragraphs, batchHits, publishedHits } }
 */
function checkParagraphOverlap(article, batch, published, opts = {}) {
  const minWords = Number.isInteger(opts.minWords) ? opts.minWords : 12;
  const publishedMinWords = Number.isInteger(opts.publishedMinWords) ? opts.publishedMinWords : 20;
  const boilerplateFloor = Number.isInteger(opts.boilerplateFloor) ? opts.boilerplateFloor : 8;

  const reasons = [];
  const mine = paragraphsOf(article.body, minWords);
  const batchSlugs = new Set((batch || []).map((a) => a && a.slug).filter(Boolean));

  // Batch: any shared paragraph is a stamp.
  const batchIndex = new Map();
  for (const other of batch || []) {
    if (!other || other === article || other.slug === article.slug) continue;
    for (const text of paragraphsOf(other.body, minWords)) {
      if (!batchIndex.has(text)) batchIndex.set(text, other.slug);
    }
  }
  let batchHits = 0;
  for (const text of mine) {
    const from = batchIndex.get(text);
    if (from) {
      batchHits += 1;
      if (batchHits <= 3) reasons.push(`paragraph duplicated in batchmate ${from}: "${text.slice(0, 70)}..."`);
    }
  }
  if (batchHits > 3) reasons.push(`${batchHits - 3} more paragraph(s) duplicated within the batch`);

  // Archive: copied from a published post, unless it is site boilerplate.
  const archiveIndex = new Map(); // text -> Set(slugs)
  for (const post of published || []) {
    if (!post || !post.slug || batchSlugs.has(post.slug) || post.slug === article.slug) continue;
    for (const text of paragraphsOf(post.body, publishedMinWords)) {
      if (!archiveIndex.has(text)) archiveIndex.set(text, new Set());
      archiveIndex.get(text).add(post.slug);
    }
  }
  let publishedHits = 0;
  for (const text of mine) {
    if (text.split(" ").length < publishedMinWords) continue;
    const slugs = archiveIndex.get(text);
    if (!slugs || slugs.size >= boilerplateFloor) continue;
    publishedHits += 1;
    if (publishedHits <= 3) reasons.push(`paragraph copied from published article ${[...slugs][0]}: "${text.slice(0, 70)}..."`);
  }
  if (publishedHits > 3) reasons.push(`${publishedHits - 3} more paragraph(s) copied from published articles`);

  return { ok: reasons.length === 0, reasons, stats: { paragraphs: mine.length, batchHits, publishedHits } };
}

module.exports = { checkParagraphOverlap, paragraphsOf };

if (require.main === module) {
  const fs = require("fs");
  const args = process.argv.slice(2);
  if (args[0] === "--self-test") {
    runSelfTest();
  } else if (args[0] === "--posts-tail") {
    // Audit mode: treat the last N published posts as a batch and report.
    const n = Number(args[1] || 5);
    const postsPath = args[2] || "data/blog/posts.json";
    const posts = JSON.parse(fs.readFileSync(postsPath, "utf8"));
    const sorted = [...posts].sort((a, b) => new Date(a.publishedDate || 0) - new Date(b.publishedDate || 0));
    const batch = sorted.slice(-n);
    let bad = 0;
    for (const a of batch) {
      const r = checkParagraphOverlap(a, batch, posts);
      if (!r.ok) {
        bad += 1;
        console.log(`FAIL ${a.slug}: ${r.reasons.join("; ")}`);
      }
    }
    console.log(`[batch-overlap] scanned=${batch.length} failing=${bad}`);
    process.exit(bad ? 1 : 0);
  } else {
    console.error("usage: batch-overlap.cjs --self-test | --posts-tail N [posts.json]");
    process.exit(2);
  }
}

function runSelfTest() {
  const w = (n, seed) => Array.from({ length: n }, (_, i) => `word${seed}${i}`).join(" ");
  const p = (t) => `<p>${t}</p>`;
  const cases = [];

  // 1. Two batchmates sharing one 15-word paragraph: FAIL for both.
  {
    const shared = w(15, "s");
    const a = { slug: "a", body: p(w(30, "a")) + p(shared) };
    const b = { slug: "b", body: p(w(30, "b")) + p(shared) };
    cases.push({ name: "shared paragraph within batch fails", run: () => !checkParagraphOverlap(a, [a, b], []).ok && !checkParagraphOverlap(b, [a, b], []).ok });
  }
  // 2. Same paragraph but under 12 words: ignored.
  {
    const shared = w(8, "s");
    const a = { slug: "a", body: p(w(30, "a")) + p(shared) };
    const b = { slug: "b", body: p(w(30, "b")) + p(shared) };
    cases.push({ name: "short shared line ignored", run: () => checkParagraphOverlap(a, [a, b], []).ok });
  }
  // 3. Copied from one published article: FAIL.
  {
    const shared = w(25, "s");
    const a = { slug: "a", body: p(w(30, "a")) + p(shared) };
    const pub = { slug: "old", body: p(shared) + p(w(30, "o")) };
    cases.push({ name: "copied from a published article fails", run: () => !checkParagraphOverlap(a, [a], [pub]).ok });
  }
  // 4. Site boilerplate (in 8+ published posts): allowed.
  {
    const shared = w(25, "s");
    const a = { slug: "a", body: p(w(30, "a")) + p(shared) };
    const pubs = Array.from({ length: 8 }, (_, i) => ({ slug: `old${i}`, body: p(shared) + p(w(30, "o" + i)) }));
    cases.push({ name: "boilerplate in 8+ posts allowed", run: () => checkParagraphOverlap(a, [a], pubs).ok });
  }
  // 5. Same paragraph in only 7 published posts: still a copy, FAIL.
  {
    const shared = w(25, "s");
    const a = { slug: "a", body: p(w(30, "a")) + p(shared) };
    const pubs = Array.from({ length: 7 }, (_, i) => ({ slug: `old${i}`, body: p(shared) + p(w(30, "o" + i)) }));
    cases.push({ name: "copy present in 7 posts still fails", run: () => !checkParagraphOverlap(a, [a], pubs).ok });
  }
  // 6. --posts-tail shape: the article itself is inside `published`; never self-matches.
  {
    const a = { slug: "a", body: p(w(30, "a")) + p(w(25, "s")) };
    cases.push({ name: "article inside published set never self-matches", run: () => checkParagraphOverlap(a, [a], [a, { slug: "z", body: p(w(30, "z")) }]).ok });
  }
  // 7. Tag/entity/quote differences do not hide a copy.
  {
    const base = w(20, "s");
    const a = { slug: "a", body: `<p>${base} it&#39;s “quoted”</p>` };
    const b = { slug: "b", body: `<p><strong>${base}</strong> it's "quoted"</p>` };
    cases.push({ name: "markup and entity differences still match", run: () => !checkParagraphOverlap(a, [a, b], []).ok });
  }
  // 8. Clean batch of three distinct articles: OK, and stats report paragraphs scanned.
  {
    const arts = ["a", "b", "c"].map((s) => ({ slug: s, body: p(w(30, s + "1")) + p(w(30, s + "2")) }));
    cases.push({ name: "distinct batch passes with denominator", run: () => arts.every((x) => { const r = checkParagraphOverlap(x, arts, []); return r.ok && r.stats.paragraphs === 2; }) });
  }

  let pass = 0;
  for (const c of cases) {
    let ok = false;
    let err = "";
    try { ok = !!c.run(); } catch (e) { err = e.message; }
    console.log(`${ok ? "PASS" : "FAIL"} - ${c.name}${err ? " (threw: " + err + ")" : ""}`);
    if (ok) pass++;
  }
  console.log(`\n${pass}/${cases.length} self-test cases behaved as expected.`);
  process.exit(pass === cases.length ? 0 : 1);
}
