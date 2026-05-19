#!/usr/bin/env node
// Citation guard. Pre-publish quality gate that refuses to ship articles with
// uncited factual claims. Built to enforce Krista's "no hallucination" rule
// when we publish without human review.
//
// What it flags as REQUIRING a citation in the same paragraph:
//   - any percentage:                "30%", "1-3%", "60 percent"
//   - any "N out of M":              "9 out of 10", "1 in 4"
//   - any "X agents/buyers/sellers": "70% of buyers", "most realtors"
//   - any research/data signal:      "studies show", "research says",
//                                    "according to", "data from", "report"
//   - large numeric counts:          "2.3 million homes", "$50 billion market"
//
// What it does NOT flag (Krista's own recommendations & ranges, not stats):
//   - dollar ranges for ad spend ("$5-50 a day")
//   - durations ("30 days", "3 months", "first year")
//   - common ordinals & list counts ("7 sources", "first 3 things")
//   - hedged claims ("most agents I work with", "in my experience")
//
// A citation = an <a href="..."> link OR a <sup>/footnote in the same <p>
// or list item as the claim.
//
// Usage:
//   node scripts/citation-guard.cjs <path-to-article.json>
//   node scripts/citation-guard.cjs --check-all-live  (audit posts.json)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadArticleFromFile(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

// Phrases that scream "I'm citing research" — these MUST have a link nearby
const RESEARCH_TRIGGERS = [
  /studies?\s+show/i,
  /research\s+(shows?|says?|finds?|from)/i,
  /according\s+to/i,
  /data\s+(shows?|from|says?)/i,
  /report(?:s|ed)?\s+(?:that|by|from)/i,
  /survey\s+(?:found|of|by)/i,
  /statistic(?:s|ally)/i,
  /\bnar\b/i,
  /national\s+association/i,
  /zillow\s+(?:reports?|found|data)/i,
];

// Patterns that are factual claims unless hedged
const FACTUAL_CLAIMS = [
  // percentages: 30%, 1-3%, 60 percent
  { name: 'percentage', re: /\b\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*%/g },
  { name: 'N out of M', re: /\b\d+\s+(?:out\s+of|in)\s+\d+\b/gi },
  // "X percent"
  { name: 'percent word', re: /\b\d+(?:\.\d+)?\s+percent\b/gi },
  // "2.3 million", "50 billion"
  { name: 'big-number scale', re: /\b\d+(?:\.\d+)?\s*(?:million|billion|trillion)\b/gi },
];

// Hedging patterns that make a claim opinion, not statistic
const HEDGES = [
  /\bin\s+my\s+experience\b/i,
  /\bmost\s+agents\s+i\b/i,
  /\bi['']ve\s+(?:seen|worked|found)/i,
  /\bin\s+the\s+(?:rooms|coaching|community)\s+i\b/i,
  /\bagents\s+i\s+coach\b/i,
  /\broughly\b/i,
  /\bsomewhere\s+(?:around|between)\b/i,
];

// Things that look like numbers but aren't stat claims (whitelist)
function isAllowedNumericContext(sentence) {
  const allowed = [
    /\$\d[\d,]*(?:\s*[-–]\s*\$?\d[\d,]*)?\s*(?:a|per)?\s*day/i, // $5-50 a day
    /\$\d[\d,]*(?:\s*[-–]\s*\$?\d[\d,]*)?\s*(?:a|per)?\s*(?:week|month)/i,
    /\bfirst\s+\d+\s+(?:day|week|month|year)s?\b/i, // first 30 days
    /\b\d+\s+(?:day|week|month|year)s?\s+(?:in|of|to)\b/i, // 30 days in
    /\bday\s+\d+\s*[-–]\s*\d+\b/i, // day 1-30
    /\b\d+\s+(?:sources?|things?|steps?|reasons?|ways?|tactics?|strategies?|principles?|rules?|mistakes?)\b/i,
    /\bchapter\s+\d+/i,
    /\bphase\s+\d+/i,
    /\bversion\s+\d+/i,
    /\b\d{4}\b/, // years
    /\bzip\s*code/i,
    // Personal credentials, not stats: "top 1% agent", "top 5% producer"
    /\btop\s+\d+(?:\.\d+)?\s*%\s+(?:agent|producer|broker|realtor|coach|lender)/i,
    // Common phrases that use % as a label not a measurement
    /\b100%\s+(?:committed|focused|sure|guarantee|behind)/i,
  ];
  return allowed.some((re) => re.test(sentence));
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitParagraphs(html) {
  // Treat each <p>, <li>, or <h2>/<h3> block as a candidate "paragraph"
  // so a citation needs to be local to the claim, not 5 paragraphs away.
  const blocks = [];
  const re = /<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[2]);
  }
  return blocks.length ? blocks : [html];
}

