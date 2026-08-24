#!/usr/bin/env node
// check-topic-backlog.cjs - refuse a backlog that cannot possibly pass the
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
// EXTENDED (2026-08-24): the identical deadlock shape recurred, one field
// over. "How to Optimize a Zillow and Realtor.com Profile for More Leads"
// (slug optimize-zillow-realtor-com-profile-more-leads) carried "optimize" in
// its title, slug, and primaryKeyword. "optimize" was a BANNED_PHRASE in
// src/lib/voice.cjs. The writer cannot write the assigned topic without using
// the word the topic is named after, so check-codex-daily-article.cjs
// hard-failed every attempt with "voice violations: optimize", all 5
// generation attempts failed. (NOTE 2026-08-24, Krista-directed in chat: she
// un-banned the word itself - "it is okay to use optimize, optimized, etc." -
// so "optimize" was removed from BANNED_PHRASES in src/lib/voice.cjs and
// voice.ts in BOTH codex repos and from every skill/brand-system ban list.
// Do not re-add it. The deadlock CLASS this guard catches is unchanged: any
// banned word living in an assigned title/slug/keyword is still unsatisfiable.)
// The whole batch was rejected, nothing
// published, and the SAME doomed topic would have been reassigned again the
// next morning. Same disease, different field. This extension closes that
// gap the same way the title-length gate closed the first one: read the
// site's real banned-phrase list live (never hand-duplicated, so it can
// never drift from src/lib/voice.cjs) and refuse a topic the writer cannot
// possibly avoid failing on.
//
// This makes that class of deadlock loud and immediate instead of silent.

const fs = require("fs");
const path = require("path");

const TITLE_MAX = 70;        // must match check-codex-daily-article.cjs
const META_TITLE_MAX = 60;

// Read the banned-phrase list LIVE from the site's own voice guard, the same
// way check-codex-daily-article.cjs does, so this can never drift from the
// real gate the article body is actually checked against.
let BANNED_PHRASES = [];
try {
  BANNED_PHRASES = require(path.join(__dirname, "..", "src", "lib", "voice.cjs")).BANNED_PHRASES || [];
} catch (e) {
  BANNED_PHRASES = [];
}

function findBannedPhrase(value) {
  if (typeof value !== "string" || !value) return null;
  for (const phrase of BANNED_PHRASES) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (re.test(value)) return phrase;
  }
  return null;
}

// Only the fields the writer is handed as an assigned, authoritative fact.
// NOT angle: the angle field legitimately QUOTES a banned phrase to tell the
// writer what vague advice to avoid (e.g. "instead of the vague 'optimize
// your profile' advice most guides give"), and flagging that would be a
// false positive that gets this whole guard switched off. NOT
// secondaryKeywords for the same reason it is looser guidance, not an
// assigned title/slug/keyword the writer must reproduce verbatim.
const VOICE_FIELDS = ["title", "slug", "primaryKeyword"];

const file = process.argv[2] ||
  path.join(__dirname, "..", "data", "blog", "topic-backlog.json");

let raw;
try { raw = JSON.parse(fs.readFileSync(file, "utf8")); }
catch (e) { console.error(`[check-topic-backlog] cannot read ${file}: ${e.message}`); process.exit(1); }

const items = Array.isArray(raw) ? raw : (raw.topics || raw.items || []);
if (!items.length) { console.error("[check-topic-backlog] backlog is empty or unrecognised"); process.exit(1); }

// --- Query-intent gate (added 2026-08-24, Krista-directed) --------------
// WHY: Krista read the upcoming titles and said nobody types them. She was
// right. Wave 8 was generated from AEO-SCOREBOARD PROBE wording ("q2 plateaued
// agent, which coaching program") rather than from observed user demand, and
// produced ten titles with no query behind them ("The First 30 Days of
// Coaching for a Plateaued Real Estate Agent"). topic-backlog.json's own
// `method` field CLAIMED every entry traced to an observed query while no
// per-topic evidence existed and nothing checked it: a record about the thing
// instead of the thing (.claude/rules/authoritative-state.md).
//
// Two checks, both scoped to ASSIGNABLE topics from the evidence cutover wave
// forward. Older waves are grandfathered because they are already written or
// retired; grandfathering is stated here, not silent.
//   (a) evidence: a topic must name the observed source its title came from.
//   (b) cannibalisation: a topic whose slug is already published is a
//       duplicate article competing with its own ranking page.
const EVIDENCE_FROM_WAVE = Number(raw.evidenceRequiredFromWave || 9);

