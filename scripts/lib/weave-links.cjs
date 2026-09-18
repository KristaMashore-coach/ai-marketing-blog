#!/usr/bin/env node
// CANONICAL COPY: ~/Automation/krista-mashore-content-codex/scripts/lib/weave-links.cjs
// Mirrored byte-for-byte into kristamashore-ai-codex, 925move-codex, and
// mashore-autobody-codex. Edit the canonical copy first, then re-copy. Four
// slightly different copies of the same repair is the drift this file exists
// to prevent (same contract as in-prose-links.cjs beside it).
//
// Built 2026-09-18, the same day the in-prose link GATE (in-prose-links.cjs)
// went live, after the first scheduled run under that gate showed what the
// gate alone produces: the writer put its links at 73-85% of the body on
// attempt 1, then on attempt 3 wrote a node template that stamped the same
// paragraphs into three articles to satisfy the checks mechanically. A gate
// with no repair path turns a link problem into a content problem and burns
// the whole generation budget on retries. This file is the repair path.
//
// What it does, deterministically and without a model call:
//   1. Removes links that can never pass: generic anchor text ("related
//      guidance", "click here"), anchors under 3 words, repeated hrefs beyond
//      the first occurrence, self-links. A link with real prose anchor text is
//      unwrapped (text kept); a generic one is deleted outright.
//   2. Removes paragraphs left empty by step 1 and exact-duplicate paragraphs
//      (the blog's 15x "related guidance" block collapses to one paragraph).
//   3. Counts the distinct, well-formed links that remain and adds only what is
//      still needed: one short bridge sentence appended INSIDE an existing
//      paragraph, spread through the first ~70% of the article, with the first
//      one early, each pointing at a different published article and using
//      that article's own title as descriptive anchor text.
//   4. Re-runs the gate. Returns ok only if the gate now passes; the caller
//      keeps its own fallback if it does not.
//
// The writer keeps first crack every run: an article whose links already pass
// the gate is untouched (the function is a no-op on a passing body). This is
// the floor under the writer, not a replacement for it.
"use strict";

const { checkInProseLinks, GENERIC_ANCHORS } = require("./in-prose-links.cjs");

const LINK_RE = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const P_RE = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;

// Bridge sentences. Every one is a full sentence that lives inside an existing
// paragraph, uses the target's title as the anchor, and stays clear of every
// banned phrase list in the four repos (no "leverage", "delve", "not only",
// "in conclusion", dashes, or announcement phrases).
const BRIDGES = [
  (a) => ` If you want the step by step version of that, read ${a}.`,
  (a) => ` We go deeper on this in ${a}.`,
  (a) => ` That is the same question behind ${a}, which walks through it in detail.`,
  (a) => ` For a closer look at this part, see ${a}.`,
  (a) => ` There is a fuller breakdown of this in ${a}.`,
  (a) => ` This connects directly to ${a}.`,
  (a) => ` The practical side of this is covered in ${a}.`,
  (a) => ` Before you decide, it helps to read ${a}.`,
];

