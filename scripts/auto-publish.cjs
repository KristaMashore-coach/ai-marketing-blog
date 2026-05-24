#!/usr/bin/env node
// Auto-publish pipeline: takes new articles from today's writer output, runs
// every quality gate, and publishes them with draft:false. No human approval.
//
// Krista's directive (2026-05-19): "publish 5 articles a day without approval."
// Her other directive: "never hallucinate, every stat needs a source."
// This script enforces directive #2 automatically so directive #1 is safe.
//
// Quality gates (ALL must pass per article — otherwise that article is
// quarantined to ./quarantine/ and skipped, but the other articles still ship):
//   1. Required-fields validation (same shape as queue-article.cjs)
//   2. Voice rules (no banned phrases per src/lib/voice.cjs)
//   3. Citation guard (no uncited stats)
//   4. Slug uniqueness (not already in posts.json)
//   5. Build succeeds with the new content
//
// Usage:
//   node scripts/auto-publish.cjs                  # publish today's articles
//   node scripts/auto-publish.cjs --dir <path>     # publish from arbitrary dir
//   node scripts/auto-publish.cjs --dry-run        # validate only, no commit

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { mdToHtml, isMarkdownBody, wordCountFromHtml } = require('./lib/md-to-html.cjs');

const ROOT = path.resolve(__dirname, '..');
const POSTS_PATH = path.join(ROOT, 'data/blog/posts.json');
const NODE = process.execPath;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dirArg = args.find((a) => a.startsWith('--dir='));
let sourceDir = dirArg ? dirArg.split('=')[1] : null;

if (!sourceDir) {
  const today = new Date().toISOString().slice(0, 10);
  sourceDir = `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/Articles/${today}/.queue`;
}

const QUARANTINE_DIR = path.join(ROOT, 'quarantine');
fs.mkdirSync(QUARANTINE_DIR, { recursive: true });

const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function gateVoiceRules(article) {
  let banned = [];
  try {
    banned = require('../src/lib/voice.cjs').BANNED_PHRASES || [];
  } catch (_) {}
  const text = (article.body || '') + ' ' + (article.title || '');
  const hits = [];
  for (const phrase of banned) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(text)) hits.push(phrase);
  }
  // Em-dash check (Krista's rule)
  if (/—/.test(text)) hits.push('em-dash (—)');
  return hits;
}

function gateRequiredFields(article) {
  const required = [
    'title', 'slug', 'metaTitle', 'metaDescription', 'excerpt',
    'author', 'topicalPillar', 'contentTypePillar', 'funnelStage',
    'keywords', 'body', 'faq', 'featuredImage', 'ctaUrl', 'ctaLabel',
  ];
  return required.filter((f) => !article[f]);
}

function gateCitationGuard(article) {
  const tmp = `/tmp/auto-publish-${article.slug}.json`;
  fs.writeFileSync(tmp, JSON.stringify(article));
  const res = spawnSync(NODE, [path.join(ROOT, 'scripts/citation-guard.cjs'), tmp]);
  fs.unlinkSync(tmp);
  if (res.status === 0) return null;
  return res.stdout.toString().trim();
}

function gateSlugUnique(article, existing) {
  return existing.some((p) => p.slug === article.slug) ? `slug "${article.slug}" already exists in posts.json` : null;
}

function quarantine(file, article, reasons) {
  const dest = path.join(QUARANTINE_DIR, `${Date.now()}-${article.slug || path.basename(file)}.json`);
  fs.writeFileSync(dest, JSON.stringify({ article, reasons, sourceFile: file }, null, 2));
  return dest;
}

// ----- main -----

log(`auto-publish start — sourceDir=${sourceDir} dryRun=${dryRun}`);

if (!fs.existsSync(sourceDir)) {
  log(`source dir does not exist — nothing to publish (clean exit)`);
  process.exit(0);
}

const files = fs
  .readdirSync(sourceDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => path.join(sourceDir, f));

if (files.length === 0) {
  log('no candidate files — clean exit');
  process.exit(0);
}

const posts = loadJson(POSTS_PATH);
const today = new Date().toISOString();
const published = [];
const rejected = [];

