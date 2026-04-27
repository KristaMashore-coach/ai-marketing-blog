#!/usr/bin/env node
// Flips every draft: true article to draft: false in posts.json.
// Run after Krista has reviewed the seed articles.
//
// Usage:   node scripts/approve-drafts.cjs              # approve all
//          node scripts/approve-drafts.cjs <slug>       # approve one

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data/blog/posts.json");

const targetSlug = process.argv[2];

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
const today = new Date().toISOString();

let flipped = 0;
const flippedSlugs = [];
for (const p of posts) {
  if (p.draft && (!targetSlug || p.slug === targetSlug)) {
    p.draft = false;
    p.modifiedDate = today;
    flipped++;
    flippedSlugs.push(p.slug);
  }
}

if (flipped === 0) {
  console.log(targetSlug ? `No draft found with slug "${targetSlug}".` : "No drafts to approve.");
  process.exit(0);
}

fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
console.log(`Approved ${flipped} article(s):`);
flippedSlugs.forEach((s) => console.log(`  - ${s}`));
console.log("\nNext: run `npm run build` and push to deploy.");
