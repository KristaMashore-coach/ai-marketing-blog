#!/usr/bin/env node
// Cron-driven publisher. Pops one article off data/blog/queue.json, moves it to
// data/blog/posts.json, commits, pushes. Vercel auto-deploys on push.
//
// Usage:   node scripts/publish-batch.cjs
//          node scripts/publish-batch.cjs --count=2     # publish up to N
//          node scripts/publish-batch.cjs --dry-run     # log only, no commit

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data/blog/posts.json");
const QUEUE_PATH = path.join(ROOT, "data/blog/queue.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const countMatch = args.find((a) => a.startsWith("--count="));
const count = countMatch ? parseInt(countMatch.split("=")[1], 10) : 1;

const ts = () => new Date().toISOString();
const log = (msg) => console.log(`[${ts()}] ${msg}`);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function run(cmd) {
  log(`> ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

(async function main() {
  log(`publish-batch start (count=${count}, dryRun=${dryRun})`);

  const queue = loadJson(QUEUE_PATH);
  if (!Array.isArray(queue) || queue.length === 0) {
    log("queue is empty — exiting cleanly. nothing to publish.");
    process.exit(0);
  }

  const toPublish = queue.slice(0, count);
  const remaining = queue.slice(count);
  const posts = loadJson(POSTS_PATH);

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
