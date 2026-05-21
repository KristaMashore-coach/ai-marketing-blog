#!/usr/bin/env node
// Build-time guard. Fails the build if any post in data/blog/posts.json has a
// body that still contains raw markdown syntax. BlogPost.tsx injects body via
// dangerouslySetInnerHTML expecting HTML; markdown would render as raw text.
//
// This is the last line of defense after auto-publish.cjs and the writer
// prompt. If this trips, something bypassed the converter.

const fs = require('fs');
const path = require('path');

const POSTS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data/blog/posts.json'), 'utf8')
);

const failures = [];
for (const post of POSTS) {
  const body = post.body || '';
  const hits = [];
  if (/(?:^|\n)#{1,3}\s/.test(body)) hits.push('heading (# / ## / ###)');
  if (/\*\*[^*\n]+\*\*/.test(body)) hits.push('bold (**…**)');
  if (/(?<!!)\[[^\]\n]+\]\([^)\n]+\)/.test(body)) hits.push('link ([…](…))');
  if (/!\[[^\]\n]*\]\([^)\n]+\)/.test(body)) hits.push('image (![…](…))');
  if (hits.length) failures.push({ slug: post.slug, hits });
}

if (failures.length === 0) {
  console.log(`[check-post-bodies] ✓ ${POSTS.length} bodies are clean HTML`);
  process.exit(0);
}

console.error(`[check-post-bodies] ✗ ${failures.length} post(s) contain raw markdown syntax:`);
for (const f of failures) {
  console.error(`  - ${f.slug}: ${f.hits.join(', ')}`);
}
console.error('');
console.error('BlogPost.tsx injects body via dangerouslySetInnerHTML expecting HTML.');
console.error('Run: node scripts/backfill-markdown-bodies.cjs');
console.error('Or convert by hand in data/blog/posts.json before building.');
process.exit(1);
