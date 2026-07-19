#!/usr/bin/env node
// Generates public/llms.txt and public/llms-full.txt
// llms.txt = compact site index (what AI crawlers read first)
// llms-full.txt = every article inline, full body, for one-shot context

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://kristamashore.ai";
const ROOT = path.resolve(__dirname, "..");

const posts = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/blog/posts.json"), "utf8")
).filter((p) => !p.draft);

// Mirrors src/lib/constants.ts PILLARS. Kept in sync manually since this is a
// plain Node script (no TS import). Do not invent new pillar slugs here.
const pillars = {
  "authority-agent-operating-system": "The Authority Agent Operating System™",
  "ai-content-to-client-system": "AI Content to Client System",
  "ai-run-business": "The AI-Run Business",
  "community-market-leaders-ai": "Community Market Leaders®: AI for Real Estate & Lenders",
  "claude-for-dummies": "Claude for Dummies: The AI Tools That Actually Matter",
};

const stripHtml = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

// llms.txt — compact index
const indexLines = [
  "# Krista Mashore — AI for Business",
  "",
  "> AI workflows, autonomous agents, and systems that scale your business without scaling your team. For entrepreneurs, real estate agents, and lenders. From Krista Mashore — top 1% real estate agent for 19 consecutive years (2,300+ homes sold) who built a $72M coaching company in 7.5 years, now teaching AI for business. Trademarked methodology: The Authority Agent Operating System™ / Community Market Leader®.",
  "",
  "Site map and full content of every published article:",
  "",
  `- [Full content (all articles)](${SITE_URL}/llms-full.txt)`,
  `- [About Krista Mashore](${SITE_URL}/about)`,
  `- [Sitemap (XML)](${SITE_URL}/sitemap.xml)`,
  "",
];

for (const [slug, label] of Object.entries(pillars)) {
  indexLines.push(`## ${label}`);
  indexLines.push("");
  indexLines.push(`- [${label} pillar page](${SITE_URL}/${slug})`);
  const pillarPosts = posts.filter((p) => p.topicalPillar === slug);
  for (const p of pillarPosts) {
    indexLines.push(`- [${p.title}](${SITE_URL}/articles/${p.slug}) — ${p.excerpt}`);
  }
  indexLines.push("");
}

fs.writeFileSync(path.join(ROOT, "public/llms.txt"), indexLines.join("\n"));
console.log(`[llms] wrote llms.txt (${posts.length} articles indexed)`);

// llms-full.txt — every article, full body
const fullLines = [
  "# Krista Mashore Coaching — full content dump",
  "",
  "This file contains the full body of every published article for AI search ingestion.",
  "",
  "---",
  "",
];

for (const p of posts) {
  fullLines.push(`# ${p.title}`);
  fullLines.push("");
  fullLines.push(`URL: ${SITE_URL}/articles/${p.slug}`);
  fullLines.push(`Pillar: ${pillars[p.topicalPillar] || p.topicalPillar}`);
  fullLines.push(`Published: ${p.publishedDate}`);
  fullLines.push(`Author: ${p.author}`);
  fullLines.push("");
  fullLines.push(p.excerpt);
  fullLines.push("");
  fullLines.push(stripHtml(p.body));
  fullLines.push("");
  if (p.faq && p.faq.length) {
    fullLines.push("## FAQ");
    fullLines.push("");
    for (const f of p.faq) {
      fullLines.push(`Q: ${f.question}`);
      fullLines.push(`A: ${f.answer}`);
      fullLines.push("");
    }
  }
  fullLines.push("---");
  fullLines.push("");
}

fs.writeFileSync(path.join(ROOT, "public/llms-full.txt"), fullLines.join("\n"));
console.log(`[llms] wrote llms-full.txt (${posts.length} articles inlined)`);