function waveNumber(t) {
  const m = String(t.wave || "").match(/^\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

// Published slugs are read from the site's real posts.json, never from a note
// about what was published.
let publishedSlugs = new Set();
let publishedRead = false;
try {
  // Sibling of the backlog file first (so a test fixture can carry its own),
  // then the repo's real posts.json, so passing a custom path does not
  // silently switch the cannibalisation check off.
  const candidates = [
    path.join(path.dirname(file), "posts.json"),
    path.join(__dirname, "..", "data", "blog", "posts.json"),
  ];
  const pf = candidates.find((c) => fs.existsSync(c));
  const pj = JSON.parse(fs.readFileSync(pf, "utf8"));
  const list = Array.isArray(pj) ? pj : (pj.posts || []);
  publishedSlugs = new Set(list.map((x) => x && x.slug).filter(Boolean));
  publishedRead = true;
} catch (e) {
  publishedRead = false;
}

let evidenceScanned = 0;

const errors = [];
const notes = [];
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

  // Topics with status other than "ready" are not assignable
  // (build-codex-daily-context.cjs only draws from status === "ready"), so a
  // banned phrase sitting in a held topic cannot deadlock tomorrow's run. It
  // is reported as a non-fatal note so it stays visible without re-breaking
  // the build for a topic Krista deliberately parked.
  const isAssignable = t.status === "ready";
  for (const field of VOICE_FIELDS) {
    const hit = findBannedPhrase(t[field]);
    if (!hit) continue;
    if (isAssignable) {
      errors.push(`${id}: ${field} contains banned voice phrase "${hit}" (src/lib/voice.cjs BANNED_PHRASES). The writer cannot avoid the word in the body, so check-codex-daily-article.cjs will hard-fail every attempt and publishing will deadlock.`);
    } else {
      notes.push(`${id}: ${field} contains banned voice phrase "${hit}", but status is "${t.status}" (not "ready"), so it is not assignable and cannot deadlock the daily run. Non-fatal.`);
    }
  }

  const wn = waveNumber(t);
  if (isAssignable && wn !== null && wn >= EVIDENCE_FROM_WAVE) {
    evidenceScanned++;
    const ev = typeof t.evidence === "string" ? t.evidence.trim() : "";
    if (ev.length < 20) {
      errors.push(`${id}: missing \`evidence\` (wave ${wn} >= ${EVIDENCE_FROM_WAVE}). Name the observed source this title came from - a live SERP result set, a People Also Ask box, a competing title cluster, or a GSC query row - in the searcher's words. A topic with no observed query behind it is an invented topic. See topic-backlog.json \`method\`.`);
    }
  }

  // Cannibalisation, scoped to NEW waves only. A published slug sitting in the
  // backlog at an OLD wave is normal and correct: the pipeline marks nothing as
  // done, it filters at consumption time (build-codex-daily-context.cjs draws
  // status === "ready" AND not in publishedSlugs), so a completed topic simply
  // stays in place. 105 of 153 entries are in that state. Erroring on those
  // would break every run for a condition that is by design.
  // Limitation, stated rather than hidden: this catches an EXACT slug repeat
  // only. A new topic that duplicates a published article under a different
  // slug still gets through, which is what happened to wave 8 and is why the
  // evidence check above exists as the primary defence.
  if (isAssignable && publishedRead && t.slug && publishedSlugs.has(t.slug) &&
      wn !== null && wn >= EVIDENCE_FROM_WAVE) {
    errors.push(`${id}: slug is ALREADY PUBLISHED in posts.json and this is a new topic (wave ${wn}). Writing it again cannibalises the page that is already ranking. Retire it or give it a genuinely different slug and angle.`);
  }
}

if (notes.length) {
  for (const n of notes) console.log(`[check-topic-backlog] note: ${n}`);
}

if (errors.length) {
  for (const e of errors) console.error(`[check-topic-backlog] ${e}`);
  console.error(`[check-topic-backlog] scanned=${items.length}, evidence_scanned=${evidenceScanned}, published_slugs_read=${publishedRead ? publishedSlugs.size : "FAILED"}. ${errors.length} unsatisfiable backlog entr${errors.length === 1 ? "y" : "ies"}. Fix these or the daily run will fail forever on them.`);
  process.exit(1);
}
console.log(
  `[check-topic-backlog] OK, scanned=${items.length}, ` +
  `evidence_scanned=${evidenceScanned} (wave >= ${EVIDENCE_FROM_WAVE}; earlier waves grandfathered), ` +
  `published_slugs_read=${publishedRead ? publishedSlugs.size : "FAILED - cannibalisation check did NOT run"}, ` +
  `all satisfiable.`
);
