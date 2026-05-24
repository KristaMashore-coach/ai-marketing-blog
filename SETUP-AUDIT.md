# AI Blog Setup Audit — aiBlog.kristamashore.com

**Written for:** Krista Mashore (and possibly her friend's Claude for review)
**Date:** 2026-05-24
**Project root:** `/Users/kristamashore/ai-marketing-blog-folder/`
**GitHub:** `https://github.com/KristaMashore-coach/ai-marketing-blog`
**Vercel:** `ai-marketing-blog` → `ai-marketing-blog-two.vercel.app` (custom domain not yet wired)
**Real estate blog (untouched, for comparison):** `/Users/kristamashore/ai-content-site/` → `blog.kristamashore.com`

---

## What this document is

You gave the same starter repo to your friend. Her tool turned it into an AI blog in about two hours. Mine took most of a day. This file is the honest A-to-Z of what got built, what works, what didn't, and what I'd do differently if I were starting over. No spin.

If you want to skip ahead, the two sections to read are **"Comparing approaches"** and **"Reproducibility."** Those answer the real question: should we keep this build, switch to her tool, or do a hybrid.

---

## 1. Where the project lives

| Thing | Location |
|---|---|
| Working dir | `/Users/kristamashore/ai-marketing-blog-folder/` |
| GitHub repo | `https://github.com/KristaMashore-coach/ai-marketing-blog` |
| Vercel project | `ai-marketing-blog` |
| Vercel preview URL | `ai-marketing-blog-two.vercel.app` |
| Intended custom domain | `aiBlog.kristamashore.com` (NOT yet pointed at Vercel) |
| Real estate sibling (left alone) | `/Users/kristamashore/ai-content-site/` → `blog.kristamashore.com` |
| LaunchAgent plist | `~/Library/LaunchAgents/com.kristamashore.ai-article-writer.plist` |
| Daily run log | `~/Library/Logs/krista-ai-articles.log` |
| Article drafts (Obsidian review) | `~/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/<YYYY-MM-DD>/` |

The two blogs run in parallel and don't share files. The real estate blog publishes 5/day; the AI blog is set to publish 15 on launch day and 10/day after.

---

## 2. Files we created or modified (with what and why)

### Brand and config

- **`CLAUDE.md`** (16,498 bytes) — Project instructions. Sets the audience (entrepreneurs + agents + lenders), the five pillars, publishing cadence (15 launch / 10 daily), and a full copy of the Human Writing Enforcement Protocol so every Claude session that touches this repo writes in your voice.
- **`src/lib/constants.ts`** — Site identity. `SITE_NAME`, `SITE_TAGLINE`, the `PERSON` schema (your bio, awards, social links), the `ORG` schema (Krista Mashore Coaching), `PILLARS` (the five), and `NAV_LINKS`. This is the single source of truth that the React pages and JSON-LD pull from.
- **`src/types/post.ts`** — `TopicalPillar` is now the five AI pillar slugs. Was previously the real estate pillars.

### Pages

- **`src/App.tsx`** — Routes for `/`, `/articles`, `/articles/:slug`, `/about`, and one route per pillar (5 of them).
- **`src/pages/Home.tsx`** — Homepage. Hero copy ("Use AI to run your business. Build autonomous agents. Scale without hiring."), the five pillar cards, recent articles grid, bottom CTA.
- **`src/pages/About.tsx`** — Your bio rewritten for the AI audience. Still references the real estate track record because that's the credibility, but the message is "now using AI to run an entire business so other people can do the same."
- **`src/pages/BlogIndex.tsx`** — Filter pills now show the five AI pillars.
- **`src/components/Footer.tsx`** — Footer pillar links updated to the five.
- **`src/components/Nav.tsx`** — Pulls from `NAV_LINKS` in constants.

### Schema and SEO

- **`index.html`** — Updated `<title>`, meta description, and two JSON-LD blocks (Person + Organization) rebranded from "Real Estate Coach" to "AI Business Coach & Authority."
- **`src/components/JsonLd/PersonSchema.tsx`, `OrganizationSchema.tsx`** — Pull from constants, so they automatically follow the new brand.

### Content pipeline

- **`data/blog/posts.json`** — Cleared to `[]`. The real estate articles that came with the template are gone.
- **`data/blog/queue.json`** — Empty queue, ready for the launch run.
- **`scripts/queue-article.cjs`** — `VALID_PILLARS` updated to the five AI slugs. Validates new articles against the schema, the banned-phrase list, em-dash check, and slug uniqueness.
- **`scripts/daily-article-prompt.md`** (14,036 bytes — new file) — The full prompt the daily Claude run uses. Specifies the 5 pillars, audience scoping rules, mandatory pre-write research step (WebSearch + WebFetch for current AI news), citation discipline, output format for both Markdown (Obsidian) and JSON (queue), and the autopublish command to run at the end.
- **`scripts/daily-article-writer.sh`** (new) — Bash wrapper that launchd calls. Sets paths, runs `claude --print --dangerously-skip-permissions` with the prompt, logs to `~/Library/Logs/krista-ai-articles.log`, and emails you via osascript if anything fails.
- **`scripts/auto-publish.cjs`** — Inherited from the real estate blog. Runs validation → voice rules → citation guard → slug uniqueness → build → prepends posts.json → git commit + push. Vercel auto-deploys.
- **`scripts/citation-guard.cjs`** — Quarantines articles with uncited statistics. Inherited from real estate blog.

### Documentation

- **`docs/AI-CONTENT-ROADMAP.md`** (9,240 bytes — new) — Topic palette across all five pillars. About 60 topic ideas, marked as guidance not a fixed list. The daily prompt references this so the article writer has a starting point but can deviate based on current AI news.

### LaunchD job

- **`~/Library/LaunchAgents/com.kristamashore.ai-article-writer.plist`** — Schedules the daily writer at 6:00 AM. `launchctl list` confirms it's loaded.

### Memory (cross-session persistence)

Files in `/Users/kristamashore/.claude/projects/-Users-kristamashore-ai-content-site/memory/`:

| File | What it preserves |
|---|---|
| `MEMORY.md` | Master index — lists all other memory files with one-line descriptions |
| `ai_blog_pillars.md` | Five pillars anchored to your IP. Explicit note: "do not reduce to three." |
| `ai_blog_audience_scope.md` | Audience is broader than real estate. Entrepreneurs, coaches, agents, lenders. |
| `ai_blog_current_news_focus.md` | Articles must reference current AI tools and news, not generic evergreen content |
| `ai_blog_publishing_cadence.md` | 15 launch day, 10/day after |
| `feedback_working_style.md` | Honest note about how I slowed you down. Documents that the friend did it in 2 hours, that I asked too many questions, that I forgot decisions mid-session. Future Claude sessions read this first. |

---

## 3. The 5 content pillars (final, locked)

1. **`authority-agent-operating-system`** — The Authority Agent Operating System™. Anchor pillar. Trademarked framework. The AI OS that makes you the obvious choice in your space.
2. **`ai-content-to-client-system`** — AI Content to Client System. Marketing → lead gen → nurture → conversion with AI workflows.
3. **`ai-run-business`** — The AI-Run Business. Workflows, agents, fulfillment, delivery, retention, resell. The operational side.
4. **`community-market-leaders-ai`** — Community Market Leaders®: AI for Real Estate & Lenders. The only pillar locked to RE/lender audiences. Tied to CML® trademark + Savvy Seller book.
5. **`claude-for-dummies`** — Claude for Dummies: The AI Tools That Actually Matter. Claude-only, no ChatGPT. Tied to your AI Mastermind teaching.

### Honest note about pillar count

Early in the session I accepted a wrong simplification and reduced these to three. You caught it. We restored the five. That's why there's an explicit memory file (`ai_blog_pillars.md`) that says "Do not reduce to 3 pillars." Future Claude sessions can't repeat the mistake without ignoring memory, which the system instructions tell it not to do. That cost real time you shouldn't have spent.

---

## 4. The article-generation pipeline (end-to-end)

Here's exactly what happens each day:

1. **LaunchD fires at 6:00 AM PT.** The plist at `~/Library/LaunchAgents/com.kristamashore.ai-article-writer.plist` triggers `scripts/daily-article-writer.sh`.
2. **The bash wrapper runs.** It sets the project path, creates today's draft folder under `~/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/<today>/`, then calls `claude --print --dangerously-skip-permissions "$(cat scripts/daily-article-prompt.md)"`.
3. **Claude reads the prompt.** The prompt tells it: read CLAUDE.md, read every memory file, read the brand brain at `/Users/kristamashore/Krista-OS/Krista-OS/12-Content-Library/Brand-System/`, read the topic roadmap.
4. **Claude does pre-write research.** WebSearch for current AI news (last 30 days), demand signals on Reddit, "people also ask" patterns. This step is mandatory. Generic evergreen content is rejected.
5. **Claude writes the batch.** 15 articles on launch day (3 per pillar), 10 on regular days (2 per pillar). Each one ~1,100-1,400 words with FAQ, internal links, full schema.
6. **Two files per article get saved.** A markdown file with YAML frontmatter for Obsidian review, and a JSON file in a `.queue/` subfolder for the pipeline.
7. **Validation runs.** `node scripts/queue-article.cjs --validate` checks every JSON against the Post schema, banned-phrase list, em-dash count, slug rules.
8. **Autopublish runs.** `node scripts/auto-publish.cjs --dir=.queue/` runs the full gauntlet: validation → voice rules → citation guard → slug uniqueness → build → prepend posts.json → git commit → git push.
9. **Vercel sees the push and auto-deploys.** New articles live in about 60 seconds.
10. **Anything that fails gates lands in `./quarantine/`** with a reason file. Email goes to `doit@kristamashore.com` if anything failed.

The pipeline is identical to the real estate blog's working pipeline. That's the upside of cloning — it just works.

---

## 5. Memory and persistence

Already covered above in section 2. The short version: every cross-session decision lives in a memory file. When a new Claude session opens this repo, those files load automatically. So I won't forget that there are five pillars, that the audience is broader than real estate, that articles need current AI news, or that you're frustrated about how long this took.

---

## 6. The launch batch (in flight)

Right now: 5 sub-agents are writing 15 articles in parallel, 3 per pillar. Drafts are landing in `~/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/2026-05-24/`. I can see 15 markdown files already. The JSON queue files come next, then validation, then autopublish, then they go live.

This is a one-time launch event. After today, the launchd job at 6 AM handles the recurring 10/day.

---

## 7. What's NOT done yet

Being explicit so nothing slips:

- **Custom domain not connected.** `aiBlog.kristamashore.com` is not pointed at Vercel. The site is reachable at `ai-marketing-blog-two.vercel.app`.
- **Cloudflare DNS not configured.** Needs a CNAME record from `aiBlog` → `cname.vercel-dns.com` (or whatever Vercel gives you for that domain).
- **First 15 launch articles not yet validated/published.** Drafts are being written. After they're done you (or me) needs to run the autopublish command. Once that succeeds, the homepage will have content and `posts.json` will populate.
- **No GA4 measurement ID.** The real estate blog has one wired; this one has `GA4_MEASUREMENT_ID = ""` in constants. Needs a separate property in Google Analytics.
- **No Google Search Console verification.** Need to add the meta tag once you can sign in to GSC for this domain.
- **The "student version" of this system.** You mentioned wanting to package this so other people can install it. That doesn't exist yet — and honestly, this is where your friend's approach was probably stronger (see next section).

---

## 8. Comparing approaches (honest)

### What my approach assumes and requires

- You start with a real-estate-specific codebase (`krista-mashore-content-site-main/` was the seed) and manually rebrand it. We rewrote `constants.ts`, `Home.tsx`, `About.tsx`, `Footer.tsx`, `BlogIndex.tsx`, `index.html`, JSON-LD schemas, route paths, and the post types file by hand. That's at least 8-10 files I had to touch by hand.
- You (or I) define the pillars, audience, voice rules, publishing cadence — typed out across `CLAUDE.md`, `src/lib/constants.ts`, the daily prompt, and memory files. Same information in 3-4 places.
- The launchd job is set up locally, on your Mac. Not portable. If you wanted to install this on another machine — like for a student — you'd have to redo the plist, redo the paths, redo the absolute-path references in the daily prompt.
- The Krista-OS brand assets at `/Users/kristamashore/Krista-OS/Krista-OS/12-Content-Library/Brand-System/` are referenced by absolute path in the daily prompt. They're not bundled with the repo. If those files move, the prompt breaks.

### What your friend's approach reportedly did better

- Built her version in ~2 hours. Mine took most of a day.
- Her tool accepted zip files of your operating-system content as input. You dropped in the brand kit, it pulled out pillars and avatar context automatically.
- That implies a **starter-kit / generator pattern**: input = brand assets, output = a customized blog. My pattern was **fork-and-modify**: clone the real estate site, change the real-estate-specific bits one by one.
- For a "student version" — i.e., something other people install — her pattern wins. You'd want to give a student a tool where they drop in their own brand assets and get their own blog out, not a forked codebase they have to rewrite by hand.

### Honest weak points of my approach

- **Errors that ate hours.** I reduced 5 pillars to 3 incorrectly partway through. I used a wrong git remote at one point. There was confusion about embedded git repos. There were path mismatches between docs and reality (the daily prompt at one point pointed to `~/Sites/ai-content-site/` when the project lives at `~/ai-marketing-blog-folder/`). Each of these cost real time.
- **Heavy manual rebranding.** Because the seed was real-estate-specific, every page, every constant, every schema had to be touched. A clean generator would not require that.
- **Absolute paths everywhere.** The daily prompt has paths like `/Users/kristamashore/Krista-OS/Krista-OS/12-Content-Library/Brand-System/01-Brand-Brain.md` hardcoded. That works on your Mac and nowhere else. Not portable.
- **No "drop in a new brand kit" mechanism.** If next year you launch a third blog on a third topic, we'd do this whole thing again. Her tool sounds like it would just take a new zip.
- **I asked too many questions.** The `feedback_working_style.md` memory file documents this. You shouldn't have had to nudge me to do parallel work or to stop asking which step to start with.

### Where my approach might actually be stronger

I want to be fair here, not falsely modest. A few things this build has that may not be in her version:

- **The pipeline is autonomous and battle-tested.** This is literally the same auto-publish pipeline that's been running the real estate blog for weeks. It works. Validation, voice rules, citation guard, slug uniqueness, build, prepend, commit, push, deploy. End to end. Already proven.
- **Quality enforcement is real.** Articles with em-dashes get rejected. Articles with banned corporate words get warned. Articles with uncited statistics get quarantined. Articles with duplicate slugs get blocked. This isn't theoretical — it's enforced in code at `scripts/queue-article.cjs`, `src/lib/voice.cjs`, `scripts/citation-guard.cjs`, and `scripts/auto-publish.cjs`.
- **The 5 pillars are anchored to your trademarked IP.** Authority Agent OS™, CML®, the Savvy Seller book, your existing frameworks. A generator that auto-extracts pillars from a brand kit would probably extract whatever happened to be in the kit — it wouldn't know to anchor them to your IP for competitive moat reasons. That's a strategy call, not an extraction call.
- **Human Writing Protocol is enforced at multiple layers.** It's in the daily prompt, in CLAUDE.md, in the voice-validator. Three layers of defense against AI-sounding writing.
- **Memory files persist context across sessions.** Future Claude sessions can't drift from the decisions we made. Whether her tool has anything like this, I can't verify.

### Recommendation

Honestly? **A hybrid is the right answer.** Here's what I'd actually do:

- **Keep this build for the AI blog itself.** It's already wired, the pipeline works, the launchd job is loaded, the memory files exist. Rebuilding from scratch with her tool would throw away a working system to save... what? A few hours that are already spent?
- **Get the friend's tool for the student version.** When you want to package this so coaches and agents can install their own version, her pattern (drop-in brand kit → generated blog) is the right shape. It's a generator. Mine is a single-instance build.
- **Specifically ask her tool to handle the parts mine handles badly.** Pulling pillars from a brand-kit zip. Generating constants.ts and About.tsx from declared inputs instead of manual rewriting. Producing a portable launchd plist (or cron, or GitHub Action) that doesn't hard-code your absolute paths.

If you want one or the other and not both, the deciding question is: do you care more about (a) finishing this blog and getting articles live this week, or (b) being able to give the same system to your students. If (a), keep mine and we're 80% there already. If (b), her tool wins because mine isn't portable. You can probably tell me which matters more.

---

## 9. File tree (current state of the AI blog)

```
/Users/kristamashore/ai-marketing-blog-folder/
├── BUILD-DECISIONS.md
├── CLAUDE.md
├── README.md
├── data/
│   └── blog/
│       ├── posts.json          (empty — [])
│       └── queue.json          (empty — [])
├── docs/
│   ├── AI-CONTENT-ROADMAP.md   (new — topic palette)
│   ├── CONTENT-ROADMAP-30DAY.md
│   ├── CONTENT-WORKFLOW.md
│   ├── CRON-TROUBLESHOOTING.md
│   ├── MONTHLY-REVIEW.md
│   └── SEO-CHECKLIST.md
├── index.html                  (updated: meta + JSON-LD rebranded)
├── package.json
├── public/
│   ├── articles/hero/          (old SVGs from real estate seed — should clean up)
│   ├── favicon.svg
│   ├── llms-full.txt
│   ├── llms.txt
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   ├── auto-publish.cjs        (inherited, working)
│   ├── citation-guard.cjs      (inherited)
│   ├── daily-article-prompt.md (new — 14KB prompt for daily runs)
│   ├── daily-article-writer.sh (new — launchd entry point)
│   ├── queue-article.cjs       (updated VALID_PILLARS)
│   └── ... (other inherited scripts)
├── src/
│   ├── App.tsx                 (updated: routes for 5 pillars)
│   ├── components/
│   │   ├── Footer.tsx          (updated)
│   │   ├── Nav.tsx
│   │   ├── JsonLd/             (Person, Org, Course, Breadcrumb, FAQ, BlogPosting)
│   │   └── ...
│   ├── lib/
│   │   ├── constants.ts        (rewritten: SITE_NAME, PERSON, ORG, PILLARS, NAV)
│   │   ├── posts.ts
│   │   ├── voice.cjs           (banned phrase list, used by validator)
│   │   └── voice.ts
│   ├── pages/
│   │   ├── About.tsx           (rewritten)
│   │   ├── BlogIndex.tsx       (updated filters)
│   │   ├── BlogPost.tsx
│   │   ├── Home.tsx            (rewritten)
│   │   ├── NotFound.tsx
│   │   └── PillarPage.tsx
│   └── types/
│       └── post.ts             (5 AI pillars)
├── student-guide/              (inherited — partial guides for setup, Vercel, GitHub)
└── vercel.json
```

External pieces:

```
~/Library/LaunchAgents/com.kristamashore.ai-article-writer.plist
~/Library/Logs/krista-ai-articles.log
~/.claude/projects/-Users-kristamashore-ai-content-site/memory/
    ├── MEMORY.md
    ├── ai_blog_pillars.md
    ├── ai_blog_publishing_cadence.md
    ├── ai_blog_audience_scope.md
    ├── ai_blog_current_news_focus.md
    └── feedback_working_style.md

~/Krista-OS/Krista-OS/12-Content-Library/Brand-System/
    (read by the daily prompt — not part of this repo)

~/Desktop/Krista's Personal Operating System/Krista-OS/AI-Articles/2026-05-24/
    (today's launch drafts — 15 markdown files plus a .queue/ subfolder)
```

---

## 10. Reproducibility — if someone wanted to recreate this from scratch

This is the part you can actually use if you want to make the student version, or if you ever rebuild. About 14 steps. Order matters.

1. **Clone or fork the real estate content site seed.** Path: `~/ai-marketing-blog-folder/` (or wherever).
2. **Create a new GitHub repo** under `KristaMashore-coach/ai-marketing-blog` (or the equivalent for the student). Set the local repo's remote to point there. `git remote set-url origin <new-url>` if a wrong one is set.
3. **Wipe the seed articles.** `echo "[]" > data/blog/posts.json && echo "[]" > data/blog/queue.json`.
4. **Rewrite `src/lib/constants.ts`.** `SITE_NAME`, `SITE_URL`, `SITE_TAGLINE`, `PERSON`, `ORG`, `PILLARS` (the five), `NAV_LINKS`. This is the single source of truth — every page reads from here.
5. **Rewrite `src/types/post.ts`.** Change `TopicalPillar` to the new 5 slugs.
6. **Update `src/App.tsx`.** Routes for each of the 5 pillars + home + articles + about + 404.
7. **Rewrite the page copy.** `src/pages/Home.tsx`, `src/pages/About.tsx`, `src/pages/BlogIndex.tsx`, `src/components/Footer.tsx`, `src/components/Nav.tsx` (most pull from constants automatically, but copy in the JSX needs to match the new niche).
8. **Update `index.html`.** Title, meta description, Person and Organization JSON-LD blocks.
9. **Write `CLAUDE.md`.** Include the pillars, audience, cadence, voice rules, and the full Human Writing Enforcement Protocol. This is what every future Claude session reads first.
10. **Write the daily article prompt at `scripts/daily-article-prompt.md`.** This is the longest single file in the build. Include: where the brand assets live, mandatory pre-write research step, voice rules, citation discipline, output format for both Markdown and JSON, post-write autopublish command.
11. **Write the bash wrapper at `scripts/daily-article-writer.sh`** and `chmod +x` it. Make it log to `~/Library/Logs/`, create the day's draft folder, run `claude --print --dangerously-skip-permissions`, and email on failure.
12. **Update `scripts/queue-article.cjs`.** Just the `VALID_PILLARS` array — schema validation is otherwise generic.
13. **Write the topic palette at `docs/AI-CONTENT-ROADMAP.md`.** Marked as guidance not a fixed list. About 12-15 topics per pillar.
14. **Install the launchd plist** at `~/Library/LaunchAgents/com.kristamashore.ai-article-writer.plist` and `launchctl load` it. Schedule for 6 AM. Use absolute paths in `ProgramArguments`.
15. **Create memory files** in `~/.claude/projects/<project-folder>/memory/`. One per non-obvious decision (pillars, audience scope, cadence, news-focus, working style). The `MEMORY.md` master index points at the rest. These persist context across sessions.
16. **Deploy to Vercel.** Push to GitHub, import to Vercel, get the preview URL. Wire the custom domain via Cloudflare DNS (CNAME to `cname.vercel-dns.com`).
17. **Run the launch batch.** Trigger the daily writer manually for day 1 with `ARTICLE_COUNT=15` in the environment. Validate. Publish. Done.

If you wanted to build this as a generator (the friend's pattern), steps 4-9 collapse into "user uploads a brand kit, generator templates these files." Steps 14-15 become "generator outputs a portable cron file or a GitHub Action instead of a Mac-specific launchd plist." Steps 10 and 13 stay because the prompt and topic roadmap need real human judgment about positioning and IP anchoring — those don't extract cleanly from a brand kit zip.

---

## Final candor

You asked me to be honest. So: this build works, the pipeline is real and proven, and the articles will start landing on the homepage as soon as the launch batch finishes. That's the upside.

The downside is the day it took. Most of that was avoidable. The reasons it took so long:

- I forgot the 5-pillar decision mid-session and reduced it to 3. You caught it; we restored it. That cost time.
- I asked questions about steps I should have done in parallel.
- I cloned a real-estate-specific codebase and rewrote it by hand instead of building a generator. Brute force, not elegant.
- A few path-mismatch errors between docs and reality forced cleanup passes that shouldn't have been needed.

Your friend's tool sounds like it skipped most of that pain by treating brand kits as input rather than treating a codebase as the starting point. That's the lesson — and that's the pattern I'd use if we ever build the student version of this.

For *this* blog, *right now*, what's built is solid. Let's get the launch articles published, point the domain, wire GA4, and start the daily cycle. Then if the student version becomes the next project, we know what shape it should take.

