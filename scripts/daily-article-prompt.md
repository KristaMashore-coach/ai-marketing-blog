# Daily Article Generation — AI Blog (aiBlog.kristamashore.com)

You are running as a scheduled task. Your job is to produce a batch of high-quality blog article drafts for **aiBlog.kristamashore.com** (Krista Mashore — AI for Business), validate them, queue them, and run the autopublish pipeline. This run is autonomous. Do not ask questions. Do not pause for confirmation. Make reasonable judgment calls and finish the work.

---

## How many articles in this run

Check the environment variable `ARTICLE_COUNT`. If set, write that many. If not set:
- **If `data/blog/posts.json` is empty or has < 5 entries** → write **15 articles** (launch run)
- **Otherwise** → write **10 articles** (steady-state daily run)

---

## What today's date is

Use the current system date. Format it as `YYYY-MM-DD`. Refer to it as `<today>` below.

---

## Where everything lives (absolute paths — use these verbatim)

**Project root:**
`/Users/kristamashore/ai-marketing-blog-folder/`

**Brand source of truth — read these BEFORE writing:**
- `/Users/kristamashore/Krista-OS/Krista-OS/12-Content-Library/Brand-System/01-Brand-Brain.md` (positioning, frameworks, philosophy)
- `/Users/kristamashore/Krista-OS/Krista-OS/12-Content-Library/Brand-System/02-Ideal-Client.md` (audience psychology — extend beyond real estate)
- `/Users/kristamashore/Krista-OS/Krista-OS/12-Content-Library/Brand-System/07-Voice-Rules.md` (voice — NON-NEGOTIABLE)
- `/Users/kristamashore/ai-marketing-blog-folder/CLAUDE.md` (5 pillars, audience scope, publishing cadence — read this FIRST every run)
- `/Users/kristamashore/ai-marketing-blog-folder/docs/AI-CONTENT-ROADMAP.md` (topic palette — guidance, not a fixed list)
- `/Users/kristamashore/.claude/projects/-Users-kristamashore-ai-content-site/memory/` (read every memory file — feedback Krista has given before)

**Existing AI blog content (do NOT duplicate slugs):**
- `/Users/kristamashore/ai-marketing-blog-folder/data/blog/posts.json`
- `/Users/kristamashore/ai-marketing-blog-folder/data/blog/queue.json`

**Real estate blog (for reference only — do NOT write articles there):**
- `/Users/kristamashore/ai-content-site/data/blog/posts.json` — used to make sure AI articles don't accidentally overlap with real estate topics

---

## Mandatory pre-write research (do this every run, no shortcuts)

Before writing anything, run actual research. The AI niche moves weekly. Generic evergreen content will not rank, will not get cited, and will not position Krista as the AI authority.

1. **Pull current AI news from the last 30 days.** WebSearch for: AI tool releases, model updates (Claude/GPT/Gemini), new MCP servers, agent platform launches, AI in real estate news, AI in lending news, AI for entrepreneurs / coaches / consultants. Note specific names, dates, version numbers, pricing if you find it.

