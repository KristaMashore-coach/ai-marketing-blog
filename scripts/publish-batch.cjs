#!/usr/bin/env node
// Cron-driven publisher. Pops one article off data/blog/queue.json, moves it to
// data/blog/posts.json, commits, pushes. Vercel auto-deploys on push.
//
// Usage:   node scripts/publish-batch.cjs
//          node scripts/publish-batch.cjs --count=2     # publish up to N
//          node scripts/publish-batch.cjs --dry-run     # log only, no commit
//          node scripts/publish-batch.cjs --validate-only
//          node scripts/publish-batch.cjs --no-git

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data/blog/posts.json");
const QUEUE_PATH = path.join(ROOT, "data/blog/queue.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const validateOnly = args.includes("--validate-only");
const noGit = args.includes("--no-git");
const countMatch = args.find((a) => a.startsWith("--count="));
const count = countMatch ? parseInt(countMatch.split("=")[1], 10) : 1;

const ts = () => new Date().toISOString();
const log = (msg) => console.log(`[${ts()}] ${msg}`);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function run(cmd) {
  log(`> ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function validateQueue(queue, posts) {
  const errors = [];
  const publishedSlugs = new Set(posts.map((article) => article.slug));
  const batchSlugs = new Set();
  for (const [index, article] of queue.slice(0, count).entries()) {
    if (!article || typeof article !== "object") {
      errors.push(`queue[${index}] is not an object`);
      continue;
    }
    for (const key of ["slug", "title", "body"]) {
      if (!article[key]) errors.push(`queue[${index}] is missing ${key}`);
    }
    if (publishedSlugs.has(article.slug)) errors.push(`slug already exists: ${article.slug}`);
    if (batchSlugs.has(article.slug)) errors.push(`duplicate slug in queue: ${article.slug}`);
    batchSlugs.add(article.slug);
  }
  return errors;
}

(async function main() {
  log(`publish-batch start (count=${count}, dryRun=${dryRun}, validateOnly=${validateOnly}, noGit=${noGit})`);

  const queue = loadJson(QUEUE_PATH);
  if (!Array.isArray(queue) || queue.length === 0) {
    log("queue is empty — exiting cleanly. nothing to publish.");
    process.exit(0);
  }

  const posts = loadJson(POSTS_PATH);
  const validationErrors = validateQueue(queue, posts);
  if (validationErrors.length) {
    validationErrors.forEach((error) => console.error(`[publish-batch] ${error}`));
    process.exit(1);
  }
  if (validateOnly) {
    log(`validated ${Math.min(count, queue.length)} queued article(s) without changing files.`);
    process.exit(0);
  }

  const toPublish = queue.slice(0, count);
  const remaining = queue.slice(count);

  const today = new Date().toISOString();
  for (const article of toPublish) {
    if (!article.publishedDate) article.publishedDate = today;
    if (!article.modifiedDate) article.modifiedDate = today;
    article.draft = false;
    posts.unshift(article);
    log(`publishing: ${article.slug}`);
  }

  if (dryRun) {
    log(`DRY RUN — would publish ${toPublish.length} article(s). queue would have ${remaining.length} remaining.`);
    process.exit(0);
  }

  saveJson(POSTS_PATH, posts);
  saveJson(QUEUE_PATH, remaining);

  if (noGit) {
    log(`published ${toPublish.length} article(s) locally; skipped git operations.`);
    process.exit(0);
  }

  try {
    run(`git add data/blog/posts.json data/blog/queue.json`);
    const slugs = toPublish.map((a) => a.slug).join(", ");
    run(`git commit -m "publish: ${toPublish.length} article(s) on ${today.split("T")[0]} (${slugs})"`);
    run(`git push`);
    log(`success — published ${toPublish.length} article(s). queue=${remaining.length} remaining.`);
  } catch (err) {
    log(`FAILED during git operation: ${err.message}`);
    process.exit(1);
  }
})();
