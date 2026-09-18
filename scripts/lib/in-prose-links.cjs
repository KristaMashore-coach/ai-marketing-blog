#!/usr/bin/env node
// CANONICAL COPY: ~/Automation/krista-mashore-content-codex/scripts/lib/in-prose-links.cjs
// Mirrored byte-for-byte into the other three Codex publisher repos
// (kristamashore-ai-codex, 925move-codex, mashore-autobody-codex). Edit the
// canonical copy first, then re-copy into the other three. Do not diverge —
// four slightly-different copies of the same gate is exactly the drift this
// file exists to prevent.
//
// Built 2026-09-18 to fix the class "articles ship with no real in-prose
// internal links" (Krista-OS/_Operations-Log.md, 2026-09-18 entry). Diagnosis:
// blog.kristamashore.com's checker counted DISTINCT `/articles/<slug>` hrefs
// in the body against a floor of 5, but never checked that the anchor text
// was real, that hrefs weren't repeated, or where in the body the links sat.
// The model satisfied the floor by appending the SAME 5-link block with the
// anchor text "related guidance" up to 15x at the very end of the body — 75
// links, 5 distinct, zero of them "woven into sentences" the way the prompt
// asked for. kristamashore.ai and 925move had no body check at all (only the
// internalLinks metadata array length), and 925move's schema comment says
// that array is "separate metadata rendered as a related-articles section,
// not inline body links" — architecturally the same dump pattern the blog's
// own rule already excludes ("the auto-rendered related-posts grid does NOT
// count"). mashore-autobody had no check-codex-daily-article.cjs at all.
//
// This module is the single source of truth for what "a real in-prose link"
// means, so all four repos enforce the identical definition instead of each
// inventing its own partial version.
"use strict";

const GENERIC_ANCHORS = new Set([
  "related guidance",
  "click here",
  "read more",
  "learn more",
  "this article",
  "find out more",
  "see more",
  "more info",
  "more information",
  "this guide",
  "this post",
  "check it out",
  "here",
]);

const BLOCK_TAGS_RE = /<\/?(p|li|h[1-6])\b[^>]*>/gi;
const LINK_RE = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function visibleTextLength(html) {
  return stripTags(html).length;
}

function anchorWordCount(text) {
  const clean = stripTags(text);
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
}

// Net depth of {p, li, h1-h6} elements open at a given character index.
// Not a real parser: a linear counter over the block-tag tokens found before
// the index. Good enough for the simple, non-deeply-nested HTML these Codex
// writers produce (verified against live posts.json bodies from all four
// sites before writing this), and it correctly flags the one pattern that
// matters: links appended after the last real block closes.
function buildDepthIndex(html) {
  const events = [];
  let m;
  BLOCK_TAGS_RE.lastIndex = 0;
  while ((m = BLOCK_TAGS_RE.exec(html)) !== null) {
    const isClose = m[0][1] === "/";
    events.push({ index: m.index, delta: isClose ? -1 : 1 });
  }
  return events;
}

function depthBeforeIndex(events, index) {
  let depth = 0;
  for (const ev of events) {
    if (ev.index >= index) break;
    // Clamp at zero on every step. A stray closing tag (a body that begins
    // with </p>, seen live on blog.kristamashore.com 2026-09-18) used to drive
    // the counter to -1 and make every later <p> read as depth 0, flagging real
    // in-paragraph links as loose text. Unbalanced closes are harmless now.
    depth = Math.max(0, depth + ev.delta);
  }
  return depth;
}

/**
 * checkInProseLinks(bodyHtml, opts)
 *
 * opts:
 *   min             {number}  minimum distinct internal links required. Default 5.
 *   pathPrefix      {string}  internal link path prefix. Default "/articles/".
 *   selfSlug        {string}  this article's own slug; a self-link is never counted.
 *   firstLinkMaxPct {number}  first link must appear at or before this fraction
 *                             of visible body text length. Default 0.6 (60%).
 *   lastBlockPct    {number}  fraction of the tail that must NOT hold every link.
 *                             Default 0.8 — i.e. not all links may sit in the
 *                             final 20% of the body.
 *   minAnchorWords  {number}  minimum words in anchor text. Default 3.
 *
 * Returns { ok, reasons: string[], stats: { distinct, total, firstAtPct, lastBlockPct } }
 */
