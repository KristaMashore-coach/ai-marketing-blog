# Per-article SEO + AEO checklist

Print this. Tape it next to your monitor. Run every article through it before queueing.

## Title and meta

- [ ] **Title** is specific, not generic. "Real Estate Marketing in 2026: How to Be Chosen, Not Chase" beats "Real Estate Marketing Tips."
- [ ] **Title** is ≤70 characters. Longer than that gets truncated in SERPs.
- [ ] **metaTitle** is ≤60 characters. Hard cap. The queue script will reject it if longer.
- [ ] **metaDescription** is ≤155 characters. Hard cap. Same.
- [ ] **metaDescription** includes the primary keyword AND a benefit/hook. "Real estate marketing 2026 playbook from a top 1% agent who sold 2,300+ homes" is good. "Tips for real estate agents" is bad.
- [ ] **slug** is lowercase kebab-case. No special characters.

## Body content

- [ ] **Word count** matches the type of article:
  - Cornerstone pillar guide: 3,000+ words
  - Supporting article: 1,200-1,800 words
  - Quick-take: 600-1,000 words (rare)
- [ ] **First paragraph** hooks fast. State the problem or contrarian view in the first 2 sentences. No throat-clearing.
- [ ] **At least one H2** every 300-400 words. Breaks up the content for both readers and crawlers.
- [ ] **At least 1 ordered or unordered list** in the body. AI search engines pull lists into their answers.
- [ ] **At least 3 internal links** to other articles on the site, using descriptive anchor text.
- [ ] **At least 1 link** to the cornerstone pillar article in the same topical pillar.
- [ ] **CTA at the bottom** links to a real funnel URL.

## Voice (Krista-specific)

- [ ] Read aloud. If it sounds like a corporate blog, rewrite.
- [ ] Sentence lengths vary. Short. Then longer. Then short again.
- [ ] No em-dashes (—). Use periods, commas, or "..."
- [ ] No banned phrases. Run `node scripts/queue-article.cjs <file> --validate` to auto-check.
- [ ] Contractions used (don't, can't, won't, you're, it's). No "do not" / "cannot" stiffness.
- [ ] At least one direct, opinionated statement that takes a position.
- [ ] **Community Market Leader®** is written with the registered trademark when used.

## Schema and structured data

- [ ] **FAQ section** has 4-6 question/answer pairs. Each answer 2-3 sentences.
- [ ] FAQ questions match what real people actually search. Use the "People also ask" boxes on Google as inspiration.
- [ ] **Featured image** has a descriptive alt text. Not "image.jpg" — actual description.
- [ ] **topicalPillar** is set to one of the 3 valid values.
- [ ] **contentTypePillar** is set to one of the 6 valid values.
- [ ] **funnelStage** is set to one of the 7 valid values.

## Mobile and performance

- [ ] No images larger than 1600px wide.
- [ ] Featured image is in a modern format (WebP or AVIF preferred, JPG/PNG OK).
- [ ] No embedded videos in the body unless absolutely necessary (they hurt Lighthouse).
- [ ] No tables wider than 600px on mobile (use stacked lists instead).

## After queueing

- [ ] Run `node scripts/queue-article.cjs <file>` and confirm it queued without errors.
- [ ] Once published, visit the live URL and run a Lighthouse mobile audit. Target ≥90.
- [ ] Test the article in Google's Rich Results Test:
  https://search.google.com/test/rich-results
- [ ] Confirm the article shows up in `sitemap.xml` after the next build (cron handles this automatically).

## What good looks like

A great article on this site:
- Speaks to one specific real estate agent, not "agents" in general
- Takes a clear position
- Has at least one piece of proof (a number, a story, a result)
- Links to the cornerstone pillar article and 2-3 other supporting articles
- Has 4-6 FAQs that match real searches
- Reads in Krista's voice when said aloud
