#!/usr/bin/env node
// Generates better-looking inline SVG hero images for each article and writes
// them into public/articles/hero/<slug>.svg. Then updates posts.json so each
// article's featuredImage.src points at the static SVG.
//
// Why SVG: we control font size, weight, wrap, layout, brand mark. Renders
// crisp at any size. No external image service. Vercel CDN-cached.
//
// Why not PNG/OG-image: PNG generation needs Sharp or @vercel/og + a build
// step. SVG is zero-dep and works fine for in-page hero images. (For social
// share previews specifically, a PNG-based OG image is the right move — that's
// a separate enhancement.)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_PATH = path.join(ROOT, 'data/blog/posts.json');
const OUT_DIR = path.join(ROOT, 'public/articles/hero');

// ONYX EDITORIAL hero palette (2026-08-16, Krista-directed). Replaces five
// different orange hues that used color to DISTINGUISH pillars. Onyx Editorial
// uses color to establish ONE institutional look, so grounds alternate between
// only two (Onyx / Deep Emerald) and the pillar is carried by the label, not
// the hue. Canonical palette:
// Krista-OS/12-Content-Library/Brand-System/11-Onyx-Editorial-Visual-Identity-System.md
//
// Accents are dark-ground only by design: Paraiba #2FCFC0 reads 7.43:1 on Onyx
// but only 1.74:1 on the light Moonstone ground, which the brand doc lists as a
// prohibited pair. These SVGs are always dark-ground, so it is correct here.
const PALETTE = {
  'authority-agent-operating-system': { bg: '#0A2E35', accent: '#2FCFC0', label: 'Authority Agent OS' },
  'ai-content-to-client-system': { bg: '#164F50', accent: '#2FCFC0', label: 'Content to Client' },
  'ai-run-business': { bg: '#0A2E35', accent: '#D9E6EA', label: 'AI-Run Business' },
  'community-market-leaders-ai': { bg: '#164F50', accent: '#2FCFC0', label: 'CML AI' },
  'claude-for-dummies': { bg: '#0A2E35', accent: '#2FCFC0', label: 'Claude for Dummies' },
  default: { bg: '#0A2E35', accent: '#2FCFC0', label: 'Krista Mashore' },
};

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Wrap title into lines of ~22 chars each, max 3 lines
function wrapTitle(title, maxCharsPerLine = 22, maxLines = 3) {
  const words = title.split(/\s+/);
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
    if (lines.length === maxLines - 1 && (current + ' ' + words[words.indexOf(w) + 1] || '').length > maxCharsPerLine) {
      lines.push(current);
      current = '';
      break;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function buildSvg(post) {
  const pal = PALETTE[post.topicalPillar] || PALETTE.default;
  const lines = wrapTitle(post.title);
  const fontSize = lines.length === 1 ? 96 : lines.length === 2 ? 84 : 72;
  const lineHeight = fontSize * 1.15;
  const totalH = lineHeight * lines.length;
  const startY = 675 / 2 - totalH / 2 + fontSize * 0.75;

  const tspans = lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      return `<tspan x="600" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${escapeXml(post.title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.bg}"/>
      <stop offset="100%" stop-color="${pal.bg}" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect x="0" y="0" width="12" height="675" fill="${pal.accent}"/>
  <text x="60" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="${pal.accent}" letter-spacing="3">${escapeXml(pal.label.toUpperCase())}</text>
  <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="800" fill="#F5F2EB" text-anchor="middle">${tspans}</text>
  <text x="1140" y="645" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#F5F2EB" text-anchor="end" opacity="0.85">KRISTA MASHORE</text>
</svg>
`;
}

// ----- main -----

fs.mkdirSync(OUT_DIR, { recursive: true });

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
let updated = 0;

for (const post of posts) {
  const svg = buildSvg(post);
  const outPath = path.join(OUT_DIR, `${post.slug}.svg`);
  fs.writeFileSync(outPath, svg);

  const newSrc = `/articles/hero/${post.slug}.svg`;
  if (post.featuredImage.src !== newSrc) {
    post.featuredImage = {
      src: newSrc,
      alt: post.featuredImage.alt || post.title,
    };
    updated++;
  }
}

if (updated > 0) {
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
  console.log(`✓ Generated ${posts.length} hero SVGs and updated ${updated} featuredImage.src in posts.json`);
} else {
  console.log(`✓ Generated ${posts.length} hero SVGs (featuredImage.src unchanged)`);
}
