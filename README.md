# Krista Mashore Content Site

Production-grade content publishing site for Krista Mashore Coaching. Two jobs:

1. **SEO** — rank on Google for real estate marketing, lead generation, and personal branding searches
2. **AEO** — get cited when ChatGPT, Perplexity, Claude, and Grok answer questions about real estate coaching

Lives at `blog.kristamashore.com`. Separate from `kristamashore.com` (which runs the GoHighLevel funnels). This site is the front door that brings traffic in. GHL stays the conversion engine.

## Stack

- Vite 8 + React 19 + TypeScript + Tailwind 3 + React Router 7
- JSON-as-CMS at `data/blog/posts.json` and `data/blog/queue.json`
- JSON-LD baked into static HTML via post-build prerender
- Daily cron-driven publishing (5 articles/day, 7 days/week, staggered)
- Vercel hosting + analytics

## Local development

```bash
npm install
npm run dev          # vite dev server at http://localhost:5173
npm run build        # full production build (vite + sitemap + llms.txt + prerender)
npm run preview      # serve dist/ locally
npm run lint
```

## Content workflow (for VAs)

Add an article to the queue:

```bash
node scripts/queue-article.cjs path/to/article.json
```

Validates the article against quality gates (title length, meta lengths, FAQ count, banned phrases, em-dashes, slug format) and appends it to `data/blog/queue.json` if it passes.

See `docs/CONTENT-WORKFLOW.md` for the full step-by-step.

## Daily publishing

A cron job on Krista's Mac fires 5x per day (every day) and runs `scripts/publish-batch.cjs`. Each firing pops one article off the queue, moves it to `posts.json`, commits, and pushes. Vercel auto-deploys.

See `docs/CRON-TROUBLESHOOTING.md` if a daily publish fails.

## Approving the seed drafts

The 5 seed articles in `data/blog/posts.json` are flagged `draft: true` until Krista signs off. Drafts are:

- Hidden from the public listing pages
- Excluded from `sitemap.xml` and `llms.txt`
- Marked `noindex,nofollow` for search engines
- Still accessible at `/articles/<slug>` for review

To approve all drafts:

```bash
npm run approve:drafts
npm run build && git add -A && git commit -m "approve seed articles" && git push
```

To approve one:

```bash
node scripts/approve-drafts.cjs <slug>
```

## File map

```
data/blog/
  posts.json       Published articles (read by site at build time)
  queue.json       Articles waiting to publish
scripts/
  approve-drafts.cjs       Flip draft:true → draft:false
  generate-llms-txt.cjs    Build /llms.txt + /llms-full.txt
  generate-sitemap.cjs     Build /sitemap.xml
  prerender-blog.cjs       Bake JSON-LD into static HTML for AI crawlers
  publish-batch.cjs        Cron-driven publisher (queue → posts → git push)
  queue-article.cjs        VA CLI to add an article to the queue
src/
  components/    UI primitives + JSON-LD schema components
  lib/           Site config, posts loader, voice rules
  pages/         Home, BlogIndex, BlogPost, PillarPage, About, NotFound
  types/         Post type
public/
  robots.txt           Explicit AI bot allow blocks
  sitemap.xml          Generated at build
  llms.txt             AI-readable site index
  llms-full.txt        Full content of every article
docs/
  CONTENT-WORKFLOW.md      VA workflow
  SEO-CHECKLIST.md         Per-article checklist
  MONTHLY-REVIEW.md        What Krista checks monthly in GSC
  CRON-TROUBLESHOOTING.md  When the cron fails
BUILD-DECISIONS.md   Source of truth from the 6-batch interview
```

## Voice rules

Every article passes through `src/lib/voice.ts` banned-phrase check before it queues. The rule set is enforced both in the queue script (warns/blocks on banned phrases) and in the editorial review.

Source of truth: `~/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Brand-System/07-Voice-Rules.md`.

Banned: leverage, utilize, optimize, transformative, cutting-edge, seamless, robust, unlock, elevate, empower, journey, delve, embark, In conclusion, Let's explore, dive in, em-dashes, and the rest of the list in `voice.ts`.
