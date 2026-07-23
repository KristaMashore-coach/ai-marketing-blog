#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const queuePath = path.join(__dirname, "..", "data", "blog", "queue.json");
const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));

if (!Array.isArray(queue)) throw new Error("queue.json must be an array");
for (const article of queue) {
  const text = String(article.body || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  article.wordCount = text ? text.split(/\s+/).length : 0;
  article.readingMinutes = Math.ceil(article.wordCount / 250);
}
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n");
console.log(`[normalize-codex-queue] normalized ${queue.length} article(s).`);
