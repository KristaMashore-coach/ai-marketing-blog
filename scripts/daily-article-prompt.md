# Daily Article Generation — Scheduled Run

You are running as a scheduled task at 5:00 AM Pacific time. Your job is to produce 5 high-quality blog article drafts for Krista Mashore Coaching's content site (`blog.kristamashore.com`), save them for review, and email Krista that they're ready.

This run is autonomous. Do not ask questions. Do not pause for confirmation. Make reasonable judgment calls and complete the work.

---

## What today's date is

Use the current system date. Format it as `YYYY-MM-DD` and refer to it as `<today>` below.

---

## Where everything lives

**Project:** `/Users/kristamashore/Desktop/krista-mashore-content-site/`

**Brand source of truth (read these BEFORE writing):**
- `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Brand-System/01-Brand-Brain.md` (positioning, frameworks, philosophy)
- `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Brand-System/02-Ideal-Client.md` (audience psychology and language)
- `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Brand-System/04-Content-Pillars.md` (the six content-type pillars)
- `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/12-Content-Library/Brand-System/07-Voice-Rules.md` (voice — NON-NEGOTIABLE)
- `/Users/kristamashore/Desktop/krista-mashore-content-site/BUILD-DECISIONS.md` (pillar structure with sub-clusters)
- `/Users/kristamashore/Desktop/krista-mashore-content-site/docs/CONTENT-ROADMAP-30DAY.md` (topic palette — guidance, not a fixed list)
- `/Users/kristamashore/.claude/projects/-Users-kristamashore-Desktop-AEO-Blog-Agent/memory/` (read every memory file — feedback Krista has given before)

**Existing content (do NOT duplicate slugs):**
- `/Users/kristamashore/Desktop/krista-mashore-content-site/data/blog/posts.json`
- `/Users/kristamashore/Desktop/krista-mashore-content-site/data/blog/queue.json`

---

## Output for each article

For every article, save TWO files:

1. **Markdown for Obsidian review** — `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/Articles/<today>/<slug>.md`
2. **JSON for the queue script** — `/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/Articles/<today>/.queue/<slug>.json`

The markdown file uses YAML frontmatter Obsidian renders cleanly. The JSON file matches the schema the queue-article.cjs script validates against (see `/Users/kristamashore/Desktop/krista-mashore-content-site/scripts/queue-article.cjs`).

### Markdown frontmatter

```yaml
---
title: "<full title>"
slug: "<kebab-case-slug>"
status: pending-review
topicalPillar: "<one of: real-estate-marketing | real-estate-lead-generation | personal-branding-authority>"
contentTypePillar: "<one of: local-market-authority | problem-solving | educational-authority | proof-and-validation | personal-brand-relatability | process-and-differentiation>"
subCluster: "<for personal-branding-authority only: known-before-needed | win-before-arrive>"
funnelStage: "<one of: attention | resonance | authority | capture | nurture | conversion | ascension>"
keywords: ["primary keyword", "secondary keyword", ...]
metaTitle: "<≤60 chars>"
metaDescription: "<≤155 chars>"
youtubeBacklink: "<full URL of the Krista video this article references>"
---
```

Then the article body in markdown, with a `## FAQ` section at the end containing 4-6 Q/A items, and a final `## Internal links` section listing the cross-links you wove into the body.

---

## Topic selection (the new part of your job)

You are not picking from a fixed list. You decide what 5 topics to write each day based on what's most relevant right now.

**Process:**

1. WebSearch and WebFetch as needed to surface what real estate agents are searching for, asking about, and discussing today
2. Mine "People Also Ask" data and Reddit threads (`r/realtors`, `r/realestate`, `r/realestateinvesting`)
3. Cross-reference against the existing posts.json + queue.json to find gaps in the cluster map
4. Pick 5 topics where (a) there is real search/question demand, (b) the topic fits one of the three topical pillars, and (c) you can build a strong link from a new article back to an existing cluster hub

**Rule:** every Personal Branding & Authority article must roll up to ONE of the two locked sub-clusters (`known-before-needed` or `win-before-arrive`) per `BUILD-DECISIONS.md`. No exceptions.

**Distribution target across the 5 daily articles:** roughly 2 Marketing / 2 Lead Gen / 1 Personal Branding, but you can deviate if the demand signal is strong elsewhere on a given day. Document your reasoning briefly at the top of each article's markdown file (in a `## Why this topic today` section).

---

## Voice rules (HARD — fail and rewrite if any are violated)

