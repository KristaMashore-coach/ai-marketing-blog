#!/usr/bin/env node
// Prerenders the homepage + other static routes (articles index, pillar
// pages, about) with REAL visible body content in <div id="root"> plus a
// single full OG/Twitter tag set. Runs after prerender-blog.cjs (which only
// injects <head> schema for these routes and leaves the body empty) so this
// script re-opens the already-written dist/<route>/index.html files, strips
// any duplicate og:/twitter: tags, and injects real markup.
//
// Ported from ~/Sites/krista-mashore-content-site/scripts/prerender-static.cjs
// (the reference implementation named in the AEO/GEO Build Standard) and
// adapted to kristamashore.ai's actual structure: 5 pillars (not 3), the
// AI-for-business copy from Home.tsx/About.tsx/PillarPage.tsx (not real
// estate marketing copy), and the kristamashore.ai domain + CTA.
//
// Build Standard Requirement #1: every route in the sitemap ships crawlable
// HTML, not just articles. Requirement #2: exactly one og:/twitter: set per
// page, escaped, og:image raster only. Requirement #3: no schema image ends
// in .svg.
//
// All copy below is sourced ONLY from data already in this repo (src/pages
// and src/lib/constants.ts values reproduced here, and data/blog/posts.json
// for the recent-articles list) — nothing invented.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SITE_URL = "https://kristamashore.ai";
const OG_IMAGE = `${SITE_URL}/og-default.png`;
const CTA_URL = "https://kristamashore.com/LevelUp";
const CTA_LABEL = "Learn the AI System";

const POSTS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/blog/posts.json"), "utf8")
).filter((p) => !p.draft);

if (!fs.existsSync(DIST)) {
  console.error("[prerender-static] dist/ does not exist. Run vite build first.");
  process.exit(1);
}

// Mirrors src/lib/constants.ts PILLARS — kept in sync manually since this is
// a plain Node script (no TS import). Do not invent new copy here; only
// reproduce what already exists in constants.ts / the page components.
const PILLARS = {
  "authority-agent-operating-system": {
    label: "The Authority Agent Operating System™",
    slug: "authority-agent-operating-system",
    role: "anchor",
    description:
      "How to build the AI operating system that makes you the obvious choice in your space. The trademarked framework that ties it all together.",
  },
  "ai-content-to-client-system": {
    label: "AI Content to Client System",
    slug: "ai-content-to-client-system",
    role: "supporting",
    description:
      "Using AI to turn content into clients. Marketing, lead gen, nurture, conversion. All connected.",
  },
  "ai-run-business": {
    label: "The AI-Run Business",
    slug: "ai-run-business",
    role: "supporting",
    description:
      "Workflows, agents, fulfillment, delivery, retention, resell. The AI side of running the actual operation.",
  },
  "community-market-leaders-ai": {
    label: "Community Market Leaders®: AI for Real Estate & Lenders",
    slug: "community-market-leaders-ai",
    role: "supporting",
    description:
      "Deep dive: A-Z listing process with AI. Pricing, virtual staging, tours, listing copy, lead follow-up, lender workflows.",
  },
  "claude-for-dummies": {
    label: "Claude for Dummies: The AI Tools That Actually Matter",
    slug: "claude-for-dummies",
    role: "supporting",
    description:
      "Practical Claude-only training. Skip the ChatGPT confusion. Skills, projects, Claude Code, Claude Desktop. What works and how to use it.",
  },
};

function getAllPosts() {
  return POSTS.slice().sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1));
}

function getPostsByPillar(slug) {
  return getAllPosts().filter((p) => p.topicalPillar === slug);
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function dateStr(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Builds one full OG + Twitter tag set (6 og: + 4 twitter:), always exactly
// one per page. og:image is always the raster fallback per Req #2.
function buildOgTags({ url, title, description, type = "website" }) {
  const t = escapeAttr(title);
  const d = escapeAttr(description);
  return [
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:site_name" content="Krista Mashore Coaching" />`,
    `<meta property="og:image" content="${escapeAttr(OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${escapeAttr(OG_IMAGE)}" />`,
  ].join("\n    ");
}

// Strips any existing og:/twitter: meta tags from the head (prerender-blog.cjs
// never added these for static routes, but this guards against double-adds if
// this script ever runs twice, and strips the raw index.html template if a
// route is regenerated from source instead of from prerender-blog's output).
function stripOgTwitterTags(html) {
  return html.replace(
    /\s*<meta\s+(?:property|name)="(?:og|twitter):[a-z:]+"[^>]*\/?>\n?/gi,
    ""
  );
}

function stripHeadTags(html, { title, description } = {}) {
  let out = html;
  if (title) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeText(title)}</title>`);
  }
  if (description) {
    out = out.replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeAttr(description)}" />`
    );
  }
  return out;
}

function injectOgTags(html, ogTagsBlock) {
  return html.replace("</head>", `    ${ogTagsBlock}\n  </head>`);
}

