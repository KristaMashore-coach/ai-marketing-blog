#!/usr/bin/env node
// CANONICAL COPY: ~/Automation/krista-mashore-content-codex/scripts/lib/rewrite-stamped-paragraphs.cjs
// Mirrored byte-for-byte into kristamashore-ai-codex, 925move-codex, and
// mashore-autobody-codex. Edit the canonical copy first, then re-copy.
//
// Built 2026-09-18 on Krista's decision the same morning ("yes to both, rewrite
// them"). Background: the daily writer had been stamping one explanatory
// paragraph into every article of a batch for weeks on all four sites (blog
// 247 paragraphs shared by exactly 5 posts, ai 81, 925move 40, autobody 149
// shared by 3). batch-overlap.cjs now blocks new ones; this pass repairs the
// archive. For every paragraph that appears word-for-word in 2 to 7 published
// posts (8+ is site boilerplate, deliberately left alone, e.g. the autobody
// call-us paragraph in 37 posts), the OLDEST post keeps the original and every
// other post gets a paragraph rewritten for that article by Codex, under the
// same subscription profile the daily writer uses. Every rewrite is validated
// before it is applied: same links preserved verbatim, length within a band,
// no markdown, no dashes, and not identical to anything else in the archive
// or in this run. Applied rewrites checkpoint to posts.json after every batch
// and a state file makes the pass resumable. Prints its denominator.
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const BLOCK_RE = /<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const LINK_RE = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

const BANNED = [
  "leverage", "unlock", "unleash", "robust", "elevate", "delve", "embark", "in today's landscape",
  "groundbreaking", "it is worth noting", "in conclusion", "transformative", "seamless", "utilize",
  "let's explore", "it's important to note", "the reality is", "here's the truth", "not only",
  "cutting-edge", "honestly", "to be honest", "game-changer", "move the needle", "buckle up",
];

function normalize(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:quot|#39);/g, "")
    .replace(/&(?:amp|lt|gt|nbsp);/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function visibleText(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, " ").replace(/\s+/g, " ").trim();
}
function wordCount(html) {
  const t = visibleText(html);
  return t ? t.split(/\s+/).length : 0;
}
function hrefsOf(html) {
  const out = [];
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(String(html || ""))) !== null) out.push(m[1]);
  return out.sort();
}
function blocksOf(body) {
  const out = [];
  let m;
  BLOCK_RE.lastIndex = 0;
  while ((m = BLOCK_RE.exec(String(body || ""))) !== null) {
    if (/<(p|li)\b/i.test(m[2])) continue;
    out.push({ tag: m[1].toLowerCase(), full: m[0], inner: m[2], start: m.index, norm: normalize(m[2]) });
  }
  return out;
}

/**
 * findStampedUnits(posts, opts) -> { units, clusters, index }
 * A unit is one paragraph in one post that must be rewritten (the oldest post
 * in its cluster keeps the original).
 */
function findStampedUnits(posts, opts = {}) {
  const minWords = opts.minWords || 12;
  const minCluster = opts.minCluster || 2;
  const maxCluster = opts.maxCluster || 7;
  const byNorm = new Map(); // norm -> [{slug, block, publishedDate}]
  const index = new Set(); // every normalized paragraph in the archive
  for (const post of posts) {
    if (!post || typeof post.body !== "string" || !post.slug) continue;
    const seen = new Set();
    for (const b of blocksOf(post.body)) {
      if (!b.norm || b.norm.split(" ").length < minWords) continue;
      index.add(b.norm);
      if (seen.has(b.norm)) continue;
      seen.add(b.norm);
      if (!byNorm.has(b.norm)) byNorm.set(b.norm, []);
      byNorm.get(b.norm).push({ slug: post.slug, block: b, publishedDate: post.publishedDate || "" });
    }
  }
  const units = [];
  let clusters = 0;
  for (const [norm, hits] of byNorm) {
    if (hits.length < minCluster || hits.length > maxCluster) continue;
    clusters += 1;
    hits.sort((a, b) => String(a.publishedDate).localeCompare(String(b.publishedDate)) || a.slug.localeCompare(b.slug));
    for (const h of hits.slice(1)) units.push({ id: `${h.slug}#${h.block.start}`, slug: h.slug, norm, block: h.block });
  }
  return { units, clusters, index };
}

