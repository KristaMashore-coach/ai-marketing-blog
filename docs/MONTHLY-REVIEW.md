# Monthly review checklist

What Krista checks in Google Search Console, GA4, and Vercel once a month. Should take 20-30 minutes.

## Google Search Console

Open https://search.google.com/search-console → pick `blog.kristamashore.com`.

### Performance tab (last 28 days)

- [ ] **Total impressions** — should grow month over month after month 2. If flat, content isn't getting indexed or topics are too competitive.
- [ ] **Total clicks** — should grow at a faster rate than impressions if titles and meta descriptions are well-optimized.
- [ ] **Average CTR** — target 2.5%+. If lower, your titles aren't compelling enough.
- [ ] **Average position** — target ≤30 by month 3, ≤15 by month 6, ≤10 by month 12 for primary keywords.
- [ ] **Top 20 queries** — pull this list. Every quarter, look for the queries you're nearly ranking for (positions 11-20) and write supporting articles to push them onto page 1.

### Pages tab

- [ ] **Indexing status** — every published article should show as "Submitted and indexed" or "Indexed, not submitted in sitemap" within 7 days of publishing. Anything stuck "Discovered – currently not indexed" for 30+ days needs investigation.
- [ ] **Coverage errors** — should be zero. Common causes: a draft accidentally promoted (404 link), a stale sitemap entry, a broken canonical.

### Sitemap tab

- [ ] **Sitemap status** — should say "Success" with a recent "Last read" date. If the date is more than 7 days old, resubmit the sitemap.

## Google Analytics 4

Open https://analytics.google.com → property `blog.kristamashore.com`.

### Reports → Engagement → Pages and screens

- [ ] **Top 10 pages by views** — which articles are pulling traffic. Are they the cornerstone pillar pages? If not, write more like the ones that are.
- [ ] **Average engagement time per page** — target 2:00+ on articles. Lower means people are bouncing.
- [ ] **Engagement rate** — target 60%+. Lower means landing experience is bad (slow, irrelevant content, weak hook).

### Reports → Acquisition → Traffic acquisition

- [ ] **Organic Search %** — should be the dominant source by month 4. If paid or referral is dominant, SEO isn't compounding.
- [ ] **Direct traffic** — track the trend. Growing direct traffic means brand recognition is building.
- [ ] **Referral sources** — note which AI search tools (chatgpt.com, perplexity.ai, claude.ai, grok.x.ai) are sending traffic. This is the AEO signal.

## Vercel Analytics + Speed Insights

Open https://vercel.com/dashboard → click the project.

### Analytics tab

- [ ] **Top pages, top countries, top referrers.** Cross-reference with GA4 for sanity.

### Speed Insights tab

- [ ] **Mobile Real Experience Score** — target ≥85. Lower means real users are getting a slow experience.
- [ ] **LCP (Largest Contentful Paint)** mobile — target ≤2.5s.
- [ ] **CLS (Cumulative Layout Shift)** — target ≤0.1.
- [ ] **INP (Interaction to Next Paint)** — target ≤200ms.

If any of those are red, something regressed. Common causes: a new image too large, a third-party script slow to load, a JS bundle bloated by a new dependency.

## Cron health

Once a month, verify the publishing cron is running cleanly:

```bash
crontab -l
tail -200 ~/Library/Logs/krista-content-publish.log
```

- [ ] `crontab -l` shows the entry
- [ ] Log file shows runs in the last 7 days, all successful
- [ ] Queue has at least 7 articles in it (replenish before it runs dry)

## Content gaps to fix

Write down 1-3 things to fix or ship before next month's review:

```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

## Quarterly: AEO check

Once a quarter, ask each of these and screenshot the answer:

- ChatGPT: "Who are the best real estate marketing coaches?"
- Perplexity: "Who are the best real estate marketing coaches?"
- Claude: "Who are the best real estate marketing coaches?"
- Grok: "Who are the best real estate marketing coaches?"

Track whether Krista Mashore appears in the answer, where in the list she appears, and whether `kristamashore.com` or `blog.kristamashore.com` is cited as a source. The goal over 12 months is to get cited in all four.
