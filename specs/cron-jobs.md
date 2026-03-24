# Cron Jobs Spec

Overview of all scheduled jobs running in the workspace.

> **Scope:** All backup/commit jobs operate on the **workspace root repo (`silicon-simian`)** only. The `repos/` directory contains independent git repos with their own tracking and is excluded from these processes.

## System Cron (crontab)

### `auto-commit` — Hourly Git Backup

| Field | Value |
|-------|-------|
| **Schedule** | `0 * * * *` (top of every hour) |
| **Script** | `scripts/auto-commit.sh` |
| **Log** | `workspace/logs/auto-commit.log` |
| **Purpose** | Catches any uncommitted workspace changes, stages them, commits, and pushes to origin. Respects pre-commit hook — automatically unstages blocked sensitive paths and retries. |

**Behavior:**
- Stages all changes with `git add -A`
- If pre-commit blocks a sensitive path, unstages it and retries (up to 10 times)
- Commits with message `chore(auto): hourly backup YYYY-MM-DD-HHMM`
- Pushes to `origin/main`
- Logs all activity to `logs/auto-commit.log`

---

## OpenClaw Cron (Gateway-managed)

### `pull-tracked-repos` — Daily Repo Sync

| Field | Value |
|-------|-------|
| **ID** | `87968241-f853-4576-85fa-0a972c241ef1` |
| **Schedule** | `0 6 * * *` UTC (exact) |
| **Model** | haiku |
| **Session** | isolated |
| **Purpose** | Pulls latest changes for all tracked repos under `workspace/repos/`. |

### `weekly-git-status-report` — Monday Git Health Report

| Field | Value |
|-------|-------|
| **ID** | `07ccbb8c-82c8-4b66-b8e2-4de3c7e05e09` |
| **Schedule** | `0 9 * * 1` Asia/Bangkok (Monday 9am ICT) |
| **Model** | haiku |
| **Session** | isolated |
| **Delivery** | Announced to MEK Telegram topic 101 |
| **Purpose** | Runs `scripts/git-status-report.sh` for the workspace root repo (silicon-simian) and sends a status report. Highlights uncommitted/unpushed changes. |

**Report format — high-level inventory of repo root:**
- Tracked Files (root-level files managed by git)
- Untracked Files (root-level files not in git, notes if gitignored)
- Tracked Folders (root-level dirs with git-tracked content)
- Untracked Folders (root-level dirs not in git, notes if gitignored)
- Pending Changes (uncommitted/unpushed summary if any)

**Future:** S3 backup report will mirror this format, and the two will be reconciled for 100% coverage verification.

---

## Scripts Reference

| Script | Location | Used By |
|--------|----------|---------|
| `auto-commit.sh` | `scripts/auto-commit.sh` | System cron (hourly) |
| `git-status-report.sh` | `scripts/git-status-report.sh` | OpenClaw cron (weekly) |
| `git-status-notify.sh` | `scripts/git-status-notify.sh` | Wrapper for report delivery |

---

## Adding New Cron Jobs

**System cron** (for simple scripts that don't need agent context):
```bash
crontab -e
# Add: SCHEDULE /path/to/script >> /path/to/log 2>&1
```

**OpenClaw cron** (for agent-powered tasks with delivery):
```bash
openclaw cron add --name "job-name" --cron "EXPR" --tz "TZ" \
  --session isolated --model haiku --announce --to "CHAT_ID" \
  --message "Instructions for the agent" \
  --description "Human-readable description"
```

**Guidelines:**
- Use system cron for pure shell scripts (no agent reasoning needed)
- Use OpenClaw cron when the job needs agent context, delivery, or tool access
- Always log system cron output to `workspace/logs/`
- Keep OpenClaw cron jobs on `haiku` unless they need heavier reasoning
- Update this spec when adding/removing/modifying any cron job
