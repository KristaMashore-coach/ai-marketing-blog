#!/usr/bin/env node
// Read edited markdown files from the Obsidian vault and merge changes back
// into data/blog/posts.json. Round-trip partner to export-drafts-to-obsidian.cjs.
//
// Usage:
//   node scripts/import-drafts-from-obsidian.cjs                    # import all
//   node scripts/import-drafts-from-obsidian.cjs <slug>             # import one
//   node scripts/import-drafts-from-obsidian.cjs --dry-run [<slug>] # preview, no write
//
// What it reads from each markdown file:
//   - Frontmatter: title, meta_title, meta_description, slug
//   - ## Body section: converted markdown → HTML, replaces post.body
//   - ## FAQ section: ### Q1. ... Q&A blocks, replaces post.faq
//   - Keywords + internal links are NOT pulled back (edit those in JSON if needed)
//   - Anything in "## Editorial Notes" is ignored — that's your scratchpad
//
// Safety: writes a timestamped backup of posts.json before any change.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_PATH = path.join(ROOT, 'data/blog/posts.json');
const DRAFTS_DIR =
  "/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Drafts-Review";

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slugFilter = args.find((a) => !a.startsWith('--'));

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { fm: {}, rest: text };
  const fm = {};
  m[1].split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // strip wrapping quotes and any " (NN chars)" annotation we wrote on export
    val = val.replace(/\s*\(\d+\s*chars\)\s*$/, '');
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).replace(/\\"/g, '"');
    }
    fm[key] = val;
  });
  return { fm, rest: text.slice(m[0].length) };
}

// Top-level section names the exporter writes. Used as section terminators so
// inner ## H2 headings inside the Body don't prematurely end the match.
const TOP_LEVEL_SECTIONS = [
  'Review Checklist',
  'Keywords',
  'Internal Links',
  'Body',
  'FAQ',
  'Editorial Notes',
];

function extractSection(text, heading) {
  const others = TOP_LEVEL_SECTIONS.filter((s) => s !== heading)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  // No \Z fallback (JS regex doesn't honor it — treats it as literal Z). All
  // sections we extract have a known sibling section after them in the export,
  // so the terminator lookahead is always satisfied.
  const re = new RegExp(
    `^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s+(?:${others})\\b)`,
    'm'
  );
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function mdToHtml(md) {
  if (!md) return '';
  let html = md.trim();
  // Inline first
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  // Block level: split on blank lines, then identify lists/headings/paras
  const blocks = html.split(/\n\s*\n/);
  const out = blocks.map((block) => {
    const b = block.trim();
    if (!b) return '';
    if (b.startsWith('### ')) return `<h3>${b.replace(/^###\s+/, '')}</h3>`;
    if (b.startsWith('## ')) return `<h2>${b.replace(/^##\s+/, '')}</h2>`;
    // unordered list
    if (/^[-*]\s+/.test(b)) {
      const items = b
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => l.replace(/^[-*]\s+/, ''))
        .map((l) => `<li>${l}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    }
    // ordered list
    if (/^\d+\.\s+/.test(b)) {
      const items = b
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => l.replace(/^\d+\.\s+/, ''))
        .map((l) => `<li>${l}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    }
    // paragraph: collapse single newlines into spaces
    return `<p>${b.replace(/\n+/g, ' ')}</p>`;
  });
  return out.filter(Boolean).join('\n');
}

function parseFaq(faqSection) {
  if (!faqSection) return null;
  const out = [];
  const blocks = faqSection.split(/^###\s+Q\d+\.\s+/m).slice(1);
  for (const block of blocks) {
    const lines = block.split('\n');
    const question = lines[0].trim();
    const answer = lines.slice(1).join('\n').trim();
    if (question && answer) out.push({ question, answer });
  }
  return out.length ? out : null;
}

function diff(before, after, field) {
  if (before === after) return null;
  const b = typeof before === 'string' ? before : JSON.stringify(before);
  const a = typeof after === 'string' ? after : JSON.stringify(after);
  return `  ${field}:\n    - was: ${b.slice(0, 100)}${b.length > 100 ? '…' : ''}\n    + now: ${a.slice(0, 100)}${a.length > 100 ? '…' : ''}`;
}

// ---- main ----

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
const files = fs
  .readdirSync(DRAFTS_DIR)
  .filter((f) => /^\d+-.+\.md$/.test(f) && f !== '00-INDEX.md');

let changed = 0;
const changeReports = [];

for (const file of files) {
  const md = fs.readFileSync(path.join(DRAFTS_DIR, file), 'utf8');
  const { fm } = parseFrontmatter(md);
  const slug = fm.slug || file.replace(/^\d+-/, '').replace(/\.md$/, '');
  if (slugFilter && slug !== slugFilter) continue;

  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    console.log(`! ${slug}: no matching post in posts.json — skipping`);
    continue;
  }

  const newBody = mdToHtml(extractSection(md, 'Body'));
  const newFaq = parseFaq(extractSection(md, 'FAQ'));
  const newTitle = fm.title;
  const newMetaTitle = fm.meta_title;
  const newMetaDescription = fm.meta_description;

  const report = [];
  const d1 = diff(post.title, newTitle, 'title');
  if (d1 && newTitle) { report.push(d1); post.title = newTitle; }
  const d2 = diff(post.metaTitle, newMetaTitle, 'metaTitle');
  if (d2 && newMetaTitle) { report.push(d2); post.metaTitle = newMetaTitle; }
  const d3 = diff(post.metaDescription, newMetaDescription, 'metaDescription');
  if (d3 && newMetaDescription) { report.push(d3); post.metaDescription = newMetaDescription; }
  if (newBody && newBody !== post.body) {
    report.push(`  body: ${post.body.length} → ${newBody.length} chars`);
    post.body = newBody;
    post.wordCount = newBody.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    post.readingMinutes = Math.max(1, Math.round(post.wordCount / 200));
  }
  if (newFaq && JSON.stringify(newFaq) !== JSON.stringify(post.faq)) {
    report.push(`  faq: ${(post.faq || []).length} → ${newFaq.length} Q&As`);
    post.faq = newFaq;
  }
  if (report.length) {
    post.modifiedDate = new Date().toISOString();
    changed++;
    changeReports.push(`\n● ${slug}\n${report.join('\n')}`);
  } else {
    console.log(`= ${slug}: no changes`);
  }
}

if (changeReports.length) {
  console.log('\n=== CHANGES DETECTED ===');
  console.log(changeReports.join('\n'));
}

if (changed === 0) {
  console.log('\nNothing to write.');
  process.exit(0);
}

if (dryRun) {
  console.log(`\n(dry run — ${changed} post(s) would be updated, no write performed)`);
  process.exit(0);
}

// Backup before write
const backup = POSTS_PATH.replace(/\.json$/, `.${Date.now()}.bak.json`);
fs.copyFileSync(POSTS_PATH, backup);
fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2) + '\n');
console.log(`\n✓ wrote ${changed} post(s) to posts.json`);
console.log(`  backup: ${backup}`);