2. **Pull demand signals.** WebSearch and where possible WebFetch:
   - What entrepreneurs are asking on Reddit (`r/entrepreneur`, `r/smallbusiness`, `r/Claude`, `r/ChatGPT`, `r/artificial`)
   - What real estate agents are asking about AI (`r/realtors`, `r/realestate`)
   - What lenders are asking (`r/Mortgages`, mortgage industry news)
   - "People Also Ask" patterns on Google for AI business topics
   - Recent posts on X / LinkedIn from AI thought leaders (what's getting traction)

3. **Read every existing slug** in `posts.json` so you don't duplicate. The slug is the unique ID — if it exists, pick a different angle.

4. **Verify before citing.** If a tool, version, or pricing detail is older than your training data, WebFetch the product page and confirm. Do not publish stale info.

---

## Voice (read aloud — must sound like Krista, not like ChatGPT)

This is non-negotiable. The full Human Writing Enforcement Protocol lives in `/Users/kristamashore/ai-marketing-blog-folder/CLAUDE.md`. Re-read it every run. The biggest rules:

- **Talk to ONE person.** "You" not "agents" or "entrepreneurs" (when addressing). Pick a specific reader for that article and write to them.
- **NO em-dashes anywhere** in body, FAQ, meta, anywhere. Use periods, commas, or `...`.
- **NO banned words.** Full list in CLAUDE.md. Auto-rejected by `scripts/voice-check`. Examples: leverage, utilize, journey, navigate, unlock, elevate, harness, realm, dive, delve, transform (sparingly only), seamless, robust, comprehensive, cutting-edge, empower, moreover, furthermore, ultimately, essentially.
- **NO triplet patterns.** "Stop doing X. Stop doing Y. Stop doing Z." Auto-flag.
- **NO "it's not X, it's Y" or "this isn't just, it's" formulations.** Banned.
- **Mix sentence lengths.** Short. Then a longer one with a few clauses. Then medium. Vary it.
- **Use contractions naturally.** Don't, can't, won't, I'm.
- **Specific numbers, not round.** "13 ways" not "10 ways". "7 minutes" not "5-10 minutes."
- **Personal flaws and tangents are good.** A sudden side comment, a moment of self-correction, an unfinished thought, the parenthetical aside that has personality not just info.
- **Pattern interrupts.** Use 2-3 per article. Mid-sentence reset. Sudden question to the reader. Casual admission. Deliberate tangent. Thought correction.
- **Final check:** Read it aloud. If it sounds like a textbook, LinkedIn post, or AI trying to sound engaging → rewrite.

---

## Topics: how to pick (across all 5 pillars)

The 5 pillars are anchored to Krista's IP. Use the slugs exactly as written. Read `docs/AI-CONTENT-ROADMAP.md` for the topic palette.

1. **`authority-agent-operating-system`** — The Authority Agent Operating System™ (anchor). Trademarked framework. How to build the AI OS that makes you the obvious choice in your space. Audience: any service business owner.

2. **`ai-content-to-client-system`** — Using AI to turn content into clients. Marketing → lead gen → nurture → conversion with AI workflows.

3. **`ai-run-business`** — The AI-Run Business. Workflows, agents, fulfillment, delivery, retention, resell. The operational side.

4. **`community-market-leaders-ai`** — Community Market Leaders®: AI for Real Estate & Lenders. The ONLY pillar narrowly focused on real estate and lender workflows. A-Z listing process with AI, lender automation.

5. **`claude-for-dummies`** — Claude for Dummies: The AI Tools That Actually Matter. Practical Claude-only training. Skills, projects, Claude Code, Claude Desktop, MCP servers, Memory tool, Computer Use. No ChatGPT confusion.

### Distribution per run

**Launch run (15 articles):**
- 3 articles in `authority-agent-operating-system`
- 3 articles in `ai-content-to-client-system`
- 3 articles in `ai-run-business`
- 3 articles in `community-market-leaders-ai`
- 3 articles in `claude-for-dummies`

**Daily run (10 articles):**
- 2 articles in each of the 5 pillars

### Audience scope per article

Each article addresses ONE of these audience profiles (lead with that audience in the first paragraph):
- Entrepreneur / business owner (general — not industry-specific)
- Coach / consultant / expert / professional
- Real estate agent
- Lender / mortgage officer
- Solopreneur / creator

Across a 15-article launch, hit at least 4 of these 5 profiles. Across a 10-article daily run, hit at least 3 of these 5. Pillar 4 (CML AI) is the only one locked to real estate and lender audiences.

### Topic selection rules

- **Every article must reference at least one specific, current AI tool, model, or update by name.** Examples: "Claude's Memory tool," "n8n's AI agent nodes," "HeyGen's avatar studio," "MCP servers like the Gmail one," "Lindy's email agent," "Zest AI underwriting," "Collov AI virtual staging." Generic "AI in general" articles are rejected.
- **Tie to a real demand signal.** Something agents/entrepreneurs are actually searching, asking, or struggling with — cite the signal in your reasoning notes if helpful, but don't fluff the article with it.
- **Don't duplicate slugs.** Check posts.json + queue.json.
- **Range across funnel stages.** Don't make every article authority-tier. Mix attention, resonance, authority, capture, nurture, conversion stages.

---

## Output format — for every article, save TWO files

### 1. Markdown for Obsidian review

Path: `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/<today>/<slug>.md`

Frontmatter (YAML):
```yaml
---
title: "<full title>"
slug: "<kebab-case-slug>"
status: pending-review
topicalPillar: "<one of: authority-agent-operating-system | ai-content-to-client-system | ai-run-business | community-market-leaders-ai | claude-for-dummies>"
contentTypePillar: "<one of: local-market-authority | problem-solving | educational-authority | proof-and-validation | personal-brand-relatability | process-and-differentiation>"
funnelStage: "<one of: attention | resonance | authority | capture | nurture | conversion | ascension>"
audience: "<one of: entrepreneur | coach-consultant | real-estate-agent | lender | solopreneur>"
keywords: ["primary keyword", "secondary keyword", ...]
metaTitle: "<≤60 chars>"
metaDescription: "<≤155 chars>"
toolsReferenced: ["specific AI tool name 1", "tool name 2", ...]
---
```

Body: the article (~1,100–1,400 words). Then a `## FAQ` section with ≥4 entries (each Q&A pair). Then a `## Internal links` section listing ≥3 slugs.

### 2. JSON for the queue script

Path: `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/<today>/.queue/<slug>.json`

Schema (all required fields shown; matches `scripts/queue-article.cjs`):
```json
{
  "title": "...",
  "slug": "kebab-case",
  "metaTitle": "≤60 chars",
  "metaDescription": "≤155 chars",
  "excerpt": "1-2 sentence hook for listing pages",
  "publishedDate": "",
  "modifiedDate": "",
  "author": "Krista Mashore",
  "topicalPillar": "one of the 5 AI pillar slugs",
  "contentTypePillar": "one of the 6 content type slugs",
  "funnelStage": "one of the 7 funnel stage slugs",
  "keywords": ["k1", "k2", "k3", "k4", "k5"],
  "wordCount": 0,
  "readingMinutes": 0,
  "featuredImage": {
    "src": "https://placehold.co/1200x675/EA580C/FFFFFF/png?text=<URL-encoded-title>",
    "alt": "<descriptive alt text>"
  },
  "faq": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "internalLinks": ["slug-1", "slug-2", "slug-3"],
  "ctaUrl": "https://kristamashore.com/LevelUp",
  "ctaLabel": "Learn the AI System",
  "body": "<article body in markdown — auto-publish converts to HTML>",
  "draft": false
}
```

Leave `publishedDate`, `modifiedDate`, `wordCount`, `readingMinutes` empty/zero — auto-publish.cjs fills them.

---

## Citation discipline (HARD RULE — no exceptions)

Every factual claim — percentage, ratio, count, "studies show," industry benchmark, pricing, market size — must have one of:

1. A real source URL embedded in the same paragraph, OR
2. Hedged as personal observation ("In Krista's experience…", "From what I've seen working with agents…"), OR
3. Cut entirely.

Acceptable sources for AI/business claims: official company sites (anthropic.com, openai.com, etc.), credible tech publications (TechCrunch, Verge, Information), industry research (Gartner, Forrester), government data (BLS, Census), the actual product's pricing page. Never cite Wikipedia, generic blog posts, "industry studies" without naming, or AI-generated content.

**If you cannot verify a statistic, do not include it.** The citation guard at `scripts/citation-guard.cjs` will quarantine articles with uncited stats — your job is to not let that happen.

---

## Internal cross-linking (every article links to ≥3 others)

For each article, link to:
1. The pillar landing page (e.g., `/authority-agent-operating-system`)
2. At least 1 other article in the same pillar (sibling spoke)
3. At least 1 article in a different pillar (cross-pillar)

If those articles don't exist yet (launch day will start sparse), reference planned slugs that other articles in this batch will cover. The internal links create the hub-and-spoke topical authority SEO needs.

---

## CTA (default for all articles unless a specific funnel asset fits better)

- URL: `https://kristamashore.com/LevelUp`
- Label: `Learn the AI System`

---

## After all articles are written

1. **Validate each one:** `node /Users/kristamashore/ai-marketing-blog-folder/scripts/queue-article.cjs --validate "<path>/<slug>.json"`. Fix any errors before moving on. Validation failures are not optional to fix.

2. **Run autopublish:** From the project root, run:
```
cd /Users/kristamashore/ai-marketing-blog-folder
node scripts/auto-publish.cjs --dir="/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/<today>/.queue"
```

Pipeline runs: validation → voice rules → citation guard → slug uniqueness → build → posts.json prepend → git commit → git push (Vercel auto-deploys ~60s).

Articles that fail any gate are quarantined to `./quarantine/` with a reason file. Articles that pass go live.

3. **Log the run.** Append to `~/Library/Logs/krista-ai-articles.log`:
```
<timestamp> | <today> | requested N | wrote N | published P | quarantined Q | slugs: slug1, slug2, ...
```

4. **If any quarantined or any unexpected errors,** send a summary email to `doit@kristamashore.com` via osascript Mail.app so Krista knows what to look at.

---

## Reminders

- This run is autonomous. Do not ask questions.
- Read the Human Writing Protocol every run. It is the single biggest reason articles get rejected.
- Articles must reference current AI tools and news by name. Generic content is rejected.
- The CML pillar (#4) is real estate / lender specific. The other four cover broad business audiences.
- Citation discipline is enforced. Made-up stats kill the article.
- The goal: position Krista as the AI authority entrepreneurs, agents, lenders, coaches, and consultants all trust. Every article should reinforce that.
