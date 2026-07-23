# kristamashore.ai

Production article site for Krista Mashore's AI for Business authority content.

## Production

- URL: `https://kristamashore.ai`
- Published content: `data/blog/posts.json`
- Daily queue: `data/blog/queue.json`
- Cadence: one article per day
- Writer: Codex through Krista's ChatGPT subscription
- Routine model: GPT-5.6 Luna, low reasoning, standard service tier

## Safe daily publishing

```bash
scripts/run-codex-daily.sh --preflight
scripts/run-codex-daily.sh --canary
scripts/run-codex-daily.sh --live
```

The production runner permits Codex to edit only the queue. It then runs deterministic schema, voice, citation, slug, preservation, build, and live-crawlability gates before committing or pushing.

The old Claude writer at `scripts/daily-article-writer.sh` is retired and fails closed.

## Local development

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Main files

- `BUILD-DECISIONS.md`: operational source of truth
- `config/codex-article-context.md`: compact approved writing context
- `prompts/codex-daily-article-writer.md`: unattended writer instructions
- `scripts/run-codex-daily.sh`: guarded Codex publisher
- `scripts/check-codex-daily-article.cjs`: deterministic article validation
- `scripts/check-published-preservation.cjs`: existing-content hash guard
- `scripts/publish-batch.cjs`: queue-to-post merge
- `docs/AI-CONTENT-ROADMAP.md`: five-pillar topic guidance
