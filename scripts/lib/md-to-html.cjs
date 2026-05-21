// Shared markdown → HTML converter for the blog pipeline.
// The page already renders the post title (as <h1>) and the featured image
// above the body, so if the body's first block is a duplicate image+title pair
// we strip it. Otherwise convert standard markdown to the small subset of HTML
// the article-body container expects: <p>, <h2>, <h3>, <strong>, <em>, <a>,
// <ul>/<ol>/<li>, <img>, <hr>, <blockquote>.

function isMarkdownBody(body) {
  if (!body || typeof body !== 'string') return false;
  if (/<p[\s>]/.test(body) || /<h2[\s>]/.test(body)) return false;
  const trimmed = body.trim();
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('!') ||
    /\n##? /.test(trimmed) ||
    /\n\*\*/.test(trimmed)
  );
}

function stripDuplicateHero(md) {
  let s = md.replace(/^\s+/, '');
  // Strip a leading ![alt](url) image
  s = s.replace(/^!\[[^\]]*\]\([^)]+\)\s*\n+/, '');
  // Strip a leading # Title line
  s = s.replace(/^#\s+[^\n]+\n+/, '');
  return s;
}

// The page renders its own CTA, FAQ accordion, and related-posts grid below
// the body. Writers have started repeating those sections inside the markdown
// body, which would render as visible duplicates. Truncate the body at the
// first such trailing marker.
function stripTrailingEditorial(md) {
  const markers = [
    /\n---\s*\n+(?:\*\*)?Ready to /,
    /\n##\s+FAQ\b/i,
    /\n##\s+Frequently Asked Questions\b/i,
    /\n##\s+Internal links\b/i,
    /\n##\s+Related (?:articles|posts|reading)\b/i,
  ];
  let cut = md.length;
  for (const re of markers) {
    const m = md.match(re);
    if (m && m.index < cut) cut = m.index;
  }
  return md.slice(0, cut).replace(/\s+$/, '');
}

function renderInline(text) {
  // Inline image first so its surrounding ! is consumed before link regex sees it
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) =>
    `<img src="${url}" alt="${alt}" />`
  );
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  return text;
}

function mdToHtml(md, { stripHero = true, stripEditorial = true } = {}) {
  if (!md) return '';
  let src = md;
  if (stripHero) src = stripDuplicateHero(src);
  if (stripEditorial) src = stripTrailingEditorial(src);
  src = renderInline(src.trim());

  const blocks = src.split(/\n\s*\n/);
  const out = blocks.map((rawBlock) => {
    const block = rawBlock.trim();
    if (!block) return '';
    if (/^---+$/.test(block)) return '<hr />';
    if (block.startsWith('### ')) return `<h3>${block.replace(/^###\s+/, '')}</h3>`;
    if (block.startsWith('## ')) return `<h2>${block.replace(/^##\s+/, '')}</h2>`;
    // Demote stray H1s — the page already has one for the title.
    if (block.startsWith('# ')) return `<h2>${block.replace(/^#\s+/, '')}</h2>`;
    if (/^>\s+/.test(block)) {
      const inner = block
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ');
      return `<blockquote><p>${inner}</p></blockquote>`;
    }
    if (/^[-*]\s+/.test(block)) {
      const items = block
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => l.replace(/^[-*]\s+/, ''))
        .map((l) => `<li>${l}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    }
    if (/^\d+\.\s+/.test(block)) {
      const items = block
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => l.replace(/^\d+\.\s+/, ''))
        .map((l) => `<li>${l}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    }
    return `<p>${block.replace(/\n+/g, ' ')}</p>`;
  });
  return out.filter(Boolean).join('\n');
}

function wordCountFromHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

module.exports = { mdToHtml, isMarkdownBody, stripDuplicateHero, stripTrailingEditorial, wordCountFromHtml };