function injectBody(html, bodyHtml) {
  return html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${bodyHtml}</div>`);
}

function readRoute(routePath) {
  const dir = routePath === "/" ? DIST : path.join(DIST, routePath.replace(/^\//, ""));
  const file = path.join(dir, "index.html");
  if (!fs.existsSync(file)) {
    console.error(`[prerender-static] expected prerendered shell missing: ${file}`);
    process.exit(1);
  }
  return { file, html: fs.readFileSync(file, "utf8") };
}

function writeRoute(file, html) {
  fs.writeFileSync(file, html);
}

// ---------------------------------------------------------------------------
// Recent-articles list (homepage), sourced only from posts.json.
// ---------------------------------------------------------------------------
function buildRecentArticlesHtml(posts) {
  return `<section class="home-recent-articles">
<h2>Recent articles</h2>
<ul>${posts
    .map(
      (p) =>
        `<li><a href="/articles/${p.slug}">${escapeText(p.title)}</a> — ${escapeText(
          p.excerpt
        )} <time datetime="${escapeAttr(p.publishedDate)}">${escapeText(
          dateStr(p.publishedDate)
        )}</time></li>`
    )
    .join("")}</ul>
</section>`;
}

function buildPillarsHtml() {
  return `<section class="home-pillars">
<h2>What we cover</h2>
<ul>${Object.values(PILLARS)
    .map(
      (p) =>
        `<li><a href="/${p.slug}"><strong>${escapeText(p.label)}</strong></a>: ${escapeText(
          p.description
        )}</li>`
    )
    .join("")}</ul>
</section>`;
}

// ---------------------------------------------------------------------------
// Route builders — copy reproduced verbatim from src/pages/Home.tsx,
// src/pages/About.tsx, src/pages/PillarPage.tsx, src/pages/BlogIndex.tsx.
// ---------------------------------------------------------------------------

function buildHomeBody() {
  const recent = getAllPosts().slice(0, 6);
  return `<main>
<article>
<p class="eyebrow">For entrepreneurs, agents, and lenders</p>
<h1>Use AI to run your business. Build autonomous agents. Scale without hiring.</h1>
<p class="lede">The AI workflows, tools, and systems that take the work off your plate. Real automations from Krista Mashore. Top 1% agent for 19 years, built a $72M coaching company in 7.5 years, now teaching business owners how to make AI do the heavy lifting.</p>
<p><a href="${CTA_URL}">${escapeText(CTA_LABEL)}</a> &middot; <a href="/articles">Read the articles</a></p>
${buildPillarsHtml()}
${buildRecentArticlesHtml(recent)}
<section class="home-cta">
<h2>Want to build AI systems like this?</h2>
<p>The Level Up training shows you how Krista uses AI to run her business with fewer people, more output, and real systems you can copy. For entrepreneurs, agents, and lenders who are done doing everything manually.</p>
<p><a href="${CTA_URL}">${escapeText(CTA_LABEL)}</a></p>
</section>
</article>
</main>`;
}

function buildArticlesIndexBody() {
  const all = getAllPosts();
  return `<main>
<article>
<nav aria-label="Breadcrumb"><a href="/">Home</a> / Articles</nav>
<h1>All articles</h1>
<p class="lede">${all.length} ${all.length === 1 ? "article" : "articles"} across five pillars.</p>
<ul class="articles-list">${all
    .map(
      (p) =>
        `<li><a href="/articles/${p.slug}">${escapeText(p.title)}</a> — ${escapeText(
          p.excerpt
        )}</li>`
    )
    .join("")}</ul>
</article>
</main>`;
}

function buildPillarBody(meta) {
  const posts = getPostsByPillar(meta.slug);
  const empty = `<p>No articles published yet in this pillar. New articles publish daily.</p>`;
  const list = posts.length
    ? `<ul class="articles-list">${posts
        .map(
          (p) =>
            `<li><a href="/articles/${p.slug}">${escapeText(p.title)}</a> — ${escapeText(
              p.excerpt
            )}</li>`
        )
        .join("")}</ul>`
    : empty;
  return `<main>
<article>
<nav aria-label="Breadcrumb"><a href="/">Home</a> / ${escapeText(meta.label)}</nav>
<p class="eyebrow">${meta.role === "anchor" ? "Anchor pillar" : "Supporting pillar"}</p>
<h1>${escapeText(meta.label)}</h1>
<p class="lede">${escapeText(meta.description)}</p>
<h2>${posts.length} ${posts.length === 1 ? "article" : "articles"}</h2>
${list}
<section class="pillar-cta">
<p><a href="${CTA_URL}">${escapeText(CTA_LABEL)}</a></p>
</section>
</article>
</main>`;
}

function buildAboutBody() {
  return `<main>
<article>
<nav aria-label="Breadcrumb"><a href="/">Home</a> / About</nav>
<h1>About Krista Mashore</h1>
<p class="lede">Top 1% real estate agent for 19 consecutive years. Top 1% coach. Now using AI to run an entire business so other people can do the same.</p>
<p>Krista Mashore personally sold over 2,300 homes. She averaged 133 a year. Then she built a coaching company from zero to $72M in online sales in 7.5 years. Eleven Two Comma Club Awards from ClickFunnels. Two $10M+ funnel awards. Two $25M+ funnel awards.</p>
<p>But this site isn't about real estate. This site is about what came next. AI changed everything for her business. The content her team used to take a week to produce now ships in an afternoon. Workflows that needed three people now run on their own. She's been on a tear figuring out which AI tools actually move the needle and which ones are noise.</p>
<p>She's been featured in Forbes, the Wall Street Journal, Yahoo Finance, Inc. 5000, Inman News, NBC, and FOX. She's shared stages with Tony Robbins, Dean Graziosi, and Russell Brunson. She's a 7x best-selling author with a Master's in Curriculum &amp; Instruction.</p>
<h2>Who this is for</h2>
<p>Three groups. Same problem. Too much manual work, too little time, too few people to hire.</p>
<ul>
<li><strong>Entrepreneurs</strong> who want to scale without adding payroll.</li>
<li><strong>Real estate agents</strong> who want AI to handle the busywork so they can stay in front of clients.</li>
<li><strong>Lenders and loan officers</strong> who want to work more deals without burning out.</li>
</ul>
<h2>What you'll find here</h2>
<p>Five pillars. All anchored to frameworks Krista built and uses every day.</p>
<ul>
<li><strong>The Authority Agent Operating System™</strong> — the AI OS that makes you the obvious choice in your space.</li>
<li><strong>AI Content to Client System</strong> — turning content into clients across marketing, lead gen, nurture, and conversion.</li>
<li><strong>The AI-Run Business</strong> — workflows, agents, fulfillment, delivery, retention, and resell on autopilot.</li>
<li><strong>Community Market Leaders®: AI for Real Estate &amp; Lenders</strong> — A-Z AI for the listing process and lender workflows.</li>
<li><strong>Claude for Dummies</strong> — practical Claude-only training. Skills, projects, Claude Code, Claude Desktop. No ChatGPT confusion.</li>
</ul>
<h2>The mission</h2>
<p>Help business owners stop trading hours for dollars. Show them how AI hands them their time back. And teach them how to position themselves as the AI authority their market trusts.</p>
<section class="about-cta">
<h2>Want to learn the AI system?</h2>
<p>The Level Up training shows you how to use AI to run your business with fewer people, more output, and real systems you can copy.</p>
<p><a href="${CTA_URL}">${escapeText(CTA_LABEL)}</a></p>
</section>
</article>
</main>`;
}

// ---------------------------------------------------------------------------
// Apply each route: strip any existing og/twitter tags, inject title/desc,
// inject ONE og/twitter set, inject real body.
// ---------------------------------------------------------------------------

function applyRoute(routePath, { title, description, ogType, body }) {
  const { file, html } = readRoute(routePath);
  let out = stripOgTwitterTags(html);
  out = stripHeadTags(out, { title, description });
  const url = routePath === "/" ? SITE_URL : `${SITE_URL}${routePath}`;
  const ogBlock = buildOgTags({ url, title, description, type: ogType });
  out = injectOgTags(out, ogBlock);
  out = injectBody(out, body);
  writeRoute(file, out);
}

let routes = 0;

// Homepage
applyRoute("/", {
  title: "AI for Business — Krista Mashore | AI Workflows for Entrepreneurs, Agents, and Lenders",
  description:
    "Learn how to use AI to automate your business, build autonomous agents, and become the AI authority in your market. For entrepreneurs, real estate agents, and lenders who want to scale without hiring.",
  ogType: "website",
  body: buildHomeBody(),
});
routes++;

// Articles index
applyRoute("/articles", {
  title: "All Articles | Krista Mashore — AI for Business",
  description:
    "AI workflows, tools, and authority positioning for entrepreneurs, real estate agents, and lenders.",
  ogType: "website",
  body: buildArticlesIndexBody(),
});
routes++;

// About
applyRoute("/about", {
  title: "About Krista Mashore | AI Authority for Entrepreneurs, Agents, and Lenders",
  description:
    "Top 1% real estate agent for 19 years. $72M coaching company in 7.5 years. Now teaching entrepreneurs, agents, and lenders how to use AI to scale without hiring.",
  ogType: "profile",
  body: buildAboutBody(),
});
routes++;

// Pillar pages
for (const meta of Object.values(PILLARS)) {
  applyRoute(`/${meta.slug}`, {
    title: `${meta.label} Articles | Krista Mashore`,
    description: meta.description,
    ogType: "website",
    body: buildPillarBody(meta),
  });
  routes++;
}

console.log(`[prerender-static] injected real body + single OG/Twitter set into ${routes} static routes`);
