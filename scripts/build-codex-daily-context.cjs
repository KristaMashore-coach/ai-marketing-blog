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

// TOPIC BACKLOG (ported from krista-mashore-content-codex 2026-08-15).
// WHY: this site published its first 39 articles with the writer free-choosing
// topics against pillar names only — no search-question data anywhere in the
// loop. That is the exact failure the blog fixed on 2026-08-01 ("322 articles,
// zero targeting commercial-intent terms"); the fix was never swept here
// because this site's runner predates it by nine days. The writer is now
// handed the next N topics off a question-intent-researched backlog instead
// of choosing.
//
// AUTHORITATIVE STATE: "already published" is derived from posts.json every
// run, never from a status field in the backlog. See
// .claude/rules/authoritative-state.md (in the Krista-OS vault).
const TOPIC_BACKLOG_PATH = path.join(ROOT, "data", "blog", "topic-backlog.json");
// Same env var the runner/wrapper use (the wrapper sets 5).
const DAILY_CADENCE = Number(process.env.CODEX_DAILY_ARTICLE_COUNT) || 5; // 5/day, Krista-directed 2026-08-16

let assignedTopics = [];
let backlogStats = { total: 0, ready: 0, published: 0, onHold: 0, remaining: 0 };

if (fs.existsSync(TOPIC_BACKLOG_PATH)) {
  const backlog = JSON.parse(fs.readFileSync(TOPIC_BACKLOG_PATH, "utf8"));
  const allTopics = Array.isArray(backlog.topics) ? backlog.topics : [];
  const publishedSlugs = new Set(posts.map((p) => p.slug));

  const published = allTopics.filter((t) => publishedSlugs.has(t.slug));
  const onHold = allTopics.filter((t) => t.status !== "ready");
  const available = allTopics
    .filter((t) => t.status === "ready" && !publishedSlugs.has(t.slug))
    .sort((a, b) => (a.priority || 9999) - (b.priority || 9999));

  backlogStats = {
    total: allTopics.length,
    ready: allTopics.filter((t) => t.status === "ready").length,
    published: published.length,
    onHold: onHold.length,
    remaining: available.length,
  };

  assignedTopics = available.slice(0, DAILY_CADENCE);

  if (assignedTopics.length < DAILY_CADENCE) {
    console.warn(
      `[codex-context] WARNING: backlog has only ${available.length} unpublished ready topic(s) ` +
        `but the daily cadence is ${DAILY_CADENCE}. Refill data/blog/topic-backlog.json with ` +
        `question-intent-researched topics. Do NOT let the writer start inventing topics.`
    );
  }
} else {
  console.warn(`[codex-context] WARNING: ${TOPIC_BACKLOG_PATH} is missing; no topics assigned`);
}

const context = {
  generatedAt: new Date().toISOString(),
  purpose: "Approved compact daily-writing context for kristamashore.ai. Do not read full published article bodies or any private intake files.",
  site: {
    name: "Krista Mashore, AI for Business",
    url: "https://kristamashore.ai",
  },
  cadence: {
    launchBurstCount: 10,
    ongoingPerDay: DAILY_CADENCE,
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
  assignedTopics,
  backlogStats,
  existingArticles,
};

fs.writeFileSync(outputPath, JSON.stringify(context, null, 2) + "\n");
console.log(`[codex-context] wrote ${existingArticles.length} compact article records to ${outputPath}`);
console.log(
  `[codex-context] assigned ${assignedTopics.length} topic(s) from the backlog ` +
    `(${backlogStats.remaining} remaining, ${backlogStats.published} already published, ${backlogStats.onHold} on hold)`
);
for (const t of assignedTopics) console.log(`[codex-context]   -> ${t.slug} (${t.primaryKeyword})`);
