# kristamashore.ai Daily Article Writer

This is an unattended production writing task. Do not ask questions. If a fact is unsupported, omit it.

## Objective

Create exactly the number of new articles stated in the Run context section appended below and write the complete JSON array to `data/blog/queue.json`.

You may modify only `data/blog/queue.json`. Do not publish, commit, push, deploy, or modify any other file.

## Required reading

Read `.codex-daily-context.json` once. It contains the approved profile, five topical pillars, voice rules, CTA, banned phrases, and a compact inventory of every published article.

Do not read full published article bodies, private intake files, memory files, the OS vault, publisher code, or validator code. If the compact context is missing or invalid, stop without changing anything.

Keep the run to at most 8 tool calls: read the context, read the empty queue, write the queue, parse it, inspect repository status, and use the remainder for corrections.

## Topic assignment (you do NOT choose the topic)

The context's `assignedTopics` array holds your assignment. It is ordered by priority, highest first.

Write articles for the **first N entries in that array, in order**, where N is the number stated in the Run context section appended below ("Generate exactly N new article(s)"). If it holds more than N, take the first N and ignore the rest; they are the next days' work, not yours. If it holds fewer than N, write what is there and say the backlog is short.

Do not invent a topic, do not substitute one, do not reorder, and do not write about anything that is not in `assignedTopics`.

This replaced free topic selection on 2026-08-15. The site's first 39 articles were written with the writer picking its own topics against pillar names only, with no search-question data in the loop — the same failure blog.kristamashore.com fixed on 2026-08-01. The backlog is built from research into what people actually type. Trust it.

For the assigned topic, these fields are given to you and are NOT yours to change:

- `title` — use it exactly (it is pre-checked against the 70-character limit)
- `slug` — use it exactly
- `primaryKeyword` — must appear in the metaTitle, naturally, toward the front
- `secondaryKeywords` — work them into headings and body where they fit naturally
- `topicalPillar` — use it exactly
- `angle` — the editorial direction; follow it

You still choose: `contentTypePillar` and `funnelStage` if the topic does not specify them, the metaTitle wording (with the primaryKeyword in it), the metaDescription, the article structure, and every sentence of the body.

**If `assignedTopics` is empty or missing, stop without changing anything and say the backlog needs refilling. Never fall back to inventing a topic.**

- It is valid to write about Claude when the article belongs in the `claude-for-dummies` pillar. Claude is the subject of that content, not the publishing engine.
- Do not invent a product feature, version, price, law, statistic, release, quote, testimonial, or result. When the topic's angle cites a statistic (adoption rates, cost ranges), state it as reported research with its source in the same paragraph, or soften to unquantified language.
- Do not search for private material.
- **Fairness rule for comparison and roundup articles.** Some assigned topics compare tools or answer "will AI replace me" fears. Give every option its real strengths and describe honestly who it fits. A page that trashes the alternative reads as an ad, and no search engine or AI assistant will cite it.

## Cluster requirement (added 2026-08-16 after a real defect)

The articles in one batch are normally one topic cluster. On 2026-08-16 a five-article cluster published with 31 internal links between the articles and ZERO pointing at each other. That is five orphans wearing a cluster's name, and it throws away the strongest ranking signal the batch has. Krista flagged it independently: "there aren't any real backlinks in these articles."

So: **every article must link to at least 2 of its siblings in this batch**, inside the prose, where the link genuinely helps the reader. Treat the broadest article in the batch as the hub — it links to every sibling, and every sibling links back to it. Sibling slugs are valid targets even though they are not published yet; the batch publishes atomically, so the links resolve the moment it goes live.

## Exact JSON schema

The array must contain one object per assigned article, each with these keys:

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
15. `internalLinks`: 3 to 5 slugs, each either an article in the context's `existingArticles` OR **another article in THIS batch**. Use bare slugs, never invented ones. See the cluster requirement below.
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
- Confirm the article count matches the Run context, every slug is new and unique, every enum is approved, all internal link slugs exist, and only `data/blog/queue.json` changed.
- Do not run repository scripts. Finish with a short validation summary.
