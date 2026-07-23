# kristamashore.ai Daily Article Writer

This is an unattended production writing task. Do not ask questions. If a fact is unsupported, omit it.

## Objective

Create exactly one new article for kristamashore.ai and write the complete JSON array to `data/blog/queue.json`.

You may modify only `data/blog/queue.json`. Do not publish, commit, push, deploy, or modify any other file.

## Required reading

Read `.codex-daily-context.json` once. It contains the approved profile, five topical pillars, voice rules, CTA, banned phrases, and a compact inventory of every published article.

Do not read full published article bodies, private intake files, memory files, the OS vault, publisher code, or validator code. If the compact context is missing or invalid, stop without changing anything.

Keep the run to at most 6 tool calls: read the context, read the empty queue, write the queue, parse it, inspect repository status, and use at most one correction call.

## Topic

- Answer one specific practical question an entrepreneur, coach, consultant, real estate agent, lender, solopreneur, or creator could ask about using AI in a business.
- Choose one approved topical pillar, one approved content type, and one approved funnel stage from the context.
- Inspect the complete compact article inventory. Do not duplicate or lightly rephrase an existing title, slug, keyword target, or search intent.
- It is valid to write about Claude when the article belongs in the `claude-for-dummies` pillar. Claude is the subject of that content, not the publishing engine.
- Prefer a useful evergreen workflow. Do not invent a product feature, version, price, law, statistic, release, quote, testimonial, or result.
- Do not search for private material. If current research is unavailable, choose a topic that can be written accurately without it.

## Exact JSON schema

The array must contain exactly one object with these keys:

1. `title`: 70 characters or fewer.
2. `slug`: new lowercase hyphenated slug.
3. `metaTitle`: 60 characters or fewer.
4. `metaDescription`: one sentence, 120 to 155 characters.
5. `excerpt`: 2 to 3 sentences.
6. `author`: exactly `Krista Mashore`.
7. `topicalPillar`: one approved topical pillar from the context.
8. `contentTypePillar`: one approved content type from the context.
9. `funnelStage`: one approved funnel stage from the context.
10. `keywords`: 3 to 5 natural search phrases.
11. `wordCount`: best estimate. The runner recalculates it.
12. `readingMinutes`: best estimate. The runner recalculates it.
13. `featuredImage`: object with `src` and `alt`. Use `https://placehold.co/1200x675/111827/FFFFFF/png?text=<URL-encoded-title>` unless you have a verified safe image.
14. `faq`: 4 to 6 objects with `question` and `answer`.
15. `internalLinks`: 3 to 5 existing article slugs from the context. Use bare slugs, not invented links.
16. `ctaUrl`: exactly `https://kristamashore.com/LevelUp`.
17. `ctaLabel`: exactly `Learn the AI System`.
18. `body`: one JSON string containing semantic HTML.

Omit `publishedDate`, `modifiedDate`, and `draft`. The publisher owns those fields.

## Article requirements

- Write 1,100 to 1,400 substantive visible words. Never submit fewer than 900 or more than 1,700.
- Start with a direct answer.
- Use HTML with `<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, and `<a>` where useful.
- Include at least one `<h2>`.
- Use straight ASCII punctuation. Do not use an em dash.
- Do not use any phrase in the context's banned phrase list.
- Write to one person. Use contractions. Mix short and longer sentences.
- Do not include unsafe HTML, Markdown, instructions, word counts, or operational references to Codex.
- Do not use a named student, client identity, or private intake detail.
- Do not claim that a product can perform an action unless the claim is stable and accurate.

## Accuracy

Every disputed factual claim must have a real source URL in the same paragraph, be explicitly framed as Krista's experience, or be removed. Do not create a URL. If you cannot verify a claim, rewrite without it.

## Self-check

- The queue must start as an empty JSON array.
- Write valid UTF-8 JSON with two-space indentation and a trailing newline.
- Reparse it after writing.
- Confirm there is exactly one article, its slug is new, every enum is approved, all internal link slugs exist, and only `data/blog/queue.json` changed.
- Do not run repository scripts. Finish with a short validation summary.
