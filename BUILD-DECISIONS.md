# Build Decisions — Krista Mashore Content Site

Captured from the 6-batch interview on 2026-04-27. Source of truth for every downstream decision. If anything in the codebase contradicts this file, this file wins.

---

## Site identity

- **Production URL:** `blog.kristamashore.com` (subdomain of kristamashore.com)
- **Hosting:** Vercel (free tier, new account to be created)
- **DNS host:** wherever kristamashore.com currently resolves (TBD — confirm at Phase D)
- **Stack:** Vite 6 + React 19 + TypeScript 5 + Tailwind 3 + React Router 7
- **CMS:** JSON-as-CMS (`data/blog/posts.json`, `data/blog/queue.json`)
- **Schema strategy:** JSON-LD baked into static HTML via post-build prerender
- **Project root:** `~/Sites/krista-mashore-content-site/`
- **Node runtime:** v22.22.2 LTS at `/Users/kristamashore/.local/node/bin/node` (NOT Homebrew — see Phase A notes)

---

## Strategic positioning

### What this site exists to do

1. **SEO** — rank on Google for real estate coaching searches (anchor: "real estate marketing coach")
2. **AEO** — get cited when ChatGPT, Perplexity, Claude, and Grok answer "who are the best real estate marketing coaches?" and adjacent queries

