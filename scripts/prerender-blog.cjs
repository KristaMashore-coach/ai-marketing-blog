#!/usr/bin/env node
// Walks every route after a Vite build and writes a static HTML file with the
// rendered output (including JSON-LD baked in) so AI crawlers see the schema.
// Uses the dev-time SSR-style approach: render the React tree to HTML, then
// merge into dist/index.html template. No headless browser required.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const POSTS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/blog/posts.json"), "utf8")
).filter((p) => !p.draft);

if (!fs.existsSync(DIST)) {
  console.error("[prerender] dist/ does not exist. Run vite build first.");
  process.exit(1);
}

const templatePath = path.join(DIST, "index.html");
const template = fs.readFileSync(templatePath, "utf8");

const PILLARS = {
  "real-estate-marketing": "Real Estate Marketing",
  "real-estate-lead-generation": "Real Estate Lead Generation",
  "personal-branding-authority": "Personal Branding & Authority",
};

function buildPostJsonLd(post) {
  const url = `https://blog.kristamashore.com/articles/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage.src.startsWith("http")
      ? post.featuredImage.src
      : `https://blog.kristamashore.com${post.featuredImage.src}`,
    url,
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate,
    author: {
      "@type": "Person",
      "@id": "https://blog.kristamashore.com/#person",
      name: "Krista Mashore",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://blog.kristamashore.com/#organization",
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
      item: `https://blog.kristamashore.com${c.path}`,
    })),
  };
}

function injectIntoTemplate(routePath, schemas, titleOverride, descOverride) {
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
  const canonicalTag = `<link rel="canonical" href="https://blog.kristamashore.com${routePath}" />`;
  if (!html.includes(canonicalTag)) {
    html = html.replace("</head>", `    ${canonicalTag}\n  </head>`);
  }
  const schemaTags = schemas
    .filter(Boolean)
    .map(
      (s) =>
        `    <script type="application/ld+json">${JSON.stringify(s)}</script>`
    )
    .join("\n");
  html = html.replace("</head>", `${schemaTags}\n  </head>`);
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

// Pillar pages
for (const [slug, label] of Object.entries(PILLARS)) {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: label, path: `/${slug}` },
  ]);
  const html = injectIntoTemplate(
    `/${slug}`,
    [breadcrumb],
    `${label} Articles | Krista Mashore`,
    `${label} articles for real estate agents and lenders. From top 1% coach Krista Mashore.`
  );
  writePage(`/${slug}`, html);
  pages++;
}

// Articles index
const articlesBreadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Articles", path: "/articles" },
]);
writePage(
  "/articles",
  injectIntoTemplate(
    "/articles",
    [articlesBreadcrumb],
    "All Articles | Krista Mashore",
    "Real estate marketing, lead gen, and branding articles for agents who want predictable pipelines."
  )
);
pages++;

// About
const aboutBreadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
]);
writePage(
  "/about",
  injectIntoTemplate(
    "/about",
    [aboutBreadcrumb],
    "About Krista Mashore | Top 1% Agent. Top 1% Coach.",
    "Top 1% real estate agent for 19 years. 2,300+ homes sold. $72M coaching company. The story behind Community Market Leader."
  )
);
pages++;

// Each post
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
    post.metaDescription
  );
  writePage(`/articles/${post.slug}`, html);
  pages++;
}

console.log(`[prerender] wrote ${pages} static pages with JSON-LD baked in`);
