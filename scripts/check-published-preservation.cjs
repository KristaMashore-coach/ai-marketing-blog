#!/usr/bin/env node

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const POSTS_PATH = path.join(__dirname, "..", "data", "blog", "posts.json");

function fail(message) {
  console.error(`[published-preservation] FAILED: ${message}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`could not read valid JSON from ${file}: ${error.message}`);
  }
}

function hashArticle(article) {
  return crypto.createHash("sha256").update(JSON.stringify(article)).digest("hex");
}

function snapshot(snapshotPath) {
  const posts = readJson(POSTS_PATH);
  if (!Array.isArray(posts)) fail("posts.json must be an array");
  const articles = posts.map((article, index) => {
    if (!article?.slug) fail(`article at index ${index} has no slug`);
    return { slug: article.slug, sha256: hashArticle(article) };
  });
  fs.writeFileSync(snapshotPath, JSON.stringify({ version: 1, count: posts.length, articles }, null, 2) + "\n");
  console.log(`[published-preservation] snapshotted ${posts.length} articles`);
}

function verify(snapshotPath, expectedAdditions) {
  const baseline = readJson(snapshotPath);
  const posts = readJson(POSTS_PATH);
  if (posts.length !== baseline.count + expectedAdditions) {
    fail(`expected ${baseline.count + expectedAdditions} articles, found ${posts.length}`);
  }
  const current = new Map();
  for (const article of posts) {
    if (!article?.slug) fail("current article has no slug");
    if (current.has(article.slug)) fail(`duplicate slug in posts.json: ${article.slug}`);
    current.set(article.slug, article);
  }
  const oldSlugs = new Set();
  for (const article of baseline.articles) {
    oldSlugs.add(article.slug);
    const match = current.get(article.slug);
    if (!match) fail(`published article disappeared: ${article.slug}`);
    if (hashArticle(match) !== article.sha256) fail(`published article changed: ${article.slug}`);
  }
  const additions = posts.filter((article) => !oldSlugs.has(article.slug));
  if (additions.length !== expectedAdditions) fail(`expected ${expectedAdditions} additions, found ${additions.length}`);
  console.log(`[published-preservation] verified ${baseline.count} unchanged articles and ${additions.length} addition(s)`);
}

function newSlugs(snapshotPath) {
  const baseline = readJson(snapshotPath);
  const oldSlugs = new Set(baseline.articles.map((article) => article.slug));
  for (const article of readJson(POSTS_PATH)) if (!oldSlugs.has(article.slug)) console.log(article.slug);
}

function firstSlug(snapshotPath) {
  const baseline = readJson(snapshotPath);
  if (!baseline.articles.length) fail("snapshot has no articles");
  console.log(baseline.articles[0].slug);
}

const [command, snapshotPathArg, expectedArg] = process.argv.slice(2);
const snapshotPath = snapshotPathArg ? path.resolve(snapshotPathArg) : "";
if (!command || !snapshotPath) fail("usage: check-published-preservation.cjs <snapshot|verify|new-slugs|first-slug> <file> [expected-additions]");
if (command === "snapshot") snapshot(snapshotPath);
else if (command === "verify") verify(snapshotPath, Number(expectedArg));
else if (command === "new-slugs") newSlugs(snapshotPath);
else if (command === "first-slug") firstSlug(snapshotPath);
else fail(`unknown command: ${command}`);