function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text) {
  const t = stripTags(text);
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tokens(s) {
  return new Set(
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

// Title -> anchor text. Keeps the title's own words (they are the most
// descriptive anchor available and are unique per slug), drops trailing
// punctuation and any " | Site" suffix, and guarantees 3+ words.
function anchorFromTitle(title) {
  let t = String(title || "").split(" | ")[0].trim();
  t = t.replace(/[?!.:]+$/g, "").trim();
  if (t.length > 110) t = t.slice(0, 110).replace(/\s+\S*$/, "");
  if (wordCount(t) < 3) t = `our guide to ${t}`;
  return t;
}

function isGeneric(anchorText) {
  return GENERIC_ANCHORS.has(String(anchorText || "").trim().toLowerCase());
}

// Step 1 + 2: strip links that can never pass, then tidy the paragraphs.
function cleanBody(html, { pathPrefix, selfSlug }) {
  const seenHrefs = new Set();
  const seenAnchors = new Set();
  let removed = 0;
  let unwrapped = 0;
  let out = String(html || "").replace(LINK_RE, (full, href, inner) => {
    const clean = href.split(/[?#]/)[0];
    if (!clean.startsWith(pathPrefix)) return full; // external / static links untouched
    const slug = clean.slice(pathPrefix.length).replace(/\/$/, "");
    const text = stripTags(inner);
    const key = text.toLowerCase();
    const bad =
      (selfSlug && slug === selfSlug) ||
      seenHrefs.has(clean) ||
      isGeneric(text) ||
      wordCount(text) < 3 ||
      seenAnchors.has(key);
    if (!bad) {
      seenHrefs.add(clean);
      seenAnchors.add(key);
      return full;
    }
    if (isGeneric(text) || wordCount(text) < 3) {
      removed += 1;
      return ""; // delete the element entirely
    }
    unwrapped += 1;
    return inner; // keep the prose, drop the link
  });

  // Tidy: collapse doubled spaces left by deletions, drop empty paragraphs,
  // drop exact-duplicate paragraphs (keep the first).
  const seenParas = new Set();
  let droppedParas = 0;
  out = out.replace(P_RE, (full, inner) => {
    const text = stripTags(inner);
    if (!text) {
      droppedParas += 1;
      return "";
    }
    const key = text.toLowerCase();
    if (seenParas.has(key)) {
      droppedParas += 1;
      return "";
    }
    seenParas.add(key);
    return full.replace(/[ \t]{2,}/g, " ").replace(/\s+<\/p>/, "</p>");
  });
  out = out.replace(/\n{3,}/g, "\n\n");
  return { html: out, removed, unwrapped, droppedParas };
}

function existingLinkSlugs(html, pathPrefix, selfSlug) {
  const set = new Set();
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(html)) !== null) {
    const clean = m[1].split(/[?#]/)[0];
    if (!clean.startsWith(pathPrefix)) continue;
    const slug = clean.slice(pathPrefix.length).replace(/\/$/, "");
    if (selfSlug && slug === selfSlug) continue;
    set.add(slug);
  }
  return set;
}

function existingAnchorTexts(html) {
  const set = new Set();
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(html)) !== null) set.add(stripTags(m[2]).toLowerCase());
  return set;
}

// Rank published articles by title/keyword overlap with this article. The
// article's own internalLinks metadata (whatever shape this repo uses) goes
// first: the writer already judged those relevant.
function rankTargets(article, catalog, { pathPrefix, exclude }) {
  const selfTokens = new Set([...tokens(article.title), ...tokens((article.keywords || []).join(" "))]);
  const preferred = [];
  const meta = Array.isArray(article.internalLinks) ? article.internalLinks : [];
  for (const entry of meta) {
    const raw = typeof entry === "string" ? entry : entry && typeof entry.url === "string" ? entry.url : "";
    if (!raw) continue;
    const slug = raw.startsWith(pathPrefix) ? raw.slice(pathPrefix.length).replace(/\/$/, "") : raw.replace(/^\//, "");
    if (slug && !exclude.has(slug) && catalog.has(slug)) preferred.push(slug);
  }
  const scored = [];
  for (const [slug, title] of catalog) {
    if (exclude.has(slug) || preferred.includes(slug)) continue;
    const tt = tokens(title);
    let overlap = 0;
    for (const w of tt) if (selfTokens.has(w)) overlap += 1;
    scored.push({ slug, score: overlap / Math.max(1, tt.size) });
  }
  scored.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  return preferred.concat(scored.map((s) => s.slug));
}

// Paragraph slots eligible to carry a bridge sentence. Level 0 is the strict
// editorial default: a real <p> of 25+ words, no link in it already, no image,
// inside the first 75% of the visible text. Higher levels relax one constraint
// at a time so a short or list-heavy article (2-paragraph stubs exist on every
// site) can still be repaired instead of being left failing:
//   1: <li> items and paragraphs of 12+ words, up to 85% of the body
//   2: paragraphs that already carry a link, up to 90% of the body
function eligibleParagraphs(html, pathPrefix, level = 0) {
  const total = stripTags(html).length || 1;
  const slots = [];
  const re = level >= 1 ? /<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi : /<(p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const maxPct = level >= 2 ? 0.9 : level >= 1 ? 0.85 : 0.75;
  const minWords = level >= 1 ? 12 : 25;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const inner = m[2];
    const start = m.index;
    const pct = stripTags(html.slice(0, start)).length / total;
    if (pct > maxPct) break;
    if (wordCount(inner) < minWords) continue;
    if (/<img\b/i.test(inner)) continue;
    if (tag === "li" && /<(p|li)\b/i.test(inner)) continue; // nested list item, skip
    const hasLink = inner.includes(`href="${pathPrefix}`) || inner.includes(`href='${pathPrefix}`);
    if (hasLink && level < 2) continue;
    slots.push({ start, end: start + m[0].length, pct, close: `</${tag}>` });
  }
  return slots;
}

/**
 * weaveLinks(article, catalog, opts) -> { ok, body, changed, added, removed,
 * unwrapped, droppedParas, reasons }
 *
 *   article  the queue/posts entry ({ slug, title, body, keywords?, internalLinks? })
 *   catalog  Map<slug, title> of every published article (plus batch siblings)
 *   opts.min        distinct links the gate requires (blog 5, others 3)
 *   opts.max        hard ceiling on distinct body links (autobody 5); default none
 *   opts.pathPrefix default "/articles/"
 */
function weaveLinks(article, catalog, opts = {}) {
  const min = Number.isInteger(opts.min) ? opts.min : 5;
  const max = Number.isInteger(opts.max) ? opts.max : Infinity;
  const pathPrefix = opts.pathPrefix || "/articles/";
  const selfSlug = article.slug || null;
  const original = String(article.body || "");

  const before = checkInProseLinks(original, { min, selfSlug, pathPrefix });
  if (before.ok) {
    return { ok: true, body: original, changed: false, added: [], removed: 0, unwrapped: 0, droppedParas: 0, reasons: [] };
  }

  const cleaned = cleanBody(original, { pathPrefix, selfSlug });
  let body = cleaned.html;

  const have = existingLinkSlugs(body, pathPrefix, selfSlug);
  const usedAnchors = existingAnchorTexts(body);
  const after = checkInProseLinks(body, { min, selfSlug, pathPrefix });
  let need = Math.max(0, min - have.size);
  // Distribution failure with enough links: still add one early bridge so the
  // first link lands before the 60% mark. If that would breach the ceiling,
  // unwrap the latest-positioned existing link first.
  if (need === 0 && !after.ok) need = 1;
  while (have.size + need > max && have.size > 0) {
    const last = lastLinkByPosition(body, pathPrefix, selfSlug);
    if (!last) break;
    body = body.slice(0, last.start) + last.inner + body.slice(last.end);
    have.delete(last.slug);
    cleaned.unwrapped += 1;
  }

  const exclude = new Set([...have, selfSlug].filter(Boolean));
  const targets = rankTargets(article, catalog, { pathPrefix, exclude });
  const added = [];

  // Pick slots at the strictest level that can hold every needed link; relax
  // one level at a time only when the article is too short or list-heavy. At
  // the last level a slot may carry two bridges rather than leave the article
  // failing.
  let slots = [];
  let level = 0;
  for (level = 0; level <= 2; level++) {
    slots = eligibleParagraphs(body, pathPrefix, level);
    if (slots.length >= need) break;
  }

  if (need > 0 && slots.length > 0 && targets.length > 0) {
    const k = need;
    const picks = [];
    if (slots.length >= k) {
      // Spread over the first 70% of eligible slots; first one lands early.
      for (let i = 0; i < k; i++) {
        const idx = Math.min(slots.length - 1, Math.floor(((i + 0.5) / k) * 0.7 * slots.length));
        if (!picks.includes(idx)) picks.push(idx);
      }
      let cursor = 0;
      while (picks.length < k && cursor < slots.length) {
        if (!picks.includes(cursor)) picks.push(cursor);
        cursor += 1;
      }
    } else {
      // Fewer slots than links: round-robin so no slot takes more than it must.
      for (let i = 0; i < k; i++) picks.push(i % slots.length);
    }
    picks.sort((a, b) => a - b);

    let ti = 0;
    const insertions = [];
    for (const idx of picks) {
      let chosen = null;
      while (ti < targets.length) {
        const slug = targets[ti++];
        const anchor = anchorFromTitle(catalog.get(slug));
        if (!anchor || usedAnchors.has(anchor.toLowerCase()) || isGeneric(anchor)) continue;
        chosen = { slug, anchor };
        break;
      }
      if (!chosen) break;
      usedAnchors.add(chosen.anchor.toLowerCase());
      const a = `<a href="${pathPrefix}${chosen.slug}">${escapeHtml(chosen.anchor)}</a>`;
      const sentence = BRIDGES[(added.length + hashSeed(selfSlug)) % BRIDGES.length](a);
      insertions.push({ slot: slots[idx], sentence });
      added.push(chosen);
    }
    // Apply from the end so earlier offsets stay valid. Two bridges in one
    // slot are appended in order.
    insertions.sort((x, y) => y.slot.start - x.slot.start || 0);
    const bySlot = new Map();
    for (const ins of insertions) {
      const key = ins.slot.start;
      bySlot.set(key, (bySlot.get(key) || "") + ins.sentence);
    }
    const starts = [...bySlot.keys()].sort((a, b) => b - a);
    for (const start of starts) {
      const slot = slots.find((s) => s.start === start);
      const closeAt = slot.end - slot.close.length;
      body = body.slice(0, closeAt).replace(/\s+$/, "") + bySlot.get(start) + body.slice(closeAt);
    }
  }

  const finalCheck = checkInProseLinks(body, { min, selfSlug, pathPrefix });
  return {
    ok: finalCheck.ok,
    body,
    changed: body !== original,
    added,
    removed: cleaned.removed,
    unwrapped: cleaned.unwrapped,
    droppedParas: cleaned.droppedParas,
    reasons: finalCheck.reasons,
  };
}

function lastLinkByPosition(html, pathPrefix, selfSlug) {
  let last = null;
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(html)) !== null) {
    const clean = m[1].split(/[?#]/)[0];
    if (!clean.startsWith(pathPrefix)) continue;
    const slug = clean.slice(pathPrefix.length).replace(/\/$/, "");
    if (selfSlug && slug === selfSlug) continue;
    last = { start: m.index, end: m.index + m[0].length, inner: m[2], slug };
  }
  return last;
}

function hashSeed(s) {
  let h = 0;
  for (const ch of String(s || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % BRIDGES.length;
}

function buildCatalog(posts, extra = []) {
  const catalog = new Map();
  for (const p of posts.concat(extra)) {
    if (p && typeof p.slug === "string" && typeof p.title === "string" && typeof p.body === "string") {
      catalog.set(p.slug, p.title);
    }
  }
  return catalog;
}

module.exports = { weaveLinks, buildCatalog, anchorFromTitle, cleanBody };

// ---------------------------------------------------------------------------
// CLI
//   --queue <queue.json> --posts <posts.json> --min N [--max M]
//       Weave every queue article that fails the gate, in place. Prints one
//       line per article. Exit 0 whether or not every article could be fixed
//       (the checker that runs next is the gate; this is the repair).
//   --posts <posts.json> --min N [--max M] --backfill [--dry-run]
//       Weave every PUBLISHED article that fails the gate, bump modifiedDate.
//   --self-test
// ---------------------------------------------------------------------------
if (require.main === module) {
  const fs = require("fs");
  const args = process.argv.slice(2);
  const opt = (name, dflt) => {
    const i = args.indexOf(name);
    return i === -1 ? dflt : args[i + 1];
  };
  const has = (name) => args.includes(name);

  if (has("--self-test")) {
    runSelfTest();
  } else if (has("--queue")) {
    const queuePath = opt("--queue");
    const postsPath = opt("--posts");
    const min = Number(opt("--min", 5));
    const max = opt("--max") ? Number(opt("--max")) : undefined;
    const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    const posts = JSON.parse(fs.readFileSync(postsPath, "utf8"));
    if (!Array.isArray(queue) || queue.length === 0) {
      console.log("[weave-links] queue is empty; nothing to do");
      process.exit(0);
    }
    const catalog = buildCatalog(posts, queue);
    let changed = 0;
    let unfixed = 0;
    for (const article of queue) {
      if (!article || typeof article.body !== "string") continue;
      const r = weaveLinks(article, catalog, { min, max });
      if (r.changed) {
        article.body = r.body;
        changed += 1;
        console.log(
          `[weave-links] ${article.slug}: added=${r.added.length} removed=${r.removed} unwrapped=${r.unwrapped} droppedParas=${r.droppedParas} -> ${r.ok ? "PASSES gate" : "still failing: " + r.reasons.join("; ")}`
        );
        for (const a of r.added) console.log(`[weave-links]   + ${a.slug} as "${a.anchor}"`);
      } else if (!r.ok) {
        unfixed += 1;
        console.log(`[weave-links] ${article.slug}: could not repair: ${r.reasons.join("; ")}`);
      }
      if (r.changed && !r.ok) unfixed += 1;
    }
    if (changed) fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n");
    console.log(`[weave-links] scanned=${queue.length} woven=${changed} unfixed=${unfixed}`);
    process.exit(0);
  } else if (has("--backfill")) {
    const postsPath = opt("--posts");
    const min = Number(opt("--min", 5));
    const max = opt("--max") ? Number(opt("--max")) : undefined;
    const dry = has("--dry-run");
    const posts = JSON.parse(fs.readFileSync(postsPath, "utf8"));
    const catalog = buildCatalog(posts);
    const now = new Date().toISOString();
    let changed = 0;
    let unfixed = 0;
    let added = 0;
    for (const article of posts) {
      if (!article || typeof article.body !== "string") continue;
      const r = weaveLinks(article, catalog, { min, max });
      if (!r.changed) {
        if (!r.ok) unfixed += 1;
        continue;
      }
      if (!r.ok) {
        unfixed += 1;
        console.log(`[weave-links] ${article.slug}: still failing after weave: ${r.reasons.join("; ")}`);
      }
      article.body = r.body;
      if (typeof article.modifiedDate === "string") {
        article.modifiedDate = article.modifiedDate.length === 10 ? now.slice(0, 10) : now;
      }
      changed += 1;
      added += r.added.length;
    }
    if (!dry && changed) fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + "\n");
    console.log(`[weave-links] backfill${dry ? " (dry run)" : ""}: scanned=${posts.length} woven=${changed} linksAdded=${added} stillFailing=${unfixed}`);
    process.exit(0);
  } else {
    console.error("usage: weave-links.cjs --self-test | --queue <q.json> --posts <posts.json> --min N [--max M] | --backfill --posts <posts.json> --min N [--max M] [--dry-run]");
    process.exit(2);
  }
}

function runSelfTest() {
  const filler = (n) => "Real editorial prose about the topic at hand, written for a reader. ".repeat(n);
  const catalog = new Map([
    ["how-to-read-a-collision-repair-estimate", "How to Read a Collision Repair Estimate"],
    ["questions-to-ask-a-body-shop-before-repairs", "Questions to Ask a Body Shop Before Repairs"],
    ["oem-vs-aftermarket-parts-collision-repair", "OEM vs Aftermarket Parts in Collision Repair"],
    ["how-long-does-auto-body-repair-take", "How Long Does Auto Body Repair Take?"],
    ["cosmetic-vs-structural-collision-damage", "Cosmetic vs Structural Collision Damage"],
    ["is-it-safe-to-drive-a-damaged-car", "Is It Safe to Drive a Damaged Car Before Inspection?"],
    ["short", "Tips"],
  ]);
  const paras = (n) => Array.from({ length: n }, (_, i) => `<p>${filler(5)} Paragraph ${i + 1}.</p>`).join("\n");
  const cases = [];

  // 1. Zero links, 12 paragraphs, min 3 -> woven, passes, 3 added, first early.
  cases.push({
    name: "zero links gets 3 bridges spread early",
    article: { slug: "self", title: "Car Door Repair Estimate Questions", body: paras(12) },
    min: 3,
    expect: (r) => r.ok && r.added.length === 3 && r.changed,
  });

  // 2. Already passing body is untouched.
  {
    const links = [
      ["how-to-read-a-collision-repair-estimate", "read the estimate line by line"],
      ["questions-to-ask-a-body-shop-before-repairs", "what to ask the shop first"],
      ["oem-vs-aftermarket-parts-collision-repair", "the parts decision explained"],
    ];
    const body = links.map(([s, t], i) => `<p>${filler(4)}See <a href="/articles/${s}">${t}</a>. ${filler(2)}</p>`).join("\n") + paras(4);
    cases.push({ name: "passing body untouched", article: { slug: "self", title: "x", body }, min: 3, expect: (r) => r.ok && !r.changed });
  }

  // 3. The 15x "related guidance" dump: removed, paragraphs deduped, 5 real links woven.
  {
    const hrefs = [...catalog.keys()].slice(0, 5);
    const block = hrefs.map((h) => `<a href="/articles/${h}">related guidance</a>`).join(" ");
    const body = paras(10) + `\n<p>Lead with the problem you solve. ${block}</p>`.repeat(3);
    cases.push({
      name: "15x dump cleaned and rewoven",
      article: { slug: "self", title: "Collision Estimate", body },
      min: 5,
      expect: (r) => r.ok && r.removed === 15 && r.droppedParas === 2 && r.added.length === 5 && !r.body.includes("related guidance"),
    });
  }

  // 4. Links all in the tail (distribution failure, count fine) -> one early bridge, passes.
  {
    const tail = [
      ["how-to-read-a-collision-repair-estimate", "reading the estimate carefully"],
      ["questions-to-ask-a-body-shop-before-repairs", "questions for the shop"],
      ["oem-vs-aftermarket-parts-collision-repair", "the parts decision explained"],
    ].map(([s, t]) => `<p>${filler(1)}<a href="/articles/${s}">${t}</a>.</p>`).join("\n");
    const body = paras(14) + "\n" + tail;
    cases.push({ name: "tail-only links get one early bridge", article: { slug: "self", title: "Estimate", body }, min: 3, expect: (r) => r.ok && r.added.length === 1 });
  }

  // 5. Ceiling: 5 good links all in the tail, max 5 -> unwrap one, add one early, stays at 5.
  {
    const tail = [...catalog.entries()].slice(0, 5).map(([s, t], i) => `<p>${filler(1)}<a href="/articles/${s}">${t.toLowerCase()} detail ${i}</a>.</p>`).join("\n");
    const body = paras(14) + "\n" + tail;
    cases.push({
      name: "ceiling respected when relocating",
      article: { slug: "self", title: "Estimate", body },
      min: 3,
      max: 5,
      expect: (r) => r.ok && r.unwrapped === 1 && r.added.length === 1 && new Set([...r.body.matchAll(/href="\/articles\/([^"]+)"/g)].map((m) => m[1])).size === 5,
    });
  }

  // 6. Self-link and a repeated href are cleaned, then topped up.
  {
    const body =
      `<p>${filler(4)}<a href="/articles/self">this very article again</a>.</p>` +
      paras(8) +
      `<p>${filler(2)}<a href="/articles/how-to-read-a-collision-repair-estimate">reading the estimate carefully</a> and <a href="/articles/how-to-read-a-collision-repair-estimate">reading the estimate carefully</a>.</p>`;
    cases.push({ name: "self-link and repeat cleaned then topped up", article: { slug: "self", title: "Estimate", body }, min: 3, expect: (r) => r.ok && r.unwrapped === 2 && r.added.length === 2 });
  }

  // 7. Too few paragraphs to place anything: reports not ok, never throws.
  cases.push({ name: "no eligible paragraphs reports not ok", article: { slug: "self", title: "x", body: "<p>Short.</p>" }, min: 3, expect: (r) => !r.ok });

  // 8. Short catalog title becomes a 3+ word anchor.
  cases.push({ name: "short title padded to 3 words", article: { slug: "self", title: "Tips", body: "" }, min: 0, expect: () => anchorFromTitle("Tips") === "our guide to Tips" });

  let pass = 0;
  for (const c of cases) {
    let ok = false;
    let detail = "";
    try {
      const r = weaveLinks(c.article, catalog, { min: c.min, max: c.max });
      ok = !!c.expect(r);
      detail = `ok=${r.ok} added=${r.added.length} removed=${r.removed} unwrapped=${r.unwrapped} droppedParas=${r.droppedParas}${r.reasons.length ? " reasons=" + r.reasons.join("; ") : ""}`;
    } catch (e) {
      detail = `threw: ${e.message}`;
    }
    console.log(`${ok ? "PASS" : "FAIL"} - ${c.name} (${detail})`);
    if (ok) pass++;
  }
  console.log(`\n${pass}/${cases.length} self-test cases behaved as expected.`);
  process.exit(pass === cases.length ? 0 : 1);
}
