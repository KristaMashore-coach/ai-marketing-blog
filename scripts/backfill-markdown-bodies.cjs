#!/usr/bin/env node
// One-shot: convert any posts.json entries whose `body` is still raw markdown
// to HTML so BlogPost.tsx (which uses dangerouslySetInnerHTML) renders them.
//
// Usage:
//   node scripts/backfill-markdown-bodies.cjs              # write + backup
//   node scripts/backfill-markdown-bodies.cjs --dry-run    # preview, no write

const fs = require('fs');
const path = require('path');
const { mdToHtml, isMarkdownBody, wordCountFromHtml } = require('./lib/md-to-html.cjs');

const ROOT = path.resolve(__dirname, '..');
const POSTS_PATH = path.join(ROOT, 'data/blog/posts.json');
const dryRun = process.argv.includes('--dry-run');

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));

const changed = [];
for (const post of posts) {
  if (!isMarkdownBody(post.body)) continue;
  const before = post.body.length;
  const html = mdToHtml(post.body);
  const wc = wordCountFromHtml(html);
  changed.push({ slug: post.slug, before, after: html.length, wc });
  post.body = html;
  post.wordCount = wc;
  post.readingMinutes = Math.max(1, Math.round(wc / 200));
  post.modifiedDate = new Date().toISOString();
}

if (changed.length === 0) {
  console.log('No markdown-formatted bodies found — nothing to convert.');
  process.exit(0);
}

console.log(`Converting ${changed.length} post(s):`);
for (const c of changed) {
  console.log(`  ● ${c.slug}: ${c.before} → ${c.after} chars (${c.wc} words)`);
}

if (dryRun) {
  console.log('\n(dry run — no write performed)');
  process.exit(0);
}

const backup = POSTS_PATH.replace(/\.json$/, `.${Date.now()}.bak.json`);
fs.copyFileSync(POSTS_PATH, backup);
fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2) + '\n');
console.log(`\n✓ wrote ${changed.length} post(s) to posts.json`);
console.log(`  backup: ${backup}`);
