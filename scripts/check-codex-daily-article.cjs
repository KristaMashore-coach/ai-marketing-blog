#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data", "blog", "posts.json");
const QUEUE_PATH = path.join(ROOT, "data", "blog", "queue.json");
const REQUIRED_KEYS = [
  "title", "slug", "metaTitle", "metaDescription", "excerpt", "author",
  "topicalPillar", "contentTypePillar", "funnelStage", "keywords",
  "wordCount", "readingMinutes", "featuredImage", "faq",
  "internalLinks", "ctaUrl", "ctaLabel", "body",
];
const OPTIONAL_PUBLISHER_KEYS = ["publishedDate", "modifiedDate", "draft"];
const PILLARS = new Set([
  "authority-agent-operating-system",
  "ai-content-to-client-system",
  "ai-run-business",
  "community-market-leaders-ai",
  "claude-for-dummies",
]);
const CONTENT_TYPES = new Set([
  "local-market-authority",
  "problem-solving",
  "educational-authority",
  "proof-and-validation",
  "personal-brand-relatability",
  "process-and-differentiation",
]);
const FUNNEL_STAGES = new Set([
  "attention", "resonance", "authority", "capture",
  "nurture", "conversion", "ascension",
]);
const BANNED = require(path.join(ROOT, "src", "lib", "voice.cjs")).BANNED_PHRASES || [];

function fail(errors) {
  for (const error of errors) console.error(`[codex-daily-check] ${error}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail([`could not read valid JSON from ${file}: ${error.message}`]);
  }
}

function wordCount(html) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

const mode = process.argv[2] || "--queue";
if (!["--queue", "--posts-head"].includes(mode)) {
  fail(["usage: check-codex-daily-article.cjs [--queue|--posts-head]"]);
}

const posts = readJson(POSTS_PATH);
const candidates = mode === "--queue" ? readJson(QUEUE_PATH) : posts.slice(0, 1);
const baseline = mode === "--queue" ? posts : posts.slice(1);
if (!Array.isArray(candidates) || candidates.length !== 1) {
  fail([`expected exactly 1 candidate article; found ${Array.isArray(candidates) ? candidates.length : "non-array"}`]);
}

const article = candidates[0];
const errors = [];
const label = `article${article?.slug ? ` (${article.slug})` : ""}`;
const baselineSlugs = new Set(baseline.map((item) => item.slug));

if (!article || typeof article !== "object" || Array.isArray(article)) fail([`${label}: must be an object`]);
for (const key of REQUIRED_KEYS) if (!(key in article)) errors.push(`${label}: missing required key ${key}`);
for (const key of Object.keys(article)) {
  if (![...REQUIRED_KEYS, ...OPTIONAL_PUBLISHER_KEYS].includes(key)) errors.push(`${label}: unexpected key ${key}`);
}
if (mode === "--queue" && OPTIONAL_PUBLISHER_KEYS.some((key) => key in article)) {
  errors.push(`${label}: publisher-owned date and draft keys must be omitted from the queue`);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || "")) errors.push(`${label}: slug must be lowercase and hyphenated`);
if (baselineSlugs.has(article.slug)) errors.push(`${label}: slug already exists`);
if (String(article.title || "").length > 70) errors.push(`${label}: title must be 70 characters or fewer`);
if (String(article.metaTitle || "").length > 60) errors.push(`${label}: metaTitle must be 60 characters or fewer`);
const metaLength = String(article.metaDescription || "").length;
if (metaLength < 120 || metaLength > 155) errors.push(`${label}: metaDescription must be 120 to 155 characters; found ${metaLength}`);
if (article.author !== "Krista Mashore") errors.push(`${label}: author must be Krista Mashore`);
if (!PILLARS.has(article.topicalPillar)) errors.push(`${label}: invalid topicalPillar`);
if (!CONTENT_TYPES.has(article.contentTypePillar)) errors.push(`${label}: invalid contentTypePillar`);
if (!FUNNEL_STAGES.has(article.funnelStage)) errors.push(`${label}: invalid funnelStage`);
if (!Array.isArray(article.keywords) || article.keywords.length < 3 || article.keywords.length > 5) {
  errors.push(`${label}: keywords must contain 3 to 5 entries`);
}

const actualWords = wordCount(article.body);
if (actualWords < 900 || actualWords > 1700) errors.push(`${label}: visible body word count must be 900 to 1700; found ${actualWords}`);
if (article.wordCount !== actualWords) errors.push(`${label}: wordCount must equal ${actualWords}`);
if (article.readingMinutes !== Math.ceil(actualWords / 250)) errors.push(`${label}: readingMinutes must equal ${Math.ceil(actualWords / 250)}`);
if (!/<h2\b/i.test(article.body || "")) errors.push(`${label}: body needs an h2`);
if (/^#{1,6}\s+/m.test(article.body || "") || /\[[^\]]+\]\([^)]+\)/.test(article.body || "")) errors.push(`${label}: body contains Markdown instead of HTML`);
if (/<(?:script|style|iframe)\b|\son\w+\s*=|javascript:/i.test(article.body || "")) errors.push(`${label}: body contains unsafe HTML`);

const searchableText = [
  article.title, article.metaTitle, article.metaDescription, article.excerpt,
  article.body, ...(article.faq || []).flatMap((item) => [item?.question, item?.answer]),
].join(" ").toLowerCase();
for (const phrase of BANNED) {
  if (searchableText.includes(String(phrase).toLowerCase())) errors.push(`${label}: banned phrase "${phrase}"`);
}
if (/—/.test(searchableText)) errors.push(`${label}: em dash is not allowed`);

if (!article?.featuredImage?.src || !article?.featuredImage?.alt) errors.push(`${label}: featuredImage needs src and alt`);
if (!Array.isArray(article.faq) || article.faq.length < 4 || article.faq.length > 6) errors.push(`${label}: FAQ must have 4 to 6 entries`);
if (!Array.isArray(article.internalLinks) || article.internalLinks.length < 3 || article.internalLinks.length > 5) {
  errors.push(`${label}: internalLinks must contain 3 to 5 published slugs`);
} else {
  for (const link of article.internalLinks) {
    const slug = String(link).replace(/^\/articles\//, "");
    if (!baselineSlugs.has(slug)) errors.push(`${label}: internal link does not exist: ${link}`);
  }
}
if (article.ctaUrl !== "https://kristamashore.com/LevelUp") errors.push(`${label}: CTA URL is incorrect`);
if (article.ctaLabel !== "Learn the AI System") errors.push(`${label}: CTA label is incorrect`);

if (!errors.length) {
  const tmp = path.join(os.tmpdir(), `kristamashore-ai-citation-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify(article));
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", "citation-guard.cjs"), tmp], { encoding: "utf8" });
  fs.rmSync(tmp, { force: true });
  if (result.status !== 0) errors.push(`${label}: citation guard failed: ${(result.stdout || result.stderr || "").trim()}`);
}

if (errors.length) fail(errors);
console.log("[codex-daily-check] verified 1 article, schema, links, voice, citations, images, and word count");
