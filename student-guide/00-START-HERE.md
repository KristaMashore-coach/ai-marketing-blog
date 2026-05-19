# Build Your Own Content Website (Student Guide)

**For real estate agents and lenders who want to be found on Google AND cited by ChatGPT, Perplexity, Claude, and Grok.**

This is the same system Krista uses for `blog.kristamashore.com`. You're going to build your own version. The whole thing takes about 4-6 hours spread across one or two sittings. You'll do it on your own Mac, with Krista's exact playbook.

---

## What you're building

A standalone content website for your real estate business. Two jobs:

1. **SEO** — get found on Google when people search for things like "best realtor in [your town]" or "how to sell my house in [your town]"
2. **AEO** — get cited when people ask ChatGPT, Claude, Perplexity, or Grok "who's the best real estate agent in [your area]?"

Same articles. Two distribution channels. The traffic comes to you instead of you chasing it.

This site is **separate** from any other site you have (your IDX site, your brokerage page, your funnels). Think of this content site as the **front door** that brings traffic in. Your other sites stay your conversion engines.

---

## What you'll need before you start

**Time:**
- Today: ~2 hours to set up accounts and deploy your site
- This week: ~2-3 hours to review and approve your first 5 articles
- Ongoing: ~30 min per article going forward (your team or AI does the heavy lifting)

**Money:**
- $0 for hosting (Vercel free tier — we'll explain)
- $0 for the domain if you use a subdomain of your existing site
- $10-15/year if you want to buy a brand new domain
- $0 for analytics
- That's it for tooling

**Mac requirement:**
- This guide is written for Mac. If you're on Windows, the steps are similar but the commands are different. We have a Windows version coming soon.

**A few accounts you'll need (we'll walk you through each):**
- Vercel (free) — hosts your site
- GitHub (free) — stores your site's code
- Google Analytics (free) — tracks visitors
- Google Search Console (free) — tells Google your site exists

---

## How this guide works

We've broken it into chapters. Do them in order. Each chapter has:

- **What you're doing** — the goal
- **Why** — so you understand
- **Steps** — exact clicks and exact commands to copy-paste
- **What you'll see** — screenshots so you know you did it right
- **If something goes wrong** — common issues and fixes

You don't need to understand the code. You don't need to know what Vite or React or Tailwind is. You just need to follow the steps and ask questions when you're stuck.

## Placeholders in this guide

Anywhere you see something in **square brackets**, that's a placeholder for **your own information**. Replace the whole thing, brackets and all, with what fits you. Examples:

- `[your-email@yourbusiness.com]` → `jane@janesmithrealty.com`
- `[your-name]` → `janesmith`
- `[your-content-site]` → `jane-smith-content-site`
- `[your-domain]` → `janesmithrealty.com`
- `[your-username]` → whatever username you pick on GitHub

If a command in this guide includes `[your-content-site]`, you copy the whole command but type your actual repo name where the placeholder is.

---

## The chapters

1. **[Chapter 1 — Get your Mac ready](01-mac-prerequisites.md)** — Install the tools your computer needs. ~15 min.
2. **[Chapter 2 — Pick your domain](02-pick-your-domain.md)** — Decide where your site will live (subdomain or new domain). ~10 min.
3. **[Chapter 3 — Pick your three pillars](03-pick-your-pillars.md)** — Decide what topics you'll write about. ~30 min. **This is the most important step.**
4. **[Chapter 4 — Set up Vercel](04-setup-vercel.md)** — Create your free hosting account. ~10 min.
5. **[Chapter 5 — Set up GitHub](05-setup-github.md)** — Create the place where your site's code lives. ~5 min.
6. **[Chapter 6 — Get the site code](06-get-the-site-code.md)** — Download Krista's template and customize it for you. ~15 min.
7. **[Chapter 7 — Deploy your site](07-deploy.md)** — Push it live to the internet. ~10 min.
8. **[Chapter 8 — Connect your domain](08-dns-setup.md)** — Point your domain to your live site. ~15 min (then waiting for DNS to propagate, ~1 hour).
9. **[Chapter 9 — Set up Google Search Console](09-google-search-console.md)** — Tell Google your site exists. ~10 min.
10. **[Chapter 10 — Set up Google Analytics](10-google-analytics.md)** — Track who visits your site. ~10 min.
11. **[Chapter 11 — Add your first 5 articles](11-first-articles.md)** — Get your seed content live. ~1-2 hours.
12. **[Chapter 12 — Set up daily auto-publishing](12-cron-setup.md)** — The system that publishes articles automatically every day. ~15 min.
13. **[Chapter 13 — Train your VA team](13-train-your-team.md)** — Show your team how to keep the content flowing. ~30 min.

---

## Before you start: open these tabs in your browser

This will save you time. Open all of these in separate tabs in Chrome or Safari right now:

- https://vercel.com — for hosting
- https://github.com — for code storage
- https://analytics.google.com — for traffic tracking
- https://search.google.com/search-console — for Google indexing

Don't sign up yet for any. Just have them ready.

---

## A note on confidence

**You can do this. You don't need to be technical.** Krista wasn't technical when she built this. The hardest part is the strategic decisions in Chapter 3 — picking the right three topic pillars. The rest is just clicking buttons and pasting commands.

If you get stuck anywhere, the most common issue is a typo when copy-pasting. Read the error, look at what you pasted, fix the typo, try again. 90% of the time that's it.

If you're truly stuck, take a screenshot and bring it to your next coaching call or post in the student community.

---

**Ready? Start with [Chapter 1 — Get your Mac ready](01-mac-prerequisites.md).**