This site is **separate** from kristamashore.com (which lives on GoHighLevel and runs Krista's funnels). The new site is the front door that brings traffic in. GHL stays the conversion engine.

---

## Topical (SEO/AEO) pillars — locked

These are the three umbrella topics every article rolls up to. Picked deliberately narrow. Each article gets tagged with one anchor pillar AND one content-type pillar from Krista's own brand system (see below).

| # | Type | Pillar | Why it earns the spot |
|---|------|--------|-----------------------|
| 1 | **Anchor** | **Real Estate Marketing** | "Top producer = top marketer." This is exactly the AEO query Krista wants LLMs to recommend her for. Broadest umbrella. |
| 2 | Supporting | **Real Estate Lead Generation** | Highest-volume pain query. "How do I get more leads/listings." Captures all tactical content (social, paid ads, funnels, video) that lives under attraction-based marketing. |
| 3 | Supporting | **Personal Branding & Authority for Real Estate Agents** | Krista's unique trademarked IP — Community Market Leader®. "Known before you're needed." "Win before you arrive." Differentiation, Epic Report, Unique Listing Presentation, repeat/referral/resell. |

**Rule for content authoring:** every article must (a) target one of these three pillars and (b) include a clear keyword target and search intent. Articles that don't fit a pillar do not get written.

### Personal Branding & Authority — two locked sub-clusters

Added 2026-05-04 from Krista. Every Personal Branding article also rolls up to one of these two sub-clusters. They are not optional — they are the spine of the pillar.

**Sub-cluster A — Known Before You're Needed**

You become the agent your community sees, trusts, and remembers before they need an agent. Built through:

- Being a **Community Market Leader®** in your town
- Continually producing content
- Creating real value
- **Serving, not selling**

Articles in this sub-cluster teach agents how to show up, day after day, so when someone in their market needs an agent the answer is already obvious.

**Sub-cluster B — Win Before You Arrive**

What you do *before* the appointment showcases your authority and unique value proposition. You demonstrate:

- You are **not a commodity**
- You have **specialized knowledge**
- You **use innovation and technology** to deliver results other agents can't

Articles in this sub-cluster teach the pre-appointment authority playbook: pre-listing packages, AI-driven analysis, tech-enabled presentations, and the differentiation moves that close the deal before the agent walks in the door.

These two sub-clusters together = innovation + differentiation = why a seller picks Krista's-system-trained agent over the average agent down the street.

---

## Content-type pillars (Krista's brand system)

From `~/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Brand-System/04-Content-Pillars.md`. Every article carries ONE of these in addition to a topical pillar above.

1. Local Market Authority
2. Problem-Solving Content
3. Educational Authority
4. Proof and Social Validation
5. Personal Brand and Relatability
6. Process and Differentiation

Use the manifest at `08-Manifest.md` and the funnel map at `05-Funnel-Map.md` to align each article with: avatar, objective, funnel stage, content pillar, offer connection, voice. If any of those are missing, the article is not ready to ship.

---

## Audience (corrected during interview)

- Real estate agents AND mortgage loan officers (women priority, men too)
- Ages **35–65** (not 35–55)
- 5–15+ years experience — mid-career, not beginners
- Suburban / small metro markets in US (CA, TX, FL, NV, AZ heavy)
- Stuck in feast-or-famine cycle. Burnt out from 1998 tactics.
- Refuse to: dance on TikTok, beg referrals, cold call, knock doors

Full avatar at `Brand-System/02-Ideal-Client.md`.

---

## Krista's identity for Person schema

- Name: **Krista Mashore**
- Company: **Krista Mashore Coaching (KMC)**
- Location: Discovery Bay, California
- Track record:
  - Top 1% real estate agent nationally for 19 consecutive years
  - **2,300+ homes sold personally** (corrected from 2,500)
  - Built KMC from $0 to ~$72M in online sales in 7.5 years
  - 11 Two Comma Club Awards, 2× $10M+ funnel awards, 2× $25M+ funnel awards
  - Featured: Forbes, WSJ, Yahoo Finance, Inc. 5000, Inman, NBC, FOX
  - Success Magazine Top 125 Most Impactful Leaders (2022); Success Women of Influence (2024)
  - Author of 7 best-selling books
  - M.A. Curriculum & Instruction; B.S. Industrial Psychology

Bio for Person schema (third person, ~100 words) to be drafted in Phase B and reviewed by Krista before publish.

---

## Voice rules — Krista's brand system overrides PDF defaults

The PDF banned-words list ("leverage", "unlock", "unleash", etc.) is good but Krista's `07-Voice-Rules.md` is stricter and more specific. **Krista's voice rules win.** Specifically:

- Write to ONE person, not an audience
- No em dashes (use periods, commas, ellipsis)
- No AI phrases ("In conclusion", "Let's explore", "It's important to note", "The reality is", "Here's the truth", "Dive in", "In today's fast-paced world", etc.)
- No corporate words: leverage, utilize, optimize, transformative, cutting-edge, seamless, robust, unlock, empower, journey, elevate, disrupt, blueprint, innovative, synergy
- No filler: just, really, very, actually, basically, literally
- No consultant language: stakeholders, users, implementation, ecosystem, alignment, "let's be honest", "moving forward", "circle back"
- Mix sentence lengths (short. then longer. then medium.)
- Use contractions
- Be direct (not "this may help" — "this works")
- Approved language: authority, predictable, chosen, obvious choice, build trust, systems, confidence, **Community Market Leaders®** (always with ®), **win before you arrive**, no chasing, real results, proven

The site's `<SEO />` component will support both on-page `title` / `description` (for readers) and CTR-optimized `metaTitle` / `metaDescription` (for SERPs) as separate fields.

---

## Content production — locked

| Decision | Choice |
|----------|--------|
| Writing method | AI drafts → VAs edit in Krista's voice → Krista approves |
| Cadence | **5 articles per day, 7 days a week (35/week)** |
| Publish times | **Staggered across each day** (initial schedule: 6am, 9am, 12pm, 3pm, 6pm ET). Analytics will inform shifts. |
| Time zone | US Eastern |

**Note on cadence:** 35/week is aggressive. The build supports it; the content fill is on Krista's VA team. Quality gates in `scripts/queue-article.cjs` enforce minimum standards (title length, meta length, FAQ count, internal links).

---

## Cron schedule (Phase F)

- 5 publish times per day, every day
- Initial cron pattern: `0 6,9,12,15,18 * * *` running `~/Scripts/krista-content-publish.sh`
- Each firing pops up to 1 article off `data/blog/queue.json`, moves it to `data/blog/posts.json`, commits, pushes (Vercel auto-deploys)
- Logs to `~/Library/Logs/krista-content-publish.log`
- Success/failure email to **doit@kristamashore.com**

If the queue is empty at a given firing, the cron exits cleanly (no commit, just a log line). VA team backfills.

---

## Existing accounts

| Account | Status | Action |
|---------|--------|--------|
| Google Analytics 4 | HAS ONE | Krista to drop measurement ID (`G-XXXXXXXXXX`) in chat |
| Microsoft Clarity | DEFERRED | Not installing on day 1. Reminder logged. Add post-launch. |
| Google Search Console | UNSURE | Verify at Phase E. Add `blog.kristamashore.com` as a separate property. |
| GitHub | HAS ONE | Krista authorizes via gh CLI at Phase D |
| Vercel | NEW | Create at Phase D using GitHub auth |

---

## Brand assets — pending from Krista

These don't block Phase B/C. Site will scaffold with placeholder values; swap in when delivered. Tagged in code with `// BRAND-ASSET-PENDING` comments.

- [ ] Logo file (SVG preferred, PNG fine)
- [ ] Brand color hex codes — background / primary / accent
- [ ] Headshot (high-res, square or near-square — used in Person JSON-LD)
- [ ] Social profile URLs:
  - LinkedIn
  - YouTube
  - Instagram
  - Facebook
  - X (Twitter)
- [ ] Default conversion URL — currently `KristaMashore.com/LevelUp` per Operations Log; confirm

Bio (third-person, ~100 words) will be drafted by Claude from `01-Brand-Brain.md` + `00-Credentials.md` and shown to Krista for approval before going into JSON-LD.

---

## Conversion path

Reader on `blog.kristamashore.com` → article CTA → kristamashore.com (GoHighLevel funnel). Default CTA destination: `KristaMashore.com/LevelUp` until Krista confirms otherwise. Different pillars CAN route to different funnels later (e.g., Lead Gen articles → /FastActionNow), but day 1 is one CTA.

---

## Validation gates (Phase H — must all pass before "done")

- [ ] All 5 seed articles return 200 on `https://blog.kristamashore.com/`
- [ ] Each article passes Google's Rich Results Test for BlogPosting + FAQPage + BreadcrumbList
- [ ] `sitemap.xml` lists every article with current `lastmod`
- [ ] `llms.txt` is generated, lists every article, links to `/llms-full.txt`
- [ ] `robots.txt` explicitly allows: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Googlebot, DuckDuckBot
- [ ] GA4 Real-Time shows live traffic when Krista visits the live site
- [ ] Vercel Analytics + Speed Insights show pageview events
- [ ] Google Search Console shows the sitemap as "Success"
- [ ] Mobile Lighthouse score 90+ on home page and one article
- [ ] No console errors on home or any article
- [ ] `crontab -l` shows the publishing cron registered
- [ ] Manual test of `~/Scripts/krista-content-publish.sh` runs end-to-end without errors
- [ ] `~/Library/Logs/krista-content-publish.log` is writable

---

## Open follow-ups (deferred, do not forget)

1. **Microsoft Clarity install** — deferred at Krista's request. Revisit post-launch.
2. **Brand asset collection** — logo, colors, headshot, socials, conversion URL, GA4 ID. None block scaffolding.
3. **Multi-funnel routing** — once basics are stable, route different topical pillars to different `KristaMashore.com/<funnel>` URLs based on intent.
4. **Best-time-to-post analysis** — instrument GA4 with publish-time dimension; review at 30 days and shift cron pattern.

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-27 | Domain: `blog.kristamashore.com` (subdomain) | Inherits kristamashore.com SEO authority; cleanest separation from GHL funnels |
| 2026-04-27 | 3 SEO pillars: Marketing / Lead Gen / Personal Branding | Topical depth beats breadth for AEO; aligns with Krista's "marketing coach" positioning |
| 2026-04-27 | Audience: 35–65, women priority + men | Corrected from 35–55, women only |
| 2026-04-27 | 2,300 homes sold (not 2,500) | Krista correction |
| 2026-04-27 | 5 articles/day × 7 days, staggered | Krista's call; aggressive but supported by build |
| 2026-04-27 | Node via tarball, NOT Homebrew | Homebrew install needs sudo; tarball install requires no sudo and gives stable cron path |
| 2026-04-27 | Krista's voice rules > PDF banned-words list | Krista's rules are stricter and brand-specific |
| 2026-04-27 | Clarity deferred | Krista's call — focus on shipping the site first |
| 2026-04-27 | Today is launch day | Krista's timeline |