function contextFor(post, block) {
  const blocks = blocksOf(post.body);
  const i = blocks.findIndex((b) => b.start === block.start);
  const prev = i > 0 ? visibleText(blocks[i - 1].inner).slice(0, 300) : "";
  const next = i >= 0 && i + 1 < blocks.length ? visibleText(blocks[i + 1].inner).slice(0, 300) : "";
  return { prev, next };
}

function validateRewrite(original, rewritten, archiveIndex, runIndex) {
  const reasons = [];
  const r = String(rewritten || "").trim();
  if (!r) return ["empty"];
  if (/<(p|li|script|style|iframe|h[1-6])\b/i.test(r)) reasons.push("contains a block or script tag");
  if (/[—–]|&mdash;|&ndash;/.test(r)) reasons.push("contains a dash character");
  if (/^#{1,6}\s|\*\*|\[[^\]]+\]\([^)]+\)/.test(r)) reasons.push("contains markdown");
  const wo = wordCount(original), wr = wordCount(r);
  // Short originals (a one-line bridge or CTA) need room to become specific;
  // the band widens below 30 words so a 18-word line may grow to ~40.
  const lo = wo < 30 ? 0.5 : 0.6, hi = wo < 30 ? 2.4 : 1.6;
  if (wr < Math.floor(wo * lo) || wr > Math.ceil(wo * hi)) reasons.push(`length ${wr} words vs original ${wo} (must stay within ${Math.round(lo * 100)}% to ${Math.round(hi * 100)}%)`);
  const ho = hrefsOf(original), hr = hrefsOf(r);
  if (JSON.stringify(ho) !== JSON.stringify(hr)) reasons.push(`links changed: had ${JSON.stringify(ho)}, got ${JSON.stringify(hr)}`);
  const low = visibleText(r).toLowerCase();
  for (const b of BANNED) if (low.includes(b)) reasons.push(`banned phrase "${b}"`);
  const n = normalize(r);
  if (archiveIndex.has(n) || runIndex.has(n)) reasons.push("identical to a paragraph that already exists");
  if (n === normalize(original)) reasons.push("unchanged");
  return reasons;
}

function buildPrompt(site, items) {
  const list = items.map((it) => ({ id: it.id, articleTitle: it.title, before: it.prev, paragraphHtml: it.block.inner, after: it.next }));
  return [
    `You are editing published articles on ${site}. Each paragraph below currently appears word-for-word in several different articles on the site. Rewrite each one so it belongs to ITS article only.`,
    ``,
    `Rules for every rewrite:`,
    `- Say something specific to that article's title and the surrounding text, not a general restatement of the same idea. Add a concrete detail, example, or consequence that fits that article.`,
    `- Keep the same job in the article (same position, same purpose) and a similar length: between 60% and 160% of the original word count.`,
    `- Keep every <a ...>...</a> tag exactly as given: same href, same anchor text, same order. Do not add links.`,
    `- Return the inner HTML only (no <p> or <li> wrapper). Inline tags like <strong> and <em> are fine. No markdown, no headings, no lists.`,
    `- Plain, direct, conversational, second person where the original uses it. No em dashes or en dashes anywhere; use a comma or a period.`,
    `- Never use these phrases: ${BANNED.join(", ")}.`,
    `- Do not mention AI, editing, rewriting, or these instructions.`,
    `- No two rewrites may share a sentence with each other.`,
    ``,
    `Reply with ONLY a JSON array, no prose before or after, in this exact shape: [{"id":"<id>","html":"<inner html>"}, ...] with one entry per input id.`,
    ``,
    `Input:`,
    JSON.stringify(list, null, 2),
  ].join("\n");
}

function callCodex(prompt, opts) {
  const bin = opts.codexBin || "/Applications/ChatGPT.app/Contents/Resources/codex";
  const home = opts.codexHome || path.join(os.homedir(), ".codex", "automation-runtime");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rewrite-stamped-"));
  const outFile = path.join(tmp, "last-message.txt");
  const args = [
    "--ask-for-approval", "never", "exec", "--skip-git-repo-check", "--ignore-user-config", "--ephemeral", "--sandbox", "read-only", "--cd", tmp,
    "--model", opts.model || "gpt-5.6-luna",
    "--config", `model_reasoning_effort="${opts.effort || "medium"}"`,
    "--config", 'service_tier="standard"',
    "--disable", "plugins", "--disable", "remote_plugin", "--disable", "plugin_sharing", "--disable", "apps",
    "--disable", "browser_use", "--disable", "browser_use_external", "--disable", "browser_use_full_cdp_access",
    "--disable", "computer_use", "--disable", "image_generation", "--disable", "in_app_browser", "--disable", "multi_agent",
    "--disable", "goals", "--disable", "workspace_dependencies",
    "--output-last-message", outFile, "-",
  ];
  const res = spawnSync(bin, args, { input: prompt, env: { ...process.env, CODEX_HOME: home }, encoding: "utf8", timeout: opts.timeoutMs || 15 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  let text = "";
  try { text = fs.readFileSync(outFile, "utf8"); } catch (e) { text = res.stdout || ""; }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (res.error) throw res.error;
  return { status: res.status, text, stderr: (res.stderr || "").slice(-2000) };
}

function parseArray(text) {
  const s = String(text || "");
  const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a === -1 || b === -1 || b <= a) throw new Error("no JSON array in reply");
  const arr = JSON.parse(s.slice(a, b + 1));
  if (!Array.isArray(arr)) throw new Error("reply is not an array");
  return arr;
}

function applyRewrite(post, block, newInner) {
  const replacement = block.full.replace(block.inner, newInner);
  const idx = post.body.indexOf(block.full);
  if (idx === -1) return false;
  post.body = post.body.slice(0, idx) + replacement + post.body.slice(idx + block.full.length);
  if (typeof post.wordCount === "number") {
    post.wordCount = wordCount(post.body);
    if (typeof post.readingMinutes === "number") post.readingMinutes = Math.ceil(post.wordCount / 250);
  }
  if (typeof post.modifiedDate === "string") {
    const now = new Date().toISOString();
    post.modifiedDate = post.modifiedDate.length === 10 ? now.slice(0, 10) : now;
  }
  return true;
}

/**
 * findQueueUnits(queue, posts, opts) -> { units, index }
 * Queue mode, used inside the daily runner's validate_candidate the way
 * weave-links.cjs is: a paragraph duplicated between two queue articles (the
 * first article keeps it) or copied from a published article that is not site
 * boilerplate becomes a unit to rewrite before the batch-overlap gate runs.
 */
function findQueueUnits(queue, posts, opts = {}) {
  const minWords = opts.minWords || 12;
  const boilerplateFloor = opts.boilerplateFloor || 8;
  const queueSlugs = new Set(queue.map((a) => a && a.slug).filter(Boolean));
  const archive = new Map(); // norm -> count of published posts
  const index = new Set();
  for (const post of posts) {
    if (!post || typeof post.body !== "string" || queueSlugs.has(post.slug)) continue;
    const seen = new Set();
    for (const b of blocksOf(post.body)) {
      if (!b.norm || b.norm.split(" ").length < minWords || seen.has(b.norm)) continue;
      seen.add(b.norm);
      index.add(b.norm);
      archive.set(b.norm, (archive.get(b.norm) || 0) + 1);
    }
  }
  const units = [];
  const seenInQueue = new Set();
  for (const art of queue) {
    if (!art || typeof art.body !== "string" || !art.slug) continue;
    const seenHere = new Set();
    for (const b of blocksOf(art.body)) {
      if (!b.norm || b.norm.split(" ").length < minWords) continue;
      const dupInBatch = seenInQueue.has(b.norm) || seenHere.has(b.norm);
      const count = archive.get(b.norm) || 0;
      const copied = count > 0 && count < boilerplateFloor;
      seenHere.add(b.norm);
      if (dupInBatch || copied) units.push({ id: `${art.slug}#${b.start}`, slug: art.slug, norm: b.norm, block: b });
    }
    for (const n of seenHere) seenInQueue.add(n);
  }
  return { units, index };
}

module.exports = { findStampedUnits, findQueueUnits, validateRewrite, buildPrompt, parseArray, applyRewrite, normalize, wordCount };

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
  const has = (n) => args.includes(n);
  if (has("--self-test")) { runSelfTest(); }
  else if (has("--audit")) {
    const posts = JSON.parse(fs.readFileSync(opt("--posts"), "utf8"));
    const { units, clusters } = findStampedUnits(posts);
    const affected = new Set(units.map((u) => u.slug));
    console.log(`[rewrite-stamped] audit: posts=${posts.length} clusters=${clusters} paragraphsToRewrite=${units.length} articlesAffected=${affected.size}`);
    process.exit(0);
  } else if (has("--queue")) {
    // Repair mode inside the daily runner: rewrite duplicated paragraphs in the
    // queue before the batch-overlap gate runs. Exit 0 always; the gate decides.
    try {
      runPass({ queuePath: opt("--queue"), postsPath: opt("--posts"), site: opt("--site", "this site"), batch: Number(opt("--batch", 15)),
        limit: Infinity, dry: has("--dry-run"), effort: opt("--effort", "medium"), fake: has("--fake") });
    } catch (e) { console.log(`[rewrite-stamped] queue repair did not run cleanly: ${e.message}`); }
    process.exit(0);
  } else if (has("--run")) {
    runPass({
      postsPath: opt("--posts"), site: opt("--site", "this site"), batch: Number(opt("--batch", 15)),
      limit: opt("--limit") ? Number(opt("--limit")) : Infinity, dry: has("--dry-run"),
      statePath: opt("--state", path.join(path.dirname(opt("--posts")), ".rewrite-stamped-state.json")),
      effort: opt("--effort", "medium"), fake: has("--fake"),
    });
  } else {
    console.error("usage: --self-test | --audit --posts <posts.json> | --run --posts <posts.json> --site <name> [--batch 15] [--limit N] [--dry-run] [--effort medium]");
    process.exit(2);
  }
}

function runPass(o) {
  const posts = JSON.parse(fs.readFileSync(o.postsPath, "utf8"));
  const queue = o.queuePath ? JSON.parse(fs.readFileSync(o.queuePath, "utf8")) : null;
  if (queue && (!Array.isArray(queue) || queue.length === 0)) { console.log("[rewrite-stamped] queue empty; nothing to do"); return; }
  const targets = queue || posts;
  const bySlug = new Map(targets.map((p) => [p.slug, p]));
  let state = { done: {}, failed: {} };
  if (!queue) { try { state = JSON.parse(fs.readFileSync(o.statePath, "utf8")); } catch (e) {} }
  const found = queue ? findQueueUnits(queue, posts) : findStampedUnits(posts);
  const { units, index } = found;
  const clusters = found.clusters || 0;
  const runIndex = new Set();
  const pending = units.filter((u) => !state.done[u.id]).slice(0, o.limit);
  console.log(`[rewrite-stamped] start: posts=${posts.length} clusters=${clusters} paragraphs=${units.length} pending=${pending.length} alreadyDone=${Object.keys(state.done).length}${o.dry ? " (dry run)" : ""}`);
  let rewritten = 0, failed = 0, calls = 0;
  for (let i = 0; i < pending.length; i += o.batch) {
    const items = pending.slice(i, i + o.batch).map((u) => {
      const post = bySlug.get(u.slug);
      const ctx = contextFor(post, u.block);
      return { ...u, title: post.title || "", prev: ctx.prev, next: ctx.next };
    });
    const prompt = buildPrompt(o.site, items);
    let replies = [];
    try {
      if (o.fake) {
        replies = items.map((it) => ({ id: it.id, html: fakeRewrite(it) }));
      } else {
        calls += 1;
        const res = callCodex(prompt, { effort: o.effort });
        try { replies = parseArray(res.text); }
        catch (e) {
          console.log(`[rewrite-stamped] reply head: ${JSON.stringify(String(res.text || "").slice(0, 400))}`);
          console.log(`[rewrite-stamped] stderr tail: ${JSON.stringify(String(res.stderr || "").slice(-600))} status=${res.status}`);
          throw e;
        }
      }
    } catch (e) {
      console.log(`[rewrite-stamped] batch ${Math.floor(i / o.batch) + 1}: call failed: ${e.message}`);
      for (const it of items) { state.failed[it.id] = `call failed: ${e.message}`; failed += 1; }
      persist();
      continue;
    }
    const byId = new Map(replies.filter((r) => r && r.id).map((r) => [r.id, String(r.html || "")]));
    for (const it of items) {
      const html = byId.get(it.id);
      const reasons = validateRewrite(it.block.inner, html, index, runIndex);
      if (reasons.length) {
        state.failed[it.id] = reasons.join("; ");
        failed += 1;
        console.log(`[rewrite-stamped] REJECT ${it.id}: ${reasons.join("; ")}`);
        continue;
      }
      const post = bySlug.get(it.slug);
      if (!o.dry && !applyRewrite(post, it.block, html.trim())) {
        state.failed[it.id] = "original block no longer found in body";
        failed += 1;
        continue;
      }
      runIndex.add(normalize(html));
      state.done[it.id] = true;
      delete state.failed[it.id];
      rewritten += 1;
      if (o.dry) console.log(`[rewrite-stamped] OK ${it.id}\n    was: ${visibleText(it.block.inner).slice(0, 140)}\n    now: ${visibleText(html).slice(0, 140)}`);
    }
    persist();
    console.log(`[rewrite-stamped] batch ${Math.floor(i / o.batch) + 1}/${Math.ceil(pending.length / o.batch)}: rewritten=${rewritten} failed=${failed}`);
  }
  console.log(`[rewrite-stamped] done: paragraphs=${units.length} pending=${pending.length} rewritten=${rewritten} failed=${failed} codexCalls=${calls}`);

  function persist() {
    if (o.dry) return;
    if (queue) { fs.writeFileSync(o.queuePath, JSON.stringify(queue, null, 2) + "\n"); return; }
    fs.writeFileSync(o.postsPath, JSON.stringify(posts, null, 2) + "\n");
    fs.writeFileSync(o.statePath, JSON.stringify(state, null, 2) + "\n");
  }
}

function fakeRewrite(it) {
  // Deterministic stand-in for the self-test: keeps links, changes the words.
  const links = [];
  let m; LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(it.block.inner)) !== null) links.push(m[0]);
  const words = visibleText(it.block.inner.replace(LINK_RE, "")).split(" ");
  const body = `For ${it.title}, ${words.map((w, i) => (i % 2 ? w : w.toUpperCase())).join(" ")} specifically.`;
  return links.length ? `${body} ${links.join(" ")}` : body;
}

