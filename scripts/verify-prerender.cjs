#!/usr/bin/env node
// Build guardrail: after prerender, assert every published article AND every
// static route actually shipped crawlable HTML. This is the check that would
// have caught the empty-shell bug (body was just <div id="root"></div>) on
// kristamashore.ai before it went live — for articles AND the homepage /
// pillar / articles-index / about routes, which had NO static-route prerender
// step at all until this port (2026-07-19).
//
// Ported from ~/Sites/krista-mashore-content-site/scripts/verify-prerender.cjs
// and adapted to this site's 5 real pillars (not the real-estate blog's 3).
//
// Runs LAST in the build, after prerender-blog.cjs + prerender-static.cjs.
// Exits non-zero on any failure so the build (and the Vercel deploy) halts
// instead of shipping blanks.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const POSTS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/blog/posts.json"), "utf8")
).filter((p) => !p.draft);

// Minimum body length (chars between <body> and </body>). A real article is
// many KB; an empty shell is ~30 chars (<div id="root"></div>). 1200 is a safe
// floor that no real article falls under but every empty shell trips.
const MIN_BODY_CHARS = 1200;

// Static-route body floors per Build Standard Req #1: 400 chars minimum,
// 600 for the homepage specifically (the single most important URL).
const MIN_STATIC_BODY_CHARS = 400;
const MIN_HOME_BODY_CHARS = 600;

const STATIC_ROUTES = [
  { route: "/", label: "homepage", minChars: MIN_HOME_BODY_CHARS },
  { route: "/articles", label: "articles index", minChars: MIN_STATIC_BODY_CHARS },
  { route: "/about", label: "about", minChars: MIN_STATIC_BODY_CHARS },
  {
    route: "/authority-agent-operating-system",
    label: "pillar: authority-agent-operating-system",
    minChars: MIN_STATIC_BODY_CHARS,
  },
  {
    route: "/ai-content-to-client-system",
    label: "pillar: ai-content-to-client-system",
    minChars: MIN_STATIC_BODY_CHARS,
  },
  {
    route: "/ai-run-business",
    label: "pillar: ai-run-business",
    minChars: MIN_STATIC_BODY_CHARS,
  },
  {
    route: "/community-market-leaders-ai",
    label: "pillar: community-market-leaders-ai",
    minChars: MIN_STATIC_BODY_CHARS,
  },
  {
    route: "/claude-for-dummies",
    label: "pillar: claude-for-dummies",
    minChars: MIN_STATIC_BODY_CHARS,
  },
];

const failures = [];

function routeFile(routePath) {
  const dir = routePath === "/" ? DIST : path.join(DIST, routePath.replace(/^\//, ""));
  return path.join(dir, "index.html");
}

function countOgTitleTags(html) {
  const matches = html.match(/<meta\s+property="og:title"/gi);
  return matches ? matches.length : 0;
}

function schemaImagesAreRaster(html) {
  // Pull every JSON-LD block and check any "image" field doesn't end in .svg.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const svgImages = [];
  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw);
      const img = data.image;
      if (typeof img === "string" && /\.svg(\?.*)?$/i.test(img)) svgImages.push(img);
    } catch {
      // Non-JSON or malformed block — ignore, not this guard's concern.
    }
  }
  return svgImages;
}

function ogImageIsRaster(html) {
  const match = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
  if (!match) return { present: false, isSvg: false, value: null };
  const value = match[1];
  return { present: true, isSvg: /\.svg(\?.*)?$/i.test(value), value };
}

// --- Articles ---------------------------------------------------------
for (const post of POSTS) {
  const file = path.join(DIST, "articles", post.slug, "index.html");
  if (!fs.existsSync(file)) {
    failures.push(`${post.slug}: prerendered file missing (${file})`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : "";

  const problems = [];
  if (body.length < MIN_BODY_CHARS)
    problems.push(`body too short (${body.length} chars, need ${MIN_BODY_CHARS}+) — likely an empty shell`);
  if (!/<h1[\s>]/i.test(body)) problems.push("no <h1> in body");
  if (!/<article[\s>]/i.test(body)) problems.push("no <article> in body");
  if (!/application\/ld\+json/i.test(html)) problems.push("no JSON-LD schema");
  if (!/property="og:title"/i.test(html)) problems.push("no og:title meta");

  const ogTitleCount = countOgTitleTags(html);
  if (ogTitleCount > 1) problems.push(`duplicate og:title (${ogTitleCount} found, need exactly 1)`);

  const ogImg = ogImageIsRaster(html);
  if (ogImg.present && ogImg.isSvg) problems.push(`og:image is SVG (${ogImg.value}) — must be raster`);

  const svgSchemaImages = schemaImagesAreRaster(html);
  if (svgSchemaImages.length)
    problems.push(`schema image(s) are SVG: ${svgSchemaImages.join(", ")} — must be raster`);

  if (problems.length) failures.push(`article ${post.slug}: ${problems.join("; ")}`);
}

// --- Static routes (homepage, articles index, about, pillar pages) ----
for (const { route, label, minChars } of STATIC_ROUTES) {
  const file = routeFile(route);
  if (!fs.existsSync(file)) {
    failures.push(`${label} (${route}): prerendered file missing (${file})`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  // #root can contain nested closing </div> tags (real body markup), so a
  // non-greedy match up to the first </div> under-captures. Instead, capture
  // everything between the opening #root tag and the closing </body> — in
  // Vite's built output the module <script> tag lives in <head>, not after
  // #root, so </body> is the reliable end marker.
  const rootMatch = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/i);
  const rootHtml = rootMatch ? rootMatch[1] : "";
  const textOnly = rootHtml.replace(/<[^>]+>/g, "").trim();

  const problems = [];
  if (textOnly.length < minChars)
    problems.push(
      `#root text too short (${textOnly.length} chars, need ${minChars}+) — likely an empty or thin shell`
    );
  if (!/<h1[\s>]/i.test(rootHtml)) problems.push("no <h1> in #root");

  const ogTitleCount = countOgTitleTags(html);
  if (ogTitleCount === 0) problems.push("no og:title meta");
  if (ogTitleCount > 1) problems.push(`duplicate og:title (${ogTitleCount} found, need exactly 1)`);

  const ogImg = ogImageIsRaster(html);
  if (!ogImg.present) problems.push("no og:image meta");
  if (ogImg.present && ogImg.isSvg) problems.push(`og:image is SVG (${ogImg.value}) — must be raster`);

  const svgSchemaImages = schemaImagesAreRaster(html);
  if (svgSchemaImages.length)
    problems.push(`schema image(s) are SVG: ${svgSchemaImages.join(", ")} — must be raster`);

  if (problems.length) failures.push(`${label} (${route}): ${problems.join("; ")}`);
}

if (failures.length) {
  console.error(
    `[verify-prerender] ✗ FAILED — ${failures.length} route(s) did not ship crawlable HTML:`
  );
  for (const f of failures.slice(0, 25)) console.error(`  - ${f}`);
  if (failures.length > 25) console.error(`  ...and ${failures.length - 25} more`);
  console.error(
    "[verify-prerender] Build halted. Crawlers/LLMs would see empty or broken pages. Fix prerender-blog.cjs / prerender-static.cjs before shipping."
  );
  process.exit(1);
}

console.log(
  `[verify-prerender] ✓ all ${POSTS.length} articles + ${STATIC_ROUTES.length} static routes shipped crawlable HTML (body, h1, JSON-LD, single og:title, raster images)`
);
