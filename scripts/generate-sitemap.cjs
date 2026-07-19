#!/usr/bin/env node
// Reads data/blog/posts.json and writes public/sitemap.xml.
// Pillar pages get listed too. lastmod uses each post's modifiedDate.

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://kristamashore.ai";
const ROOT = path.resolve(__dirname, "..");

const posts = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/blog/posts.json"), "utf8")
).filter((p) => !p.draft);

// Mirrors src/lib/constants.ts PILLARS. Kept in sync manually since this is a
// plain Node script (no TS import). Do not invent new pillar slugs here.
const pillars = [
  "authority-agent-operating-system",
  "ai-content-to-client-system",
  "ai-run-business",
  "community-market-leaders-ai",
  "claude-for-dummies",
];

const today = new Date().toISOString().split("T")[0];

const urls = [
  { loc: `${SITE_URL}/`, lastmod: today, priority: "1.0", changefreq: "daily" },
  { loc: `${SITE_URL}/articles`, lastmod: today, priority: "0.9", changefreq: "daily" },
  { loc: `${SITE_URL}/about`, lastmod: today, priority: "0.6", changefreq: "monthly" },
  ...pillars.map((slug) => ({
    loc: `${SITE_URL}/${slug}`,
    lastmod: today,
    priority: "0.8",
    changefreq: "daily",
  })),
  ...posts.map((p) => ({
    loc: `${SITE_URL}/articles/${p.slug}`,
    lastmod: (p.modifiedDate || p.publishedDate).split("T")[0],
    priority: "0.7",
    changefreq: "weekly",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const outPath = path.join(ROOT, "public/sitemap.xml");
fs.writeFileSync(outPath, xml);
console.log(`[sitemap] wrote ${urls.length} urls to public/sitemap.xml`);
