# Content workflow

For Krista's VA team. How to take Krista's source material (course modules, podcasts, YouTube videos) and turn it into a queued, validated article on the site.

## The flow at a glance

```
[Krista source material]
        ↓
[Codex daily draft through Krista's ChatGPT subscription]
        ↓
[VA edit: Krista's voice, frameworks, banned-word check]
        ↓
[VA fills out article JSON template]
        ↓
[node scripts/queue-article.cjs article.json]   ← validates + queues
        ↓
[Krista approves (every 5th article minimum)]
        ↓
[Daily cron picks up the queue, publishes]
```

## Step 1: Pick the topic

Every article must fit one **topical pillar** AND one **content-type pillar**.

**Topical pillars** (one per article):
- `real-estate-marketing` (anchor)
- `real-estate-lead-generation`
- `personal-branding-authority`

**Content-type pillars** (one per article, from Krista's brand system):
- `local-market-authority`
- `problem-solving`
- `educational-authority`
- `proof-and-validation`
- `personal-brand-relatability`
- `process-and-differentiation`

If the topic doesn't fit a topical pillar, don't write it.

## Step 2: Pull source material

Use one of these as the seed:
- A specific Krista YouTube video
- A specific podcast episode
- A specific module from her course
- A specific Loom training
- A specific email or social post she wrote

Get the transcript or full text. Don't write articles from generic AI prompts — write them from Krista's actual content.

## Step 3: AI first draft

The scheduled production writer is Codex through Krista's ChatGPT subscription. For an intentional manual draft, use the same approved context and schema as `prompts/codex-daily-article-writer.md`.

> Write one 1,100 to 1,400 word article in Krista Mashore's approved voice based on this source material. Write to one person, use no em dashes or banned phrases, include a 4 to 6 question FAQ, 3 to 5 verified internal links, and the approved CTA. Topic pillar: [PILLAR]. Content type: [TYPE]. Source material: [PASTE].

Save the draft. Don't ship it yet.

## Step 4: VA edit pass

Run through the draft with these checks:

- [ ] Does it sound like Krista? Read it aloud. If it sounds like a corporate blog, rewrite.
- [ ] Are the proprietary terms in correctly? **Community Market Leader®** (always with ®). Epic Report. Unique Listing Presentation.
- [ ] Are her mantras included where natural? "Top producer = top marketer." "Known before you're needed." "Win before you arrive."
- [ ] No banned phrases. Check `src/lib/voice.ts` for the full list.
- [ ] No em-dashes. Use periods, commas, or "..."
- [ ] Mix sentence lengths. Short, then medium, then short again.
- [ ] At least one direct, contrarian statement that takes a position.
- [ ] FAQ has 4-6 entries. Each answer should be 2-3 sentences.
- [ ] At least 3 internal links to other articles.
- [ ] CTA at the bottom links to `https://kristamashore.com/LevelUp` (default) or the appropriate funnel for the pillar.

## Step 5: Fill the article JSON

Save the file as `<slug>.json` in a working folder.

```json
{
  "title": "Article title (catchy, specific, ≤70 chars)",
  "slug": "article-title-kebab-case",
  "metaTitle": "SEO/AEO title (≤60 chars, optimized for click)",
  "metaDescription": "SEO description (≤155 chars, mentions key benefit)",
  "excerpt": "1-2 sentence summary for cards and og:description",
  "publishedDate": "2026-04-27T08:00:00-04:00",
  "modifiedDate": "2026-04-27T08:00:00-04:00",
  "author": "Krista Mashore",
  "topicalPillar": "real-estate-marketing",
  "contentTypePillar": "educational-authority",
  "funnelStage": "authority",
  "keywords": ["primary keyword", "secondary keyword", "..."],
  "wordCount": 1500,
  "readingMinutes": 8,
  "featuredImage": {
    "src": "https://placehold.co/1200x675/EA580C/FFFFFF/png?text=Title",
    "alt": "Descriptive alt text"
  },
  "faq": [
    {"question": "Q1?", "answer": "A1."},
    {"question": "Q2?", "answer": "A2."},
    {"question": "Q3?", "answer": "A3."},
    {"question": "Q4?", "answer": "A4."}
  ],
  "internalLinks": [
    "/articles/cornerstone-article",
    "/articles/related-article-1",
    "/articles/related-article-2"
  ],
  "ctaUrl": "https://kristamashore.com/LevelUp",
  "ctaLabel": "Get the Level Up Training",
  "body": "<p>HTML article body...</p><h2>Section</h2><p>...</p>"
}
```

## Step 6: Validate

```bash
cd ~/Sites/krista-mashore-content-site
node scripts/queue-article.cjs path/to/article.json --validate
```

Reads the file, checks every field, prints any errors and warnings. **Don't queue until validation passes.**

## Step 7: Queue

```bash
node scripts/queue-article.cjs path/to/article.json
```

Adds to `data/blog/queue.json`. Articles publish in queue order, oldest first.

## Step 8: Krista review (every 5th article minimum)

Krista reviews articles before they queue, every 5th by default. To preview a queued article visually before publish, copy it temporarily into `data/blog/posts.json` with `draft: true`, run `npm run dev`, visit `/articles/<slug>`.

When approved, run:

```bash
git add data/blog/queue.json
git commit -m "queue: <slug>"
git push
```

## When the queue is empty

The cron exits cleanly and logs "queue is empty". Nothing breaks. Refill the queue and the next firing picks up.

## Common errors

- **"slug already exists"** — pick a unique slug.
- **"metaTitle too long"** — must be ≤60 characters, hard cap.
- **"metaDescription too long"** — must be ≤155 characters, hard cap.
- **"faq has X entries"** — needs 4-6.
- **"banned phrase found"** — check `src/lib/voice.ts` and rewrite that section.
- **"em-dashes found"** — replace with periods, commas, or "..."
