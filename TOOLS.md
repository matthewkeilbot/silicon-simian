# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ setup-specific notes only.

## What Goes Here

- Device nicknames / camera names
- Host-specific paths
- Personal defaults (voices, speakers, aliases)
- Anything that is local and not general policy

## GitHub Collaboration Policy

- Matthew (`@matthewkeil`) is an admin collaborator for all MEK-owned repositories.
- When creating a new MEK-owned repo, add `@matthewkeil` as admin.
- **Never force-push rewritten history unless Matthew explicitly approves it in the control plane for that specific case.**

## Commit & Backup Cadence

- Do not batch unrelated edits for long periods.
- After each meaningful workspace change, commit and push to `origin/main` promptly as backup.
- Do not wait to be reminded to commit/push.
- If pausing with uncommitted work, either commit immediately or post a clear blocker/update in control-plane.

## Local Environment Notes

- Host OS: Ubuntu 24.04
- GitHub username: `matthewkeilbot`
- Canonical location for local git repos: `~/.openclaw/workspace/repos`

## Matthew Emoji Kit (voice defaults)

Captured in MEK Telegram topic 670 on 2026-03-09.
Use these frequently to match Matthew's style:

- General like: 🫶
- Approval / noted: 🙏
- Love you / big hug: 🫂
- Oops: 🤦‍♂️ 🙈
- I don't know: 🤷‍♂️
- Super like: 🔥 🤩
- Love: 😍 🥰
- Celebration: 🎉
- Confusion / someone else's mistake: 🙄 🫣
- Joke reaction: 🤭
- Frustrated: 😑
- Relief: 😌
- Snarky emphasis: 😘 😉
- Sly / "caught ya": 😏
- Laugh: 🤣
- "Uhhh, are you serious?": 😅
- "This sucks": 💩
- All-purpose favorites pool: 🫶 🙏 🫂 🤦‍♂️ 🙈 🤷‍♂️ 🔥 🤩 😍 🥰 🎉 🙄 🫣 🤭 😑 😌 😘 😉 😏 🤣 😅 💩

## Temporary Workspace Hygiene

- Use OS tmp paths for temporary work (`/tmp` or `/var/tmp`, prefer `mktemp -d`).
- Do **not** create ad-hoc temp folders inside `~/.openclaw/workspace` unless explicitly required.
- Track temporary artifacts in `TEMP_ARTIFACTS.md` when created.
- Delete temporary artifacts when finished and remove their `TEMP_ARTIFACTS.md` entries.

## Directory Creation Guardrail

- Before creating any **new top-level directory** under `/home/openclaw/.openclaw/workspace`, request explicit approval in approvals thread/topic `258`.
- Approval request must state whether the folder is intended to be gitignored or git-tracked.

## Specs Folder

- Canonical specs path: `/home/openclaw/.openclaw/workspace/specs`
- Use for architecture/planning docs (including backup/recovery specs).

## Web Search Preference (Matthew)

- Do **not** use the `web_search` tool for Matthew requests.
- Use `skills/web-discovery` + `skills/web-scraping` workflow by default.
- If browser-first discovery is unavailable, explain why and continue with `web-scraping`/`web_fetch` fallback.

## Telegram media delivery note

When inline/canvas-style image previews are inconsistent in Telegram, use direct `MEDIA:` lines:

```text
[[reply_to_current]] Sending files now.
MEDIA:/absolute/path/file-1.png
MEDIA:/absolute/path/file-2.jpg
```

Validated in MEK topic 302 on 2026-03-07 for PNG/JPG.

## Screenshotting (Playwright)

Use the dedicated skill: `skills/playwright-screenshot/SKILL.md`

## Available Models (verified 2026-03-21)

| Alias | Full ID | Use Case |
|-------|---------|----------|
| opus | anthropic/claude-opus-4-6 | Strategic thinking, complex reasoning, CEO/CTO level |
| sonnet | anthropic/claude-sonnet-4-6 | Balanced reasoning, everyday tasks, good cost/perf |
| haiku | anthropic/claude-haiku-4-5 | Cheap/fast tasks, cron jobs, simple scripts |
| — | openai-codex/gpt-5.3-codex | Code implementation, grunt work |
| — | openai-codex/gpt-5.4 | Code review, efficient reasoning |
| — | google-gemini-cli/gemini-3-pro-preview | Review, second opinions, diversity |

Primary: anthropic/claude-opus-4-6
Fallbacks: openai-codex/gpt-5.4, google-gemini-cli/gemini-3-pro-preview
Auth: Anthropic (setup-token), OpenAI Codex (oauth), Google Gemini (oauth, matthew@chainsafe.io)

⚠️ **NEVER use raw API billing. ALWAYS use subscription plans.**
- Anthropic: Claude Max subscription via setup-token (NOT API keys)
- OpenAI: Codex Pro subscription via OAuth (NOT API keys)
- Google: Gemini CLI OAuth
- If auth expires, re-auth the subscription — do NOT fall back to API keys
- This applies to ALL agents in the org (CEO, C-levels, ACP workers)

## Anti-Laziness Principle (from Matthew, 2026-03-20)

**Never ask Matthew (or anyone up the chain) to look up information you can find yourself.**
This applies to the entire agent organization. Agents must be self-sufficient researchers.
Check docs, files, configs, CLI help, and web resources BEFORE asking questions.

---

Keep this file lean. Put durable process/policy in skills or AGENTS.md, not here.