function runSelfTest() {
  const w = (n, s) => Array.from({ length: n }, (_, i) => `word${s}${i}`).join(" ");
  const p = (t) => `<p>${t}</p>`;
  const shared = w(20, "s");
  const linked = w(20, "t") + ' <a href="/articles/x">read the x guide</a>';
  const posts = [
    { slug: "old", title: "Old Post", publishedDate: "2026-01-01", body: p(w(30, "a")) + p(shared) + p(w(30, "b")), wordCount: 80, readingMinutes: 1, modifiedDate: "2026-01-01T00:00:00.000Z" },
    { slug: "new1", title: "New One", publishedDate: "2026-02-01", body: p(w(30, "c")) + p(linked) + p(w(30, "d")), wordCount: 84, readingMinutes: 1, modifiedDate: "2026-02-01" },
    { slug: "new2", title: "New Two", publishedDate: "2026-03-01", body: p(w(30, "e")) + p(shared) + p(w(30, "f")), wordCount: 80, readingMinutes: 1, modifiedDate: "2026-03-01T00:00:00.000Z" },
    { slug: "older-linked", title: "Older Linked", publishedDate: "2026-01-15", body: p(w(30, "g")) + p(linked) },
  ];
  const boiler = w(25, "z");
  for (let i = 0; i < 9; i++) posts.push({ slug: `bp${i}`, title: `BP ${i}`, publishedDate: "2026-04-0" + (i % 9 + 1), body: p(w(30, "h" + i)) + p(boiler) });
  const cases = [];
  const { units, clusters, index } = findStampedUnits(posts);
  cases.push(["oldest post keeps the original", !units.some((u) => u.slug === "old" || u.slug === "older-linked") && units.length === 2 && clusters === 2]);
  cases.push(["boilerplate in 9 posts is not a unit", !units.some((u) => u.norm === normalize(boiler))]);
  const u1 = units.find((u) => u.slug === "new1");
  cases.push(["link dropped is rejected", validateRewrite(u1.block.inner, "Totally new words here for this one article and more words to fit the band nicely ok", index, new Set()).some((r) => r.startsWith("links changed"))]);
  cases.push(["too short is rejected", validateRewrite(u1.block.inner, 'short <a href="/articles/x">read the x guide</a>', index, new Set()).some((r) => r.startsWith("length"))]);
  cases.push(["identical to archive is rejected", validateRewrite(u1.block.inner, w(30, "a"), index, new Set()).includes("identical to a paragraph that already exists")]);
  cases.push(["dash is rejected", validateRewrite(u1.block.inner, `${w(20, "q")} — <a href="/articles/x">read the x guide</a>`, index, new Set()).some((r) => r.includes("dash"))]);
  const good = `${w(22, "fresh")} <a href="/articles/x">read the x guide</a>`;
  cases.push(["good rewrite passes", validateRewrite(u1.block.inner, good, index, new Set()).length === 0]);
  const post = posts[1];
  const before = post.wordCount;
  cases.push(["apply replaces block and recounts", applyRewrite(post, u1.block, good) && post.body.includes(good) && !post.body.includes(linked) && post.wordCount !== before && post.modifiedDate.length === 10]);
  // full fake pass in a temp dir
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rs-selftest-"));
  const pp = path.join(tmp, "posts.json");
  fs.writeFileSync(pp, JSON.stringify(posts.map((x) => ({ ...x }))));
  const res = spawnSync(process.execPath, [__filename, "--run", "--posts", pp, "--site", "test", "--fake", "--batch", "10"], { encoding: "utf8" });
  const after = JSON.parse(fs.readFileSync(pp, "utf8"));
  const { units: left } = findStampedUnits(after);
  cases.push(["fake pass leaves no stamped units and writes state", left.length === 0 && fs.existsSync(path.join(tmp, ".rewrite-stamped-state.json")) && /done: paragraphs=/.test(res.stdout)]);
  fs.rmSync(tmp, { recursive: true, force: true });
  // queue mode: two queue articles sharing a paragraph, one copying the archive
  {
    const t2 = fs.mkdtempSync(path.join(os.tmpdir(), "rs-queue-"));
    const qp = path.join(t2, "queue.json"), pp2 = path.join(t2, "posts.json");
    const dup = w(18, "dup");
    const q = [
      { slug: "q1", title: "Q One", body: p(w(30, "qa")) + p(dup), wordCount: 48, readingMinutes: 1 },
      { slug: "q2", title: "Q Two", body: p(w(30, "qb")) + p(dup) + p(w(30, "a")), wordCount: 78, readingMinutes: 1 },
    ];
    fs.writeFileSync(qp, JSON.stringify(q)); fs.writeFileSync(pp2, JSON.stringify(posts));
    const { units: qu } = findQueueUnits(q, posts);
    const ids = qu.map((u) => u.slug + ":" + normalize(u.block.inner).slice(0, 6)).sort();
    cases.push(["queue mode finds the batch duplicate (second article) and the archive copy", ids.join(",") === "q2:dup0 d,q2:word0 " || (qu.length === 2 && qu.every((u) => u.slug === "q2"))]);
    const r2 = spawnSync(process.execPath, [__filename, "--queue", qp, "--posts", pp2, "--site", "test", "--fake"], { encoding: "utf8" });
    const q2 = JSON.parse(fs.readFileSync(qp, "utf8"));
    cases.push(["queue mode rewrites in place and exits 0", r2.status === 0 && findQueueUnits(q2, posts).units.length === 0 && q2[0].body.includes(dup) && !q2[1].body.includes(dup)]);
    fs.rmSync(t2, { recursive: true, force: true });
  }
  let pass = 0;
  for (const [name, ok] of cases) { console.log(`${ok ? "PASS" : "FAIL"} - ${name}`); if (ok) pass++; }
  console.log(`\n${pass}/${cases.length} self-test cases behaved as expected.`);
  process.exit(pass === cases.length ? 0 : 1);
}
