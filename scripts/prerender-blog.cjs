#!/usr/bin/env node
// Walks every route after a Vite build and writes a static HTML file with the
// rendered output (including real body content + JSON-LD baked in) so AI
// crawlers see actual text, not an empty `<div id="root"></div>` shell.
// Uses the dev-time SSR-style approach: render the article markup to HTML,
// then merge into dist/index.html template. No headless browser required.
//
// 2026-07-19 fix: this script previously injected <head> schema ONLY for
// every route (articles included) and never touched <div id="root">, so
// every published article — not just the homepage — shipped an empty shell
// to GPTBot/ClaudeBot/PerplexityBot (verified live: 7,612 bytes, 0 <p>, 0
// <h1>). Ported the real body-injection + OG-tag logic from the reference
// implementation (~/Sites/krista-mashore-content-site/scripts/prerender-blog.cjs,
// per the AEO/GEO Build Standard) and adapted it to this site's data shape
// (no copyrightHolder/license fields on posts here) and its 5 real pillars.
//
// Static routes (/, /articles, /about, the 5 pillar pages) get a head-only
// shell here; scripts/prerender-static.cjs runs next and replaces their
// body + OG tags with real content. Articles get their full body + OG tags
// here, in one pass, since there's no separate per-article static step.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SITE_URL = "https://kristamashore.ai";
const OG_IMAGE = `${SITE_URL}/og-default.png`;
const POSTS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/blog/posts.json"), "utf8")
).filter((p) => !p.draft);

if (!fs.existsSync(DIST)) {
  console.error("[prerender] dist/ does not exist. Run vite build first.");
  process.exit(1);
}

const templatePath = path.join(DIST, "index.html");
const template = fs.readFileSync(templatePath, "utf8");

// Mirrors src/lib/constants.ts PILLARS. Kept in sync manually since this is a
// plain Node script (no TS import). Do not invent new pillar slugs here.
const PILLARS = {
  "authority-agent-operating-system": "The Authority Agent Operating System™",
  "ai-content-to-client-system": "AI Content to Client System",
  "ai-run-business": "The AI-Run Business",
  "community-market-leaders-ai": "Community Market Leaders®: AI for Real Estate & Lenders",
  "claude-for-dummies": "Claude for Dummies: The AI Tools That Actually Matter",
};

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

function buildPostJsonLd(post) {
  const url = `${SITE_URL}/articles/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.excerpt,
    // Build Standard Req #3: BlogPosting.image must be raster (PNG/JPEG/WebP),
    // never SVG — Google Rich Results rejects SVG schema images. The on-page
    // hero is SVG (see refresh-hero-images.cjs), so schema points at the
    // sitewide raster og-default.png instead, same as og:image.
    image: OG_IMAGE,
    url,
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate,
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Krista Mashore",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Krista Mashore Coaching",
    },
    keywords: post.keywords.join(", "),
    wordCount: post.wordCount,
    articleSection: post.topicalPillar,
    inLanguage: "en-US",
  };
}

function buildFaqJsonLd(faq) {
  if (!faq || !faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

function buildBreadcrumbJsonLd(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

// Builds the visible article markup (title, byline, body with its in-content
// links, CTA, FAQ, related) so crawlers and non-JS LLM fetchers get the real
// content. React (createRoot, not hydrate) replaces this on mount in the
// browser, so there is no hydration mismatch — real users see the SPA version.
function buildArticleHtml(post) {
  const pillarLabel = PILLARS[post.topicalPillar] || post.topicalPillar;
  const pillarSlug = post.topicalPillar;
  const dateStr = new Date(post.publishedDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const img = post.featuredImage.src;
  const faqHtml =
    post.faq && post.faq.length
      ? `<section class="article-faq"><h2>Frequently Asked Questions</h2>${post.faq
          .map(
            (f) =>
              `<h3>${escapeText(f.question)}</h3><p>${escapeText(f.answer)}</p>`
          )
          .join("")}</section>`
      : "";
  // Mirror getRelatedPosts: same pillar, exclude self, first 3.
  const related = POSTS.filter(
    (p) => p.topicalPillar === post.topicalPillar && p.slug !== post.slug
  ).slice(0, 3);
  const relatedHtml = related.length
    ? `<section class="article-related"><h2>More on ${escapeText(
        pillarLabel
      )}</h2><ul>${related
        .map(
          (r) =>
            `<li><a href="/articles/${r.slug}">${escapeText(r.title)}</a></li>`
        )
        .join("")}</ul></section>`
    : "";
  return `<article>
<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/${pillarSlug}">${escapeText(
    pillarLabel
  )}</a></nav>
<p class="eyebrow">${escapeText(pillarLabel)}</p>
<h1>${escapeText(post.title)}</h1>
<p class="excerpt">${escapeText(post.excerpt)}</p>
<p class="byline">By ${escapeText(post.author)} &middot; <time datetime="${escapeAttr(
    post.publishedDate
  )}">${escapeText(dateStr)}</time> &middot; ${post.readingMinutes} min read</p>
<img src="${escapeAttr(img)}" alt="${escapeAttr(post.featuredImage.alt)}" width="1200" height="675" />
<div class="article-body">${post.body}</div>
<aside class="article-cta"><h2>Ready to put this in motion?</h2><p>The Level Up training is the fastest way to plug into Krista's full AI system. Real automations, real results, real support.</p><a href="${escapeAttr(
    post.ctaUrl
  )}">${escapeText(post.ctaLabel)}</a></aside>
