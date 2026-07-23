#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data", "blog", "posts.json");
const PROFILE_PATH = path.join(ROOT, "config", "codex-article-context.md");
const outputPath = path.resolve(process.argv[2] || path.join(ROOT, ".codex-daily-context.json"));

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
if (!Array.isArray(posts)) throw new Error("posts.json must be an array");
if (!fs.existsSync(PROFILE_PATH)) throw new Error("approved Codex article context is missing");

const existingArticles = posts.map((article) => ({
  slug: article.slug,
  title: article.title,
  topicalPillar: article.topicalPillar,
  contentTypePillar: article.contentTypePillar,
  funnelStage: article.funnelStage,
  keywords: Array.isArray(article.keywords) ? article.keywords : [],
}));

const context = {
  generatedAt: new Date().toISOString(),
  purpose: "Approved compact daily-writing context for kristamashore.ai. Do not read full published article bodies or any private intake files.",
  site: {
    name: "Krista Mashore, AI for Business",
    url: "https://kristamashore.ai",
  },
  cadence: {
    launchBurstCount: 10,
    ongoingPerDay: 1,
  },
  author: "Krista Mashore",
  cta: {
    url: "https://kristamashore.com/LevelUp",
    label: "Learn the AI System",
  },
  topicalPillars: [
    "authority-agent-operating-system",
    "ai-content-to-client-system",
    "ai-run-business",
    "community-market-leaders-ai",
    "claude-for-dummies",
  ],
  contentTypePillars: [
    "local-market-authority",
    "problem-solving",
    "educational-authority",
    "proof-and-validation",
    "personal-brand-relatability",
    "process-and-differentiation",
  ],
  funnelStages: [
    "attention",
    "resonance",
    "authority",
    "capture",
    "nurture",
    "conversion",
    "ascension",
  ],
  staticRoutes: [
    "/",
    "/articles",
    "/about",
    "/authority-agent-operating-system",
    "/ai-content-to-client-system",
    "/ai-run-business",
    "/community-market-leaders-ai",
    "/claude-for-dummies",
  ],
  approvedProfileMarkdown: fs.readFileSync(PROFILE_PATH, "utf8"),
  bannedPhrases: require(path.join(ROOT, "src", "lib", "voice.cjs")).BANNED_PHRASES || [],
  publishedArticleCount: posts.length,
  existingArticles,
};

fs.writeFileSync(outputPath, JSON.stringify(context, null, 2) + "\n");
console.log(`[codex-context] wrote ${existingArticles.length} compact article records to ${outputPath}`);
