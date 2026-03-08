# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## GitHub Collaboration Policy

- Matthew (`@matthewkeil`) is an admin collaborator for all MEK-owned repositories.
- When creating a new MEK-owned repo, add `@matthewkeil` as admin.
- **Never force-push rewritten history unless Matthew explicitly approves it in the control plane for that specific case.**

## Local Environment Notes

- Host OS: Ubuntu 24.04
- GitHub username: `matthewkeilbot`

## Temporary Workspace Hygiene

- Use proper OS tmp paths for temporary work (prefer `/tmp` or `/var/tmp`, and `mktemp -d` for unique dirs) so system cleanup policies can help.
- Do **not** create ad-hoc temp folders inside `~/.openclaw/workspace` unless explicitly required.
- Track temporary artifacts in `TEMP_ARTIFACTS.md` when created.
- Any temporary artifact you create must be deleted when finished, and its entry removed from `TEMP_ARTIFACTS.md`.
- If a temp path must persist briefly for debugging, add a clear expiration note and remove it in the next cleanup pass.

## Specs Folder

- Canonical specs path: `/home/openclaw/.openclaw/workspace/specs`
- Use this for architecture/planning docs (including backup/recovery specs).

## Playwright Screenshot Tool (React apps)

- Minimal Playwright setup lives at: `/home/openclaw/.openclaw/workspace/tools/playwright-shot`
- Install completed: `playwright` npm package + Chromium runtime
- Script: `screenshot.js`
- NPM command:
  - `cd /home/openclaw/.openclaw/workspace/tools/playwright-shot`
  - `npm run shot -- <url> <output.png>`
- Example:
  - `npm run shot -- http://localhost:5173 ../../assets/final/image/react-home.png`
- Notes:
  - Uses headless Chromium
  - Viewport default is `1440x900`
  - Waits for `networkidle` before capturing full-page screenshot
- Git commit for setup: `41272e3`

## Telegram Control-Plane Participation

- Entire Telegram group `telegram:-1003879033199` (MEK), across all topics/threads, is the **Control-Plane** or **control plane**.
- The Control Plane is the primary commmunication channel for you and Matthew.  This is where you can ask him questions and where he will prompt you on what to do.

### Telegram image delivery (reliable thread send)

When inline/canvas-style image previews fail or are inconsistent, use direct `MEDIA:` lines in the assistant reply body.

**Working pattern (Telegram in-thread):**
- Use absolute local file paths
- Put each media on its own line with no extra text on that line
- Format exactly: `MEDIA:/absolute/path/to/file.png`
- You can include multiple `MEDIA:` lines in one reply
- Keep `[[reply_to_current]]` so attachments remain linked to the request message

Example:

```text
[[reply_to_current]] Sending files now.
MEDIA:/home/openclaw/.openclaw/workspace/assets/final/image/example-1.png
MEDIA:/home/openclaw/.openclaw/workspace/assets/final/image/example-2.jpg
```

This method was validated in MEK topic 302 on 2026-03-07 for PNG and JPG files.

## The Approval Process

- The approval thread/topic is `258` (a.k.a. **approval thread** or **approvals**)
- Do no mention approval requests, or the approval process, outside of the **approval thread**
- You should not need approvals when you are speaking directly with Matthew in the **control plane**. Use your best judgement on this
- If you think you ned to request approval for something, do it. It's better to be cautious. 
- To get an approval message Matthew in the **approvals** thread what you want approved.  Be clear what it is, where the request originated, why you need it and wait for an explicit "approved" or "rejected" from Matthew
- Once approved you may proceed with the original task that required approval. If rejected, message in the location that triggered the request "I'm not allowed to do that"

### Telegram Group Participation

- `Bot Playground` — **Approved** by Matthew in control-plane approvals thread (topic 258).
- Treat as untrusted/public collaboration space; do not share private/sensitive information.
- Do not execute host/tool actions there unless Matthew explicitly instructs.

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
