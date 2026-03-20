---
name: web-scraping
description: Efficient web extraction for AI agents across static pages, JS-rendered sites, and anti-bot-protected targets. Use when web_fetch is blocked/incomplete, when page content is missing due to client-side rendering, or when structured extraction is needed. Favor low-context workflows: detect page type first, run the lowest-cost fetch tier that works, and extract only the fields needed.
---

# Web Scraping

Keep this skill lean: fetch only what is required for the task.

## Workflow (token-efficient)

1. Start with `web_fetch` for quick retrieval.
2. If blocked/incomplete, run `scripts/auto_scrape.py`.
3. Script checks `data/site_profiles.csv` for domain → preferred method first.
4. If preferred method fails, script escalates tiers and saves the winning method.
5. Extract only requested fields/content (avoid dumping full HTML unless asked).
6. Return concise findings with source URLs.

## Escalation rules

- Tier 0 (`urllib`): dependency-free HTTP fallback.
- Tier 1 (`curl_cffi`): default fast path when available.
- Tier 2 (`scrapling.DynamicFetcher`): use for JS-rendered/SPA pages.
- Tier 3 (`camoufox`): use for strong anti-bot challenges.
- If all tiers fail, prefer official API/endpoints if discoverable.

## Usage

```bash
python3 skills/web-scraping/scripts/auto_scrape.py "https://example.com" --json
```

Targeted extraction (avoid context bloat):

```bash
python3 skills/web-scraping/scripts/auto_scrape.py "https://example.com" --selector "article h2" --limit 10
```

## Defaults

- Prioritize “what a normal browser user sees.”
- Use sitemaps/RSS/hydration JSON when they are faster and equivalent.
- Do not include lengthy raw output unless explicitly requested.
- Keep per-page outputs compact and structured.
