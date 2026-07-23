# Build Decisions: kristamashore.ai

This is the operational source of truth for kristamashore.ai.

## Site identity

- Production URL: `https://kristamashore.ai`
- Brand: Krista Mashore, AI for Business
- Author: Krista Mashore
- Stack: Vite, React, TypeScript, Tailwind, React Router
- CMS: `data/blog/posts.json` and `data/blog/queue.json`
- Hosting: Vercel from the GitHub `main` branch

## Purpose

The site teaches entrepreneurs, coaches, consultants, real estate agents, lenders, solopreneurs, and creators how to use AI workflows, agents, and operating systems to build authority and run a stronger business.

## Locked topical pillars

1. `authority-agent-operating-system`
2. `ai-content-to-client-system`
3. `ai-run-business`
4. `community-market-leaders-ai`
5. `claude-for-dummies`

The `claude-for-dummies` pillar is intentional editorial subject matter. Moving the publishing engine from Claude to Codex does not remove or rewrite content that teaches Claude products.

## Voice and accuracy

- Write to one person.
- Use direct, conversational language.
- No em dashes.
- No banned phrases from `src/lib/voice.cjs`.
- Do not invent product features, current prices, versions, laws, statistics, quotes, testimonials, or results.
- Every disputed factual claim needs a real source in the same paragraph, clear attribution to Krista's experience, or removal.
- Never expose a student's intake answers or private business information.

## Article ownership and preservation

- `data/blog/posts.json` is the published article source of truth.
- Existing article records must remain byte-for-byte unchanged during routine daily publishing.
- A preservation guard hashes every published article before generation and verifies all prior articles after publishing and after the production build.
- New article slugs must be unique.
- The queue must be empty before generation and after a successful run.

## Production cadence

| Decision | Locked value |
|---|---|
| Launch burst | 10 articles |
| Ongoing cadence | 1 article per day |
| Scheduled writer | Codex through Krista's ChatGPT subscription |
| Routine model | GPT-5.6 Luna |
| Reasoning | Low |
| Service tier | Standard |
| Scheduled publisher | `scripts/run-codex-daily.sh --live` |

The retired `scripts/daily-article-writer.sh` fails closed and cannot call Claude.

## Quality and deployment gates

Before a scheduled article can deploy:

1. ChatGPT subscription authentication must be active.
2. The repository and queue must be clean and empty.
3. Codex may edit only `data/blog/queue.json`.
4. The deterministic article validator must pass.
5. The citation guard must pass.
6. Every existing article hash must still match.
7. The production build must pass.
8. The queue must return to empty.
9. The guarded commit must push to `main`.
10. The homepage, an old article, and the new article must be crawlable as GPTBot.

## Rollback

The pre-cutover preservation tag is:

`pre-codex-kristamashore-ai-2026-07-23`

It points to the last production commit before the Codex publishing engine was added.
