#!/usr/bin/env node
// Build-time guard: fail the build if any post is missing a featured image
// OR if any image lacks alt text, OR if the featured image file referenced
// on disk doesn't actually exist (a broken image is as bad as no image for
// AEO/GEO — crawlers and LLM fetchers see a 404). Mandatory per the AEO/GEO
// Build Standard — non-negotiable for AEO and accessibility.
//
// Ported from the BeTheLocalPro template's check-image-tags.cjs and adapted
// to this site's actual data shape: featuredImage.src (not .url), local
// SVG heroes under public/articles/hero/.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data/blog/posts.json");

if (!fs.existsSync(POSTS_PATH)) {
  console.log("[check-image-tags] No posts.json yet, skipping.");
  process.exit(0);
}

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8")).filter((p) => !p.draft);
const errors = [];

for (const post of posts) {
  const slug = post.slug || "(unknown)";

  // Featured image
  if (!post.featuredImage || !post.featuredImage.src) {
    errors.push(`${slug}: missing featured image src`);
  } else {
    if (!post.featuredImage.alt || post.featuredImage.alt.trim().length === 0) {
      errors.push(`${slug}: featured image is missing alt text`);
    }
    // File-existence check: only for local (non-http) paths under public/.
    const src = post.featuredImage.src;
    if (!src.startsWith("http")) {
      const filePath = path.join(ROOT, "public", src.replace(/^\//, ""));
      if (!fs.existsSync(filePath)) {
        errors.push(`${slug}: featured image file does not exist on disk (${src})`);
      }
    }
  }

  // In-article images in body
  if (post.body) {
    const imgTags = post.body.match(/<img\s+[^>]+>/gi) || [];
    for (const tag of imgTags) {
      if (!/\salt=/i.test(tag)) {
        errors.push(`${slug}: in-article <img> tag missing alt attribute — ${tag.substring(0, 80)}`);
      } else if (/\salt=["']\s*["']/i.test(tag)) {
        errors.push(`${slug}: in-article <img> alt attribute is empty — ${tag.substring(0, 80)}`);
      }
    }
  }
}

// Sitewide raster assets referenced by JSON-LD / OG tags must also exist.
const SITEWIDE_ASSETS = ["og-default.png", "images/logo.png", "images/krista-headshot.jpg"];
for (const rel of SITEWIDE_ASSETS) {
  const filePath = path.join(ROOT, "public", rel);
  if (!fs.existsSync(filePath)) {
    errors.push(`sitewide asset missing on disk: public/${rel} (referenced by JSON-LD/OG tags)`);
  }
}

if (errors.length > 0) {
  console.error(`[check-image-tags] BUILD FAILED — ${errors.length} image issues:\n`);
  errors.forEach((e) => console.error(`  - ${e}`));
  console.error(
    "\nFix: every article needs (1) featuredImage.src, (2) featuredImage.alt, (3) the file must exist under public/, (4) alt= on every in-body <img>."
  );
  process.exit(1);
}

console.log(`[check-image-tags] ✓ All ${posts.length} posts have valid image tags and all sitewide assets exist.`);
