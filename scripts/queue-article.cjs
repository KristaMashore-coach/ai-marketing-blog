#!/usr/bin/env node
// Interactive CLI for VAs to queue an article. Reads a JSON or markdown file,
// validates against quality gates, appends to data/blog/queue.json.
//
// Usage:   node scripts/queue-article.cjs path/to/article.json
//          node scripts/queue-article.cjs --validate path/to/article.json   (validation only, no enqueue)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUEUE_PATH = path.join(ROOT, "data/blog/queue.json");

const args = process.argv.slice(2);
const validateOnly = args.includes("--validate");
const filePath = args.filter((a) => !a.startsWith("--"))[0];

if (!filePath) {
  console.error("usage: node scripts/queue-article.cjs <path-to-article.json> [--validate]");
  process.exit(1);
}

const BANNED = require("../src/lib/voice.cjs").BANNED_PHRASES || [];

const REQUIRED = [
  "title",
  "slug",
  "metaTitle",
  "metaDescription",
  "excerpt",
  "publishedDate",
  "modifiedDate",
  "author",
  "topicalPillar",
  "contentTypePillar",
  "funnelStage",
  "keywords",
  "wordCount",
  "readingMinutes",
  "featuredImage",
  "faq",
  "internalLinks",
  "ctaUrl",
  "ctaLabel",
  "body",
];

const VALID_PILLARS = [
  "real-estate-marketing",
  "real-estate-lead-generation",
  "personal-branding-authority",
];
const VALID_TYPES = [
  "local-market-authority",
  "problem-solving",
  "educational-authority",
  "proof-and-validation",
  "personal-brand-relatability",
  "process-and-differentiation",
];
const VALID_STAGES = [
  "attention",
  "resonance",
  "authority",
  "capture",
  "nurture",
  "conversion",
  "ascension",
];

function validate(article) {
  const errors = [];
  const warnings = [];

  for (const k of REQUIRED) {
    if (article[k] === undefined || article[k] === null || article[k] === "") {
      errors.push(`missing required field: ${k}`);
    }
  }

  if (article.title && article.title.length > 70) {
    warnings.push(`title is ${article.title.length} chars (>70 may be truncated in SERPs)`);
  }
  if (article.metaTitle && article.metaTitle.length > 60) {
    errors.push(`metaTitle is ${article.metaTitle.length} chars (must be <=60)`);
  }
  if (article.metaDescription && article.metaDescription.length > 155) {
    errors.push(`metaDescription is ${article.metaDescription.length} chars (must be <=155)`);
  }
  if (article.faq && article.faq.length < 4) {
    errors.push(`faq has ${article.faq.length} entries (must be >=4)`);
  }
  if (article.internalLinks && article.internalLinks.length < 3) {
    warnings.push(`internalLinks has ${article.internalLinks.length} (recommend >=3)`);
  }
  if (article.topicalPillar && !VALID_PILLARS.includes(article.topicalPillar)) {
    errors.push(`invalid topicalPillar: ${article.topicalPillar}`);
  }
  if (article.contentTypePillar && !VALID_TYPES.includes(article.contentTypePillar)) {
    errors.push(`invalid contentTypePillar: ${article.contentTypePillar}`);
  }
  if (article.funnelStage && !VALID_STAGES.includes(article.funnelStage)) {
    errors.push(`invalid funnelStage: ${article.funnelStage}`);
  }
  if (article.featuredImage && (!article.featuredImage.src || !article.featuredImage.alt)) {
    errors.push(`featuredImage must have both src and alt`);
  }
  if (article.body) {
    const lower = article.body.toLowerCase();
    for (const phrase of BANNED) {
      if (lower.includes(phrase)) {
        warnings.push(`banned phrase found in body: "${phrase}"`);
      }
    }
    const emDashes = (article.body.match(/—/g) || []).length;
    if (emDashes > 0) {
      errors.push(`body contains ${emDashes} em-dashes (use periods, commas, or ...)`);
    }
  }
  if (article.slug && !/^[a-z0-9-]+$/.test(article.slug)) {
    errors.push(`slug must be lowercase letters, numbers, and hyphens only`);
  }

  return { errors, warnings };
}

const raw = fs.readFileSync(filePath, "utf8");
const article = JSON.parse(raw);
const { errors, warnings } = validate(article);

if (warnings.length) {
  console.log("\nWARNINGS:");
  warnings.forEach((w) => console.log(`  - ${w}`));
}
if (errors.length) {
  console.log("\nERRORS:");
  errors.forEach((e) => console.log(`  - ${e}`));
  console.log(`\nValidation FAILED. Fix errors and try again.`);
  process.exit(1);
}

console.log("\nValidation PASSED.");
if (validateOnly) {
  console.log("(--validate flag set, not queuing)");
  process.exit(0);
}

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
const exists =
  queue.some((q) => q.slug === article.slug) ||
  JSON.parse(fs.readFileSync(path.join(ROOT, "data/blog/posts.json"), "utf8")).some(
    (p) => p.slug === article.slug
  );
if (exists) {
  console.error(`slug "${article.slug}" already exists in queue or posts. Pick a unique slug.`);
  process.exit(1);
}

queue.push(article);
fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
console.log(`\nQueued. queue size is now ${queue.length}.`);