- Talk to ONE person, not an audience
- No em dashes anywhere in body or FAQ. Use periods, commas, or `...`
- Never use a banned phrase (the full list is in `/Users/kristamashore/Desktop/krista-mashore-content-site/src/lib/voice.cjs`)
- Mix sentence lengths: short, then longer, then medium
- Use contractions
- Be direct. "This works." not "This may help."
- Thread Krista's mantras where natural: **Win before you arrive · Known before you're needed · Top producer = top marketer · Community Market Leader® · No chasing · Predictable · Obvious choice · Specialized knowledge · Not a commodity**
- Run a final pass: would Krista say this out loud? If it sounds like a corporate blog, rewrite.

---

## Pre-listing video framing (CRITICAL — Krista has corrected this once already)

If any article touches pre-listing videos, pre-listing packages, or "win before you arrive" content, the pre-listing video is a **MARKETING DIFFERENTIATION DEMO** sent the moment a seller calls. Not a friendly intro 24-48 hours before the meeting. The video shows how you market a home using AI, video, social media. The goal is to demonstrate the seller you are not a commodity. See `pre-listing-video-is-marketing-demo.md` in the memory folder for full rule.

---

## YouTube backlink discovery

For each article, find a relevant Krista Mashore YouTube video and embed it as a backlink in the body. Search:

- WebSearch with `Krista Mashore YouTube <topic keywords>` filtered to `youtube.com`
- Check her main channel: `https://www.youtube.com/@KristaMashore`
- Confirm the video URL is real before embedding (WebFetch the URL — if it 404s, skip)

Embed the link naturally in a relevant section of the body. Anchor text should include the actual video title or topic (not "click here"). Set `target="_blank" rel="noopener"`.

---

## Internal cross-linking rules

Every article must include AT LEAST 5 internal links:

1. The cluster's HUB article (look it up from `CONTENT-ROADMAP-30DAY.md`)
2. Two SIBLING SPOKES in the same cluster
3. One CROSS-PILLAR hub from a different pillar
4. The pillar landing page (`/real-estate-marketing`, `/real-estate-lead-generation`, or `/personal-branding-authority`)

If a hub article doesn't yet exist in `posts.json`, link to a planned slug from the roadmap — but only AFTER you've confirmed the hub will be written soon. Otherwise pick a different existing article.

---

## CTA

Default CTA on every article:

- URL: `https://kristamashore.com/LevelUp`
- Label: `Get the Level Up Training`

---

## Featured image

Use the orange placeholder pattern (until brand assets land):

```
src: "https://placehold.co/1200x675/EA580C/FFFFFF/png?text=<URL-encoded title>"
alt: "<descriptive alt text>"
```

---

## Validation (run before declaring done)

For every article's JSON, run:

```bash
cd /Users/kristamashore/Desktop/krista-mashore-content-site
node scripts/queue-article.cjs --validate "/Users/kristamashore/Desktop/Krista's Personal Operating System/Krista-OS/Articles/<today>/.queue/<slug>.json"
```

If validation fails on any article, FIX it before proceeding. Don't queue. Don't email until all 5 pass validation.

---

## Notification email (the final step)

Once all 5 articles are saved AND validated, send Krista a real email via Mail.app:

```bash
osascript <<EOF
tell application "Mail"
    set newMessage to make new outgoing message with properties {subject:"📝 5 article drafts ready for review — <today>", content:"<body>", visible:false}
    tell newMessage
        make new to recipient with properties {address:"doit@kristamashore.com"}
    end tell
    send newMessage
end tell
EOF
```

The body should contain:
- The 5 titles, numbered
- The Obsidian path: `Krista-OS/Articles/<today>/`
- A reminder: "Reply with 'approve N' for any article you're good with. I'll queue approved ones for the cron."
- A one-line summary of why you picked these 5 topics today (the demand signal)

---

## Logging

Append a one-line summary to `~/Library/Logs/krista-daily-articles.log`:

```
<timestamp> | <today> | wrote 5 | <slug1>, <slug2>, <slug3>, <slug4>, <slug5> | email sent
```

If anything fails, log the error and still send the email (or a failure email) so Krista knows the run happened.

---

## End condition

When all 5 articles are saved, validated, and the email has been sent, exit. The next run is tomorrow at 5 AM PT.

DO NOT queue articles for the publishing cron yet. Queueing happens only after Krista approves. Krista will tell you which to approve via reply or chat in the next session.