function checkInProseLinks(bodyHtml, opts = {}) {
  const min = Number.isInteger(opts.min) ? opts.min : 5;
  const pathPrefix = opts.pathPrefix || "/articles/";
  const selfSlug = opts.selfSlug || null;
  const firstLinkMaxPct = typeof opts.firstLinkMaxPct === "number" ? opts.firstLinkMaxPct : 0.6;
  const lastBlockPct = typeof opts.lastBlockPct === "number" ? opts.lastBlockPct : 0.8;
  const minAnchorWords = Number.isInteger(opts.minAnchorWords) ? opts.minAnchorWords : 3;

  const html = String(bodyHtml || "");
  const reasons = [];
  const totalTextLen = visibleTextLength(html) || 1;
  const depthEvents = buildDepthIndex(html);

  const links = [];
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(html)) !== null) {
    const href = m[1];
    const clean = href.split(/[?#]/)[0];
    if (!clean.startsWith(pathPrefix)) continue; // only count same-site article links
    const slug = clean.slice(pathPrefix.length).replace(/\/$/, "");
    if (selfSlug && slug === selfSlug) continue; // a self-link doesn't count either way
    const anchorText = stripTags(m[2]);
    const startIndex = m.index;
    const textBefore = visibleTextLength(html.slice(0, startIndex));
    const depth = depthBeforeIndex(depthEvents, startIndex);
    links.push({
      href: clean,
      slug,
      anchorText,
      anchorWords: anchorWordCount(anchorText),
      pctPos: textBefore / totalTextLen,
      insideBlock: depth > 0,
    });
  }

  const distinctHrefs = new Set(links.map((l) => l.href));
  const total = links.length;
  const distinct = distinctHrefs.size;

  // (a) distinct-link floor
  if (distinct < min) {
    reasons.push(
      `only ${distinct} distinct internal link(s) found; needs at least ${min} (total link tags: ${total})`
    );
  }

  // (b) no href repeated
  const hrefCounts = new Map();
  for (const l of links) hrefCounts.set(l.href, (hrefCounts.get(l.href) || 0) + 1);
  const repeatedHrefs = [...hrefCounts.entries()].filter(([, count]) => count > 1);
  if (repeatedHrefs.length) {
    reasons.push(
      `href(s) repeated more than once: ${repeatedHrefs.map(([href, count]) => `${href} (x${count})`).join(", ")}`
    );
  }

  // (c) anchor text: no reuse across links, >=3 words, not generic
  const anchorCounts = new Map();
  for (const l of links) {
    const key = l.anchorText.trim().toLowerCase();
    if (!key) continue;
    anchorCounts.set(key, (anchorCounts.get(key) || 0) + 1);
  }
  const reusedAnchors = [...anchorCounts.entries()].filter(([, count]) => count > 1);
  if (reusedAnchors.length) {
    reasons.push(
      `anchor text reused across more than one link: ${reusedAnchors.map(([text, count]) => `"${text}" (x${count})`).join(", ")}`
    );
  }
  const shortAnchors = links.filter((l) => l.anchorWords < minAnchorWords);
  if (shortAnchors.length) {
    reasons.push(
      `anchor text under ${minAnchorWords} words: ${[...new Set(shortAnchors.map((l) => `"${l.anchorText}"`))].join(", ")}`
    );
  }
  const genericAnchors = links.filter((l) => GENERIC_ANCHORS.has(l.anchorText.trim().toLowerCase()));
  if (genericAnchors.length) {
    reasons.push(
      `generic anchor text is not allowed: ${[...new Set(genericAnchors.map((l) => `"${l.anchorText}"`))].join(", ")}`
    );
  }

  // (d) distribution: first link before firstLinkMaxPct; not all links in the tail
  let firstAtPct = null;
  if (links.length) {
    firstAtPct = Math.min(...links.map((l) => l.pctPos));
    if (firstAtPct > firstLinkMaxPct) {
      reasons.push(
        `first internal link appears at ${(firstAtPct * 100).toFixed(0)}% of the body; ` +
          `must appear at or before ${(firstLinkMaxPct * 100).toFixed(0)}%`
      );
    }
    const allInTail = links.every((l) => l.pctPos >= lastBlockPct);
    if (allInTail) {
      reasons.push(
        `every internal link sits in the final ${((1 - lastBlockPct) * 100).toFixed(0)}% of the body; ` +
          `links must be spread through the article, not dumped at the end`
      );
    }
  }

  // (e) every link must sit inside a <p>, <li>, or heading element
  const orphanLinks = links.filter((l) => !l.insideBlock);
  if (orphanLinks.length) {
    reasons.push(
      `link(s) not inside a <p>, <li>, or heading element (loose text, not real prose): ` +
        `${[...new Set(orphanLinks.map((l) => l.href))].join(", ")}`
    );
  }

  return {
    ok: reasons.length === 0,
    reasons,
    stats: {
      distinct,
      total,
      firstAtPct: firstAtPct === null ? null : Number(firstAtPct.toFixed(3)),
      lastBlockPct,
    },
  };
}

module.exports = { checkInProseLinks, GENERIC_ANCHORS };

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (require.main === module) {
  const fs = require("fs");
  const args = process.argv.slice(2);

  if (args[0] === "--self-test") {
    runSelfTest();
  } else if (args[0] === "--check") {
    const file = args[1];
    if (!file) {
      console.error("usage: in-prose-links.cjs --check <file.json|file.html> [--min N]");
      process.exit(2);
    }
    const minIdx = args.indexOf("--min");
    const min = minIdx !== -1 ? Number(args[minIdx + 1]) : 5;
    const raw = fs.readFileSync(file, "utf8");
    let body = raw;
    let selfSlug = null;
    // Sniff content, not the filename extension. A temp file from mktemp has
    // no reliable suffix, so detecting JSON by ".json" silently fed raw JSON
    // TEXT to the link scanner as if it were HTML (0 links found, always) the
    // first time this ran inside daily-health-check.sh — caught 2026-09-18.
    const trimmed = raw.trimStart();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        const article = Array.isArray(parsed) ? parsed[0] : parsed;
        if (article && typeof article === "object" && typeof article.body === "string") {
          body = article.body;
          selfSlug = article.slug || null;
        }
      } catch (e) {
        // Not actually valid JSON despite looking like it; fall back to raw.
      }
    }
    const result = checkInProseLinks(body, { min, selfSlug });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  } else {
    console.error("usage: in-prose-links.cjs --self-test | --check <file> [--min N]");
    process.exit(2);
  }
}

