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

---

Keep this file lean. Put durable process/policy in skills or AGENTS.md, not here.
