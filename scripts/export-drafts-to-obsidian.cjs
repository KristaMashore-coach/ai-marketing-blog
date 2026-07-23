// Export draft posts from data/blog/posts.json to a markdown folder for Obsidian review.
// Usage: node scripts/export-drafts-to-obsidian.cjs
const fs = require('fs');
const path = require('path');

const POSTS = require('../data/blog/posts.json');
const OUT_DIR = "/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Drafts-Review";

function htmlToMarkdown(html) {
  if (!html) return '';
  let md = html;
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<\/p>\s*<p>/gi, '\n\n');
  md = md.replace(/<p>/gi, '');
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<\/?ol>/gi, '\n');
  md = md.replace(/<\/?ul>/gi, '\n');
  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

function buildFrontmatter(p) {
  const lines = [
    '---',
    `title: "${p.title.replace(/"/g, '\\"')}"`,
    `slug: ${p.slug}`,
    `status: ${p.draft ? 'DRAFT' : 'LIVE'}`,
    `pillar: ${p.topicalPillar || 'n/a'}`,
    `content_type: ${p.contentTypePillar || 'n/a'}`,
    `funnel_stage: ${p.funnelStage || 'n/a'}`,
    `word_count: ${p.wordCount || 'n/a'}`,
    `reading_minutes: ${p.readingMinutes || 'n/a'}`,
    `published_date: ${p.publishedDate || 'n/a'}`,
    `meta_title: "${(p.metaTitle || '').replace(/"/g, '\\"')}" (${(p.metaTitle || '').length} chars)`,
    `meta_description: "${(p.metaDescription || '').replace(/"/g, '\\"')}" (${(p.metaDescription || '').length} chars)`,
    `cta: "${p.ctaLabel || ''} → ${p.ctaUrl || ''}"`,
    `internal_link_count: ${(p.internalLinks || []).length}`,
    `faq_count: ${(p.faq || []).length}`,
    'tags:',
    '  - draft-review',
    `  - ${p.topicalPillar || 'unset'}`,
    '---',
    ''
  ];
  return lines.join('\n');
}

function buildBody(p) {
  const sections = [];
  sections.push(buildFrontmatter(p));
  sections.push(`# ${p.title}\n`);
  sections.push(`> **Excerpt:** ${p.excerpt || ''}\n`);

  sections.push(`## Review Checklist\n`);
  sections.push('- [ ] Title + meta lengths good');
  sections.push('- [ ] Voice sounds like Krista (no banned phrases, no em-dashes)');
  sections.push('- [ ] Mantra threading present (Known/Win/Top producer = top marketer)');
  sections.push('- [ ] Internal links cover hub + 2 siblings + cross-pillar + pillar page (5+ minimum)');
  sections.push('- [ ] CTA routing matches pillar');
  sections.push('- [ ] FAQ answers are accurate and useful');
  sections.push('- [ ] Approve as-is | Edit notes below | Reject\n');

  sections.push(`## Keywords\n`);
  sections.push((p.keywords || []).map(k => `- ${k}`).join('\n') + '\n');

  sections.push(`## Internal Links (${(p.internalLinks || []).length})\n`);
  if ((p.internalLinks || []).length === 0) {
    sections.push('_No internal links._\n');
  } else {
    sections.push(p.internalLinks.map(l => `- ${l}`).join('\n') + '\n');
  }

  sections.push(`## Body\n`);
  sections.push(htmlToMarkdown(p.body) + '\n');

  if ((p.faq || []).length > 0) {
    sections.push(`## FAQ\n`);
    p.faq.forEach((f, i) => {
      sections.push(`### Q${i + 1}. ${f.question}`);
      sections.push(f.answer + '\n');
    });
  }

  sections.push(`## Editorial Notes\n`);
  sections.push('_Add notes here. Anything in this section will not affect the JSON until you ask Codex to apply it._\n');

  return sections.join('\n');
}

// As of 2026-05-19 Krista wants ALL articles (drafts + live) editable in
// Obsidian, since auto-publish skips the draft phase. Pass --drafts-only to
// limit to drafts.
const draftsOnly = process.argv.includes('--drafts-only');
const drafts = draftsOnly ? POSTS.filter(p => p.draft) : POSTS;
console.log(`Found ${drafts.length} article(s) (${draftsOnly ? 'drafts only' : 'drafts + live'}).`);

drafts.forEach((p, i) => {
  const filename = `${String(i + 1).padStart(2, '0')}-${p.slug}.md`;
  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, buildBody(p));
  console.log(`✓ wrote ${filename}`);
});

// Index file
const indexLines = [
  '# Seed Draft Review — 5 Articles',
  '',
  'These are the 5 seed articles waiting for Krista\'s sign-off. They live in `data/blog/posts.json` flagged `draft: true`.',
  '',
  '## Drafts in this folder',
  '',
];
drafts.forEach((p, i) => {
  const filename = `${String(i + 1).padStart(2, '0')}-${p.slug}.md`;
  indexLines.push(`${i + 1}. [[${filename.replace('.md', '')}|${p.title}]]`);
  indexLines.push(`   - Pillar: ${p.topicalPillar || 'unset'} · ${p.wordCount || '?'} words · ${(p.internalLinks || []).length} links · ${(p.faq || []).length} FAQ`);
});
indexLines.push('');
indexLines.push('## How to use');
indexLines.push('');
indexLines.push('1. Open each draft, read top to bottom.');
indexLines.push('2. Use the Review Checklist at the top.');
indexLines.push('3. Add notes in the **Editorial Notes** section at the bottom.');
indexLines.push('4. Tell Codex what to do: approve all, approve specific ones, or apply your edits.');
indexLines.push('');
indexLines.push('## Approval commands (run from project root)');
indexLines.push('');
indexLines.push('```bash');
indexLines.push('# Approve a single article');
indexLines.push('node scripts/approve-drafts.cjs <slug>');
indexLines.push('');
indexLines.push('# Approve all drafts');
indexLines.push('npm run approve:drafts');
indexLines.push('```');

fs.writeFileSync(path.join(OUT_DIR, '00-INDEX.md'), indexLines.join('\n'));
console.log('✓ wrote 00-INDEX.md');
console.log(`\nDone. Files in: ${OUT_DIR}`);
