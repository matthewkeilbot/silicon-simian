# OpenClaw Backup + State Recovery Plan (Updated)

## Goal
Restore state quickly after host failure while keeping private memory/conversation data out of git and encrypted at rest in backups.

---

## Final architecture

### Lane A — **Workspace Git (primary, immediate push)**
- Git repo root: `~/.openclaw/workspace`
- Commit directly in-place (no rsync mirror).
- Auto-push immediately after each commit using tracked hooks in `.githooks/`.
- Canonical branch: `main`
- Remote: `origin -> git@github.com:matthewkeilbot/silicon-simian.git`
- `~/.openclaw/workspace/repos/*` remains independently git-managed.

### Lane B — **Encrypted private-state backups**
- Use `restic` to Google Drive (preferred) or S3, always client-side encrypted.
- Back up private/runtime OpenClaw state that must never be pushed to git.

---

## Scope and sensitivity policy

### Track in workspace git (safe, useful)
- `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`, `IDENTITY.md`, `HEARTBEAT.md`
- `skills/` (locally authored skills)
- `specs/` (runbooks/architecture)
- scripts/tooling/docs that are non-sensitive

Note: **No derivative of `openclaw.json` is stored in git** (including sanitized templates).

### Never track in git
- `MEMORY.md`
- `memory/**`
- any secrets (`*.env`, tokens, keys, creds)
- private research/journal content
- large/generated temp artifacts as needed

Enforcement layers:
1. `.gitignore` (convenience)
2. pre-commit blocker (hard stop for sensitive paths/patterns)
3. secret scanner in hook/CI (required for this workflow)

---

## `~/.openclaw` folder plan (git vs backup)

| Path | Git | Encrypted backup | Notes |
|---|---:|---:|---|
| `workspace/` | **Selective** | **Yes** (private parts) | Primary authored state in git; private docs still backup-only. |
| `openclaw.json` | No (raw) | Yes | Backup-only. Never store raw or sanitized derivatives in git. |
| `credentials/` | No | Yes | Secrets only. |
| `sessions/` | No | Yes | Private continuity. |
| `subagents/` | No | Yes | Private continuity. |
| `telegram/` | No | Yes | Channel/plugin runtime state. |
| `identity/` | No | Yes | Treat as sensitive (contains secrets). |
| `agents/` | No | Yes | Runtime state; useful for restore. |
| `data/` | No | Yes | Runtime/internal stores. |
| `devices/` | No | Yes | Pairing/metadata. |
| `cron/` | No (runtime DB) | Yes | Export declarative cron spec into `workspace/specs/cron/` for git. |
| `media/` | No | Optional | Include if attachment continuity required. |
| `logs/`, `completions/`, `canvas/`, `delivery-queue/`, `update-check.json` | No | Optional/No | Mostly ephemeral/debug. |

---

## `openclaw.json` handling (authoritative)

- `~/.openclaw/openclaw.json` and any derivative (including sanitized templates) are **backup-only artifacts**.
- They are stored in encrypted backups (Google Drive or S3 via restic), not in git.
- Any change to `openclaw.json` should trigger an immediate encrypted backup run.
- Access to config contents for troubleshooting happens locally only; never commit/push.

## Setup (required on clone/reclone)

`core.hooksPath` is stored in local git config (`.git/config`) and is **not tracked** in commits.
After cloning (or restoring) the workspace repo, run this once:

```bash
cd ~/.openclaw/workspace
git config core.hooksPath .githooks
git config --get core.hooksPath   # should print: .githooks
```

Without this setup, tracked hooks exist in `.githooks/` but will not execute.

## Git hooks + immediate push behavior (persisted in repo)

Use tracked hooks in the workspace repo so behavior is versioned:

- Hook directory (tracked): `~/.openclaw/workspace/.githooks/`
  - `pre-commit`: blocks sensitive paths/patterns; optional `gitleaks` check.
  - `post-commit`: verifies GitHub repo is private, then `git push` immediately.
- Repo setting (local git config): `core.hooksPath=.githooks`

If push fails:
- commit remains local;
- notify control-plane;
- retry via periodic job.

Recommended helper cron (safety net): every 15 minutes run `git push --porcelain` if branch is ahead.

---

## Encrypted backup plan (restic)

### Backend choice
- Start: Google Drive + restic encryption (via rclone backend).
- Optional later: migrate to S3/R2 backend with same restic workflow.

### Backup sets
- **Hourly (critical):** `credentials`, `openclaw.json`, `sessions`, `subagents`, `telegram`, `identity`, private workspace memory files.
- **Daily (broader):** `agents`, `data`, `devices`, optional `media`.
- **Weekly (archive/checkpoint):** full `.openclaw` minus explicitly ephemeral paths.

### Retention
- Hourly: 48h
- Daily: 30d
- Weekly: 12w
- Monthly: 12m

### Verification
- Daily: snapshot freshness check
- Weekly: partial data check (`restic check --read-data-subset=5%`)
- Monthly: restore drill + grep validation

---

---

## Implementation order

1. Tighten `workspace/.gitignore`.
2. Add tracked hooks under `workspace/.githooks/` (pre-commit + post-commit).
3. Set `git config core.hooksPath .githooks` in workspace repo.
4. Add retry cron for failed pushes.
5. Configure restic encrypted backups + retention (including immediate backup trigger on `openclaw.json` changes).