${faqHtml}
${relatedHtml}
</article>`;
}

// Open Graph + Twitter Card tags for an article. The React SEO component emits
// these client-side; crawlers and link-preview fetchers don't run JS, so we
// bake them into the static <head> too.
function buildOgTags(post) {
  const url = `${SITE_URL}/articles/${post.slug}`;
  // Lean OG: share/preview the branded raster card, not the per-article hero
  // SVG (which social + LLM preview fetchers won't render).
  const title = escapeAttr(post.metaTitle || post.title);
  const desc = escapeAttr(post.metaDescription || post.excerpt);
  return [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="Krista Mashore Coaching" />`,
    `<meta property="og:image" content="${escapeAttr(OG_IMAGE)}" />`,
    `<meta property="article:published_time" content="${escapeAttr(
      post.publishedDate
    )}" />`,
    `<meta property="article:modified_time" content="${escapeAttr(
      post.modifiedDate
    )}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${escapeAttr(OG_IMAGE)}" />`,
  ].join("\n    ");
}

function injectIntoTemplate(
  routePath,
  schemas,
  titleOverride,
  descOverride,
  bodyHtml,
  extraHead
) {
  let html = template;
  if (titleOverride) {
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${titleOverride}</title>`
    );
  }
  if (descOverride) {
    html = html.replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${descOverride.replace(/"/g, "&quot;")}" />`
    );
  }
  const canonicalTag = `<link rel="canonical" href="${SITE_URL}${routePath}" />`;
  if (!html.includes(canonicalTag)) {
    html = html.replace("</head>", `    ${canonicalTag}\n  </head>`);
  }
  if (extraHead) {
    html = html.replace("</head>", `    ${extraHead}\n  </head>`);
  }
  const schemaTags = schemas
    .filter(Boolean)
    .map(
      (s) =>
        `    <script type="application/ld+json">${JSON.stringify(s)}</script>`
    )
    .join("\n");
  html = html.replace("</head>", `${schemaTags}\n  </head>`);
  if (bodyHtml) {
    html = html.replace(
      /<div id="root">\s*<\/div>/,
      `<div id="root">${bodyHtml}</div>`
    );
  }
  return html;
}

function writePage(routePath, html) {
  const dir =
    routePath === "/" ? DIST : path.join(DIST, routePath.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, "index.html");
  fs.writeFileSync(outPath, html);
}

let pages = 0;

// Pillar pages — head-only shell here; prerender-static.cjs injects the real
// body + full OG/Twitter set next.
for (const [slug, label] of Object.entries(PILLARS)) {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: label, path: `/${slug}` },
  ]);
  const html = injectIntoTemplate(
    `/${slug}`,
    [breadcrumb],
    `${label} Articles | Krista Mashore`,
    `${label} articles for entrepreneurs, real estate agents, and lenders. From Krista Mashore.`
  );
  writePage(`/${slug}`, html);
  pages++;
}

// Articles index — head-only shell here; prerender-static.cjs fills the body.
const articlesBreadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Articles", path: "/articles" },
]);
writePage(
  "/articles",
  injectIntoTemplate(
    "/articles",
    [articlesBreadcrumb],
    "All Articles | Krista Mashore — AI for Business",
    "AI workflows, tools, and authority positioning for entrepreneurs, real estate agents, and lenders."
  )
);
pages++;

// About — head-only shell here; prerender-static.cjs fills the body.
const aboutBreadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
]);
writePage(
  "/about",
  injectIntoTemplate(
    "/about",
    [aboutBreadcrumb],
    "About Krista Mashore | AI Authority for Entrepreneurs, Agents, and Lenders",
    "Top 1% real estate agent for 19 years. $72M coaching company in 7.5 years. Now teaching entrepreneurs, agents, and lenders how to use AI to scale without hiring."
  )
);
pages++;

// Privacy — head-only shell here; prerender-static.cjs fills the body.
const privacyBreadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy" },
]);
writePage(
  "/privacy",
  injectIntoTemplate(
    "/privacy",
    [privacyBreadcrumb],
    "Privacy Policy | Krista Mashore — AI for Business",
    "How Krista Mashore Coaching collects, uses, and protects information associated with kristamashore.ai."
  )
);
pages++;

// Terms — head-only shell here; prerender-static.cjs fills the body.
const termsBreadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Terms of Use", path: "/terms" },
]);
writePage(
  "/terms",
  injectIntoTemplate(
    "/terms",
    [termsBreadcrumb],
    "Terms of Use | Krista Mashore — AI for Business",
    "Terms governing your use of kristamashore.ai and its educational content."
  )
);
pages++;

// Each post — full body + OG tags injected in this one pass.
for (const post of POSTS) {
  const pillarLabel = PILLARS[post.topicalPillar] || post.topicalPillar;
  const schemas = [
    buildPostJsonLd(post),
    buildFaqJsonLd(post.faq),
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: pillarLabel, path: `/${post.topicalPillar}` },
      { name: post.title, path: `/articles/${post.slug}` },
    ]),
  ];
  const html = injectIntoTemplate(
    `/articles/${post.slug}`,
    schemas,
    `${post.metaTitle} | Krista Mashore`,
    post.metaDescription,
    buildArticleHtml(post),
    buildOgTags(post)
  );
  writePage(`/articles/${post.slug}`, html);
  pages++;
}

console.log(`[prerender] wrote ${pages} static pages (articles with real body + OG tags, static routes with head-only shells for prerender-static.cjs)`);
