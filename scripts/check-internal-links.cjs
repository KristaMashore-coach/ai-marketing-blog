#!/usr/bin/env node
// Build-time guard. Fails the build if any post's body OR internalLinks array
// contains a link/slug that would 404 in production.
//
// Ported from krista-mashore-content-site/scripts/check-internal-links.cjs
// 2026-08-22 (kristamashore.ai had no equivalent — a real gap found during a
// cross-site audit, alongside 925move.com). Adapted for two facts specific to
// this site's schema (confirmed against a live posts.json before writing this):
//   1. internalLinks here is an array of BARE SLUG STRINGS (e.g.
//      "claude-code-for-non-programmers"), not {url,text} objects like
//      925move's schema, and not inline hrefs like the blog's. Each entry must
//      equal a real post slug.
//   2. Article bodies DO also embed inline <a href="/articles/<slug>"> links
//      (confirmed live — one was found missing the /articles/ prefix on
//      2026-08-22 and fixed by hand: "you-replacement-test-ai-system" linked
//      bare "/authority-agent-operating-system-5-layers"). Static/pillar
//      routes must match scripts/generate-sitemap.cjs's SITE_URL routes +
//      pillars array — if those change, update STATIC_ROUTES here too.
//
// This is the last line of defense after generation. If this trips, a broken
// or hallucinated internal link is about to ship live.

const fs = require('fs');
const path = require('path');

const POSTS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data/blog/posts.json'), 'utf8')
);

const SLUGS = new Set(POSTS.map((p) => p.slug));

// Must match scripts/generate-sitemap.cjs's static routes + pillars array.
const PILLARS = [
  'authority-agent-operating-system',
  'ai-content-to-client-system',
  'ai-run-business',
  'community-market-leaders-ai',
  'claude-for-dummies',
];
const STATIC_ROUTES = new Set(['/', '/articles', '/about', '/privacy', '/terms', ...PILLARS.map((p) => `/${p}`)]);

function isValidInternalHref(href) {
  if (!href) return true;
  if (href.startsWith('http://') || href.startsWith('https://')) return true;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return true;
  if (href.startsWith('#')) return true;

  const clean = href.split(/[?#]/)[0];
  if (STATIC_ROUTES.has(clean)) return true;

  if (clean.startsWith('/articles/')) {
    const slug = clean.slice('/articles/'.length).replace(/\/$/, '');
    return SLUGS.has(slug);
  }

  return false;
}

const failures = [];
for (const post of POSTS) {
  const bad = [];

  // 1. Inline <a href> tags in body HTML — must use /articles/<slug> or a
  // valid static/pillar route.
  const body = post.body || '';
  const re = /<a\s+[^>]*href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(body)) !== null) {
    const href = m[1];
    if (!isValidInternalHref(href)) bad.push(`body: ${href}`);
  }

  // 2. The internalLinks array — bare slug strings, each must be a real post.
  for (const link of post.internalLinks || []) {
    if (typeof link !== 'string') {
      bad.push(`internalLinks: non-string entry ${JSON.stringify(link)}`);
      continue;
    }
    if (!SLUGS.has(link)) bad.push(`internalLinks: ${link}`);
  }

  if (bad.length) failures.push({ slug: post.slug, bad });
}

if (failures.length === 0) {
  console.log(`[check-internal-links] ✓ ${POSTS.length} posts contain only valid internal links`);
  process.exit(0);
}

console.error(`[check-internal-links] ✗ ${failures.length} post(s) contain broken internal links:`);
for (const f of failures) {
  console.error(`  - ${f.slug}:`);
  for (const bad of f.bad) {
    console.error(`      ${bad}`);
  }
}
console.error('');
console.error('Internal article links must use /articles/<slug> format where <slug> exists in posts.json.');
console.error(`internalLinks array entries must be bare slugs that exist in posts.json.`);
console.error(`Valid static/pillar routes: ${[...STATIC_ROUTES].join(', ')}`);
console.error('Fix by hand in data/blog/posts.json before building.');
process.exit(1);