function hasCitationNearby(block) {
  return /<a\s+href=/i.test(block) || /<sup\b/i.test(block) || /\[\d+\]/.test(stripTags(block));
}

function findClaims(block) {
  const text = stripTags(block);
  const claims = [];

  for (const trig of RESEARCH_TRIGGERS) {
    const m = text.match(trig);
    if (m) claims.push({ kind: 'research-trigger', match: m[0], context: text });
  }

  for (const fc of FACTUAL_CLAIMS) {
    const matches = text.match(fc.re);
    if (!matches) continue;
    for (const match of matches) {
      // Find the sentence containing this match
      const sentences = text.split(/(?<=[.?!])\s+/);
      const sentence = sentences.find((s) => s.includes(match)) || text;
      if (isAllowedNumericContext(sentence)) continue;
      if (HEDGES.some((h) => h.test(sentence))) continue;
      claims.push({ kind: fc.name, match, context: sentence });
    }
  }

  return claims;
}

function auditArticle(article) {
  const issues = [];
  const blocks = splitParagraphs(article.body || '');

  for (const block of blocks) {
    const claims = findClaims(block);
    if (claims.length === 0) continue;
    if (!hasCitationNearby(block)) {
      for (const c of claims) {
        issues.push({
          kind: c.kind,
          match: c.match,
          context: c.context.slice(0, 200),
        });
      }
    }
  }

  // Also audit FAQ answers
  for (const f of article.faq || []) {
    const claims = findClaims(f.answer);
    if (claims.length === 0) continue;
    if (!/https?:\/\//.test(f.answer)) {
      for (const c of claims) {
        issues.push({
          kind: `FAQ ${c.kind}`,
          match: c.match,
          context: c.context.slice(0, 200),
          location: `FAQ: ${f.question}`,
        });
      }
    }
  }

  return issues;
}

function reportIssues(slug, issues) {
  if (issues.length === 0) {
    console.log(`✓ ${slug}: clean — no uncited factual claims`);
    return true;
  }
  console.log(`✗ ${slug}: ${issues.length} uncited claim(s)`);
  for (const i of issues) {
    console.log(`  [${i.kind}] "${i.match}"`);
    if (i.location) console.log(`    in: ${i.location}`);
    console.log(`    context: ${i.context}`);
  }
  return false;
}

// ----- main -----

const args = process.argv.slice(2);

if (args.includes('--check-all-live')) {
  const posts = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data/blog/posts.json'), 'utf8')
  );
  let pass = 0;
  let fail = 0;
  for (const p of posts) {
    const issues = auditArticle(p);
    if (reportIssues(p.slug, issues)) pass++;
    else fail++;
  }
  console.log(`\n${pass} clean, ${fail} need citations`);
  process.exit(fail === 0 ? 0 : 1);
}

const filePath = args[0];
if (!filePath) {
  console.error(
    'usage: node scripts/citation-guard.cjs <article.json> | --check-all-live'
  );
  process.exit(1);
}

const article = loadArticleFromFile(filePath);
const issues = auditArticle(article);
const ok = reportIssues(article.slug, issues);
process.exit(ok ? 0 : 1);