for (const file of files) {
  let article;
  try {
    article = loadJson(file);
  } catch (e) {
    rejected.push({ file, slug: '?', reasons: [`parse error: ${e.message}`] });
    quarantine(file, {}, [`parse error: ${e.message}`]);
    continue;
  }

  const reasons = [];
  const missing = gateRequiredFields(article);
  if (missing.length) reasons.push(`missing fields: ${missing.join(', ')}`);

  const dupe = gateSlugUnique(article, posts);
  if (dupe) reasons.push(dupe);

  const voiceHits = gateVoiceRules(article);
  if (voiceHits.length) reasons.push(`voice violations: ${voiceHits.join(', ')}`);

  const citationFail = gateCitationGuard(article);
  if (citationFail) reasons.push(`citation guard: ${citationFail}`);

  if (reasons.length) {
    const dest = quarantine(file, article, reasons);
    log(`✗ REJECT ${article.slug || path.basename(file)} → ${dest}`);
    reasons.forEach((r) => log(`    - ${r}`));
    rejected.push({ file, slug: article.slug, reasons });
    continue;
  }

  // Convert markdown bodies to HTML — BlogPost.tsx injects body via
  // dangerouslySetInnerHTML and the writer pipeline now emits markdown.
  if (isMarkdownBody(article.body)) {
    article.body = mdToHtml(article.body);
    article.wordCount = wordCountFromHtml(article.body);
    article.readingMinutes = Math.max(1, Math.round(article.wordCount / 200));
  }

  // Paranoid post-conversion check: refuse to ship a body that still has
  // markdown syntax visible to readers. If this fires, md-to-html.cjs missed
  // a case — quarantine instead of publishing broken content.
  const leakedMarkdown = [];
  if (/(?:^|\n)#{1,3}\s/.test(article.body)) leakedMarkdown.push('heading (# / ## / ###)');
  if (/\*\*[^*]+\*\*/.test(article.body)) leakedMarkdown.push('bold (**…**)');
  if (/(?<!!)\[[^\]]+\]\([^)]+\)/.test(article.body)) leakedMarkdown.push('link ([…](…))');
  if (/!\[[^\]]*\]\([^)]+\)/.test(article.body)) leakedMarkdown.push('image (![…](…))');
  if (leakedMarkdown.length) {
    const dest = quarantine(file, article, [`unconverted markdown in body: ${leakedMarkdown.join(', ')}`]);
    log(`✗ REJECT ${article.slug} → ${dest} (md leaked past converter)`);
    rejected.push({ file, slug: article.slug, reasons: [`unconverted markdown in body: ${leakedMarkdown.join(', ')}`] });
    continue;
  }

  // Stamp dates, mark live, prepend
  article.draft = false;
  if (!article.publishedDate) article.publishedDate = today;
  article.modifiedDate = today;
  posts.unshift(article);
  published.push(article);
  log(`✓ ACCEPT ${article.slug}`);
}

if (published.length === 0) {
  log(`nothing passed gates — exiting (rejected: ${rejected.length})`);
  process.exit(rejected.length > 0 ? 2 : 0);
}

if (dryRun) {
  log(`DRY RUN — would publish ${published.length}, reject ${rejected.length}`);
  process.exit(0);
}

// Backup + write
const backup = POSTS_PATH.replace(/\.json$/, `.${Date.now()}.bak.json`);
fs.copyFileSync(POSTS_PATH, backup);
fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
log(`wrote posts.json (backup: ${backup})`);

// Build
log('running build...');
try {
  execSync('npm run build:fast', { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  log('BUILD FAILED — reverting posts.json');
  fs.copyFileSync(backup, POSTS_PATH);
  process.exit(3);
}

// Move source files out so we don't republish on next run
const archiveDir = path.join(path.dirname(sourceDir), '.published');
fs.mkdirSync(archiveDir, { recursive: true });
for (const file of files) {
  if (rejected.some((r) => r.file === file)) continue;
  fs.renameSync(file, path.join(archiveDir, path.basename(file)));
}

// Commit + push
try {
  execSync('git add data/blog/posts.json public/sitemap.xml public/llms.txt public/llms-full.txt', { cwd: ROOT, stdio: 'inherit' });
  const msg = `Auto-publish: ${published.length} article(s) — ${published.map((a) => a.slug).join(', ')}`;
  execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: ROOT, stdio: 'inherit' });
  execSync('git push', { cwd: ROOT, stdio: 'inherit' });
  log(`pushed — Vercel will deploy in ~60s`);
} catch (e) {
  log(`git operation failed: ${e.message}`);
  process.exit(4);
}

// Email summary to Krista
const summaryBody = [
  `Good morning Krista,`,
  ``,
  `Auto-publisher ran. ${published.length} article(s) went live this morning:`,
  ``,
  ...published.map((a, i) => `  ${i + 1}. https://blog.kristamashore.com/articles/${a.slug}\n     "${a.title}"`),
  ``,
];
if (rejected.length) {
  summaryBody.push(`${rejected.length} article(s) REJECTED by quality gates (in /quarantine/):`);
  rejected.forEach((r) => {
    summaryBody.push(`  - ${r.slug || '?'}`);
    r.reasons.forEach((reason) => summaryBody.push(`      • ${reason}`));
  });
  summaryBody.push('');
}
summaryBody.push(`Check the live site, then tell Claude what to change. To edit, open the article in Obsidian (Krista-OS / 12-Content-Library / Drafts-Review) — your edits auto-sync back to the site.`);

const bodyFile = `/tmp/auto-publish-summary-${Date.now()}.txt`;
fs.writeFileSync(bodyFile, summaryBody.join('\n'));
const subject = `${published.length} article(s) auto-published${rejected.length ? ` (${rejected.length} rejected)` : ''}`;
spawnSync('/usr/bin/osascript', ['-e', `
tell application "Mail"
  set bodyText to (do shell script "cat " & quoted form of "${bodyFile}")
  set newMessage to make new outgoing message with properties {subject:"${subject}", content:bodyText, visible:false}
  tell newMessage to make new to recipient with properties {address:"doit@kristamashore.com"}
  send newMessage
end tell
`]);

log(`emailed summary to doit@kristamashore.com`);
log(`auto-publish DONE — ${published.length} live, ${rejected.length} quarantined`);