function runSelfTest() {
  const cases = [];

  // 1. The exact 15x "related guidance" dump pattern (5 distinct hrefs, each
  //    repeated 3x, all crammed into the tail). Must FAIL.
  {
    const hrefs = [
      "/articles/how-to-ask-for-a-testimonial-without-making-it-awkward",
      "/articles/how-long-does-it-take-to-become-the-known-agent-in-a-town",
      "/articles/what-to-do-when-a-bigger-agent-moves-into-your-farm",
      "/articles/do-real-estate-awards-and-designations-actually-get-you-clients",
      "/articles/how-to-turn-a-closing-into-a-case-study-clients-read",
    ];
    const block = hrefs.map((h) => `<a href="${h}">related guidance</a>`).join(" ");
    const lede = "<p>" + "This is filler prose about networking without pitching. ".repeat(40) + "</p>";
    const dump = `<p>Lead with the problem you solve. ${block}</p>`.repeat(3);
    cases.push({ name: "15x related-guidance dump", body: lede + dump, min: 5, expectOk: false });
  }

  // 2. Zero links. Must FAIL.
  cases.push({
    name: "zero links",
    body: "<p>" + "No links anywhere in this body at all. ".repeat(60) + "</p>",
    min: 5,
    expectOk: false,
  });

  // 3. Clean woven body: 5 distinct hrefs, descriptive unique 3+ word anchors,
  //    first link well before 60%, spread across the body, all inside <p>.
  {
    const filler = "This is real editorial prose about the topic at hand. ";
    const paras = [];
    const anchors = [
      ["/articles/win-before-you-arrive-strategy", "the win before you arrive strategy"],
      ["/articles/known-before-youre-needed-guide", "why known beats needed"],
      ["/articles/top-producer-top-marketer-shift", "the top producer marketing shift"],
      ["/articles/community-market-leader-path", "becoming a community market leader"],
      ["/articles/predictable-lead-generation-system", "a predictable lead generation system"],
    ];
    for (let i = 0; i < anchors.length; i++) {
      const [href, text] = anchors[i];
      paras.push(
        `<p>${filler.repeat(6)}Consider reading <a href="${href}">${text}</a> for more depth on this exact point. ${filler.repeat(3)}</p>`
      );
    }
    const body = "<h2>Intro</h2>" + paras.join("");
    cases.push({ name: "clean woven body", body, min: 5, expectOk: true });
  }

  // 4. Duplicate anchor text across two different hrefs. Must FAIL.
  {
    const body =
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/first-real-slug">read the full guide here</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/second-real-slug">read the full guide here</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/third-real-slug">a different unique phrase</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/fourth-real-slug">another unique phrase here</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/fifth-real-slug">yet another good phrase</a></p>`;
    cases.push({ name: "duplicate anchor text", body, min: 5, expectOk: false });
  }

  // 5. Links only in the last 20% of the body. Must FAIL (distribution).
  {
    const lede = "<p>" + "Long lede paragraph with no links at all in it whatsoever. ".repeat(150) + "</p>";
    const anchors = [
      ["/articles/slug-one", "the first real topic guide"],
      ["/articles/slug-two", "the second real topic guide"],
      ["/articles/slug-three", "the third real topic guide"],
      ["/articles/slug-four", "the fourth real topic guide"],
      ["/articles/slug-five", "the fifth real topic guide"],
    ];
    const tail = `<p>${anchors.map(([h, t]) => `<a href="${h}">${t}</a>`).join(" and ")}</p>`;
    cases.push({ name: "links only in last 20%", body: lede + tail, min: 5, expectOk: false });
  }

  // 6. Generic anchor text ("click here" etc). Must FAIL.
  {
    const body =
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/slug-a">click here</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/slug-b">learn more</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/slug-c">real distinct phrase one</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/slug-d">real distinct phrase two</a></p>` +
      `<p>${"Filler prose. ".repeat(20)}<a href="/articles/slug-e">real distinct phrase three</a></p>`;
    cases.push({ name: "generic anchor text", body, min: 5, expectOk: false });
  }

  // 7. Links present but not inside a block element (dumped raw after the
  //    last </p>). Must FAIL on the containment rule.
  {
    const paras = "<p>" + "Real prose with no links in it. ".repeat(80) + "</p>";
    const loose = [
      ["/articles/slug-a", "first real distinct phrase"],
      ["/articles/slug-b", "second real distinct phrase"],
      ["/articles/slug-c", "third real distinct phrase"],
      ["/articles/slug-d", "fourth real distinct phrase"],
      ["/articles/slug-e", "fifth real distinct phrase"],
    ]
      .map(([h, t]) => `<a href="${h}">${t}</a>`)
      .join(" ");
    cases.push({ name: "links outside any block element", body: paras + loose, min: 5, expectOk: false });
  }

  // 8. Below the repo-specific floor of 3 (autobody/925move/ai-codex case).
  //    Two distinct, well-formed, well-placed links, min=3. Must FAIL only
  //    on the count.
  {
    const filler = "Real editorial prose sentence for padding purposes. ";
    const body =
      `<p>${filler.repeat(6)}<a href="/articles/only-slug-one">the first real topic guide</a>${filler.repeat(3)}</p>` +
      `<p>${filler.repeat(6)}<a href="/articles/only-slug-two">the second real topic guide</a>${filler.repeat(3)}</p>`;
    cases.push({ name: "below repo floor of 3", body, min: 3, expectOk: false });
  }

  // 9. A stray closing tag before the first paragraph (live blog body shape,
  //    caught 2026-09-18) must not turn real in-paragraph links into "loose".
  {
    const filler = "Real editorial prose sentence for padding purposes. ";
    const anchors = [
      ["/articles/stray-one", "the first real topic guide"],
      ["/articles/stray-two", "the second real topic guide"],
      ["/articles/stray-three", "the third real topic guide"],
    ];
    const body =
      "</p><h2>Opening</h2><ol><li>one item</li><li>two item</li></ol>" +
      anchors.map(([h, t]) => `<p>${filler.repeat(6)}<a href="${h}">${t}</a>${filler.repeat(3)}</p>`).join("");
    cases.push({ name: "stray closing tag does not orphan links", body, min: 3, expectOk: true });
  }

  let pass = 0;
  for (const c of cases) {
    const result = checkInProseLinks(c.body, { min: c.min });
    const ok = result.ok === c.expectOk;
    console.log(`${ok ? "PASS" : "FAIL"} - ${c.name} (expected ok=${c.expectOk}, got ok=${result.ok})`);
    if (!ok || !result.ok) {
      for (const r of result.reasons) console.log(`    reason: ${r}`);
    }
    if (ok) pass++;
  }
  console.log(`\n${pass}/${cases.length} self-test cases behaved as expected.`);
  process.exit(pass === cases.length ? 0 : 1);
}
