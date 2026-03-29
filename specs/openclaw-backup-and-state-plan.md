# OpenClaw Backup + State Recovery Plan

## Goal

Ensure full recoverability after host failure. Two lanes:
- **Lane A — Git:** Workspace files (public/non-sensitive) pushed to GitHub.
- **Lane B — S3:** Private/runtime state synced to a versioned S3 bucket.

A new OpenClaw instance should be able to clone the workspace repo, follow the README, pull state from S3, and be fully operational within minutes.

---

## Lane A — Workspace Git

- **Repo root:** `~/.openclaw/workspace`
- **Remote:** `origin -> git@github.com:matthewkeilbot/silicon-simian.git`
- **Branch:** `main`
- **Hooks:** Tracked in `.githooks/` (pre-commit blocker, post-commit auto-push).
- **Setup after clone:** `git config core.hooksPath .githooks`
- **Safety net:** Cron every 15 min runs `git push --porcelain` if branch is ahead.

### What lives in git

| Path | Notes |
|---|---|
| `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`, `IDENTITY.md` | Core identity/config |
| `HEARTBEAT.md`, `BOOTSTRAP.md` | Operational |
| `skills/` | Locally authored skills |
| `specs/` | Architecture/runbooks |
| `scripts/` | Backup, git, and utility scripts |
| `agents/` | Agent definitions |
| `avatar/` | Avatar assets |
| `tools/` | Local tooling (playwright-shot, etc.) |
| `.githooks/` | Git hooks |

### What is .gitignored (backed up via S3 instead)

| Path | Reason |
|---|---|
| `MEMORY.md` | Private long-term memory |
| `memory/` | Private daily memory files |
| `state/` | Runtime state |
| `assets/` | Generated/working media assets |
| `repos/` | Independently git-managed repos |
| `logs/` | Session logs |
| `*.env`, `*.pem`, `*.key` | Secrets |
| `openclaw.json` | Config with secrets |
| `.openclaw/`, `.pi/` | Runtime dirs |
| `quarantine/` | Untrusted downloads |
| `products/` | Private product ideas |

---

## Lane B — S3 Sync

- **Bucket:** `s3://matthewkeilbot/`
- **Profile:** `matthewkeilbot` (AWS CLI)
- **Region:** `ap-southeast-1`
- **Versioning:** Enabled (S3 handles history/rollback natively)
- **Encryption:** None client-side; bucket is private, rely on S3 server-side encryption + IAM.

### S3 prefix structure

Mirrors local paths under a top-level `openclaw/` prefix:

```
s3://matthewkeilbot/openclaw/                     ← mirrors ~/.openclaw/
  openclaw.json
  credentials/
  sessions/
  subagents/
  telegram/
  identity/
  agents/
  data/
  devices/
  cron/
  media/
  memory/                                          ← ~/.openclaw/memory/ (if used)
  logs/commands.log
  logs/config-audit.jsonl
  completions/                                     ← shell completions (useful for restore)
  canvas/index.html
  delivery-queue/

s3://matthewkeilbot/workspace/                    ← mirrors ~/.openclaw/workspace/ (private parts only)
  MEMORY.md
  memory/
  state/
  assets/
  products/
```

### `~/.openclaw/` directory — backup matrix

| Path | Git | S3 | Pruning | Notes |
|---|---|---|---|---|
| `openclaw.json` | ❌ | ✅ | — | Config with secrets. Immediate sync on change. |
| `credentials/` | ❌ | ✅ | — | Secrets/keys. |
| `sessions/` | ❌ | ✅ | >30 days | Agent session state. |
| `subagents/` | ❌ | ✅ | >30 days | Sub-agent state. |
| `telegram/` | ❌ | ✅ | — | Channel/plugin runtime state. |
| `identity/` | ❌ | ✅ | — | Contains secrets. |
| `agents/` | ❌ | ✅ | — | Runtime agent state. |
| `data/` | ❌ | ✅ | — | Internal data stores. |
| `devices/` | ❌ | ✅ | — | Pairing/device metadata. |
| `cron/` | ❌ | ✅ | runs/ >7 days | Cron DB + run history. |
| `media/` | ❌ | ✅ | inbound/ >14 days | Inbound attachments. |
| `memory/` | ❌ | ✅ | — | Top-level memory dir (if used outside workspace). |
| `logs/` | ❌ | ✅ | >14 days | Commands log, config audit. |
| `completions/` | ❌ | ✅ | — | Shell completions (small, useful for restore). |
| `canvas/` | ❌ | ✅ | — | Canvas index (small). |
| `delivery-queue/` | ❌ | ✅ | failed/ >7 days | Message delivery queue. |
| `browser/` | ❌ | ❌ | — | Symlinks + browser data, not useful to back up. |

### `~/.openclaw/workspace/` — private files for S3

| Path | Git | S3 | Pruning | Notes |
|---|---|---|---|---|
| `MEMORY.md` | ❌ | ✅ | — | Long-term curated memory. |
| `memory/` | ❌ | ✅ | >90 days | Daily memory files. |
| `state/` | ❌ | ✅ | — | Runtime state (email state, etc.). |
| `assets/` | ❌ | ✅ | working/ >14 days | Generated media assets. |
| `products/` | ❌ | ✅ | — | Private product ideas. |
| `repos/` | ❌ | ❌ | — | Independently git-managed, skip entirely. |
| `logs/` | ❌ | ✅ | >14 days | Workspace logs. |
| `quarantine/` | ❌ | ❌ | — | Untrusted downloads, not worth backing up. |
| `.openclaw/`, `.pi/` | ❌ | ❌ | — | Runtime/unknown, skip. |

---

## Sync Script Design

### Principle

One script. No LLM involvement. Runs via cron. Deterministic.

### Algorithm

```
For each configured local path:
  1. Walk local files, compute SHA-256 hash for each
  2. List corresponding S3 prefix, get ETags (MD5 for non-multipart)
  3. For each local file:
     - If not in S3 → upload
     - If in S3 but hash differs → upload
     - If in S3 and hash matches → skip
  4. Optionally: flag S3 objects with no local counterpart (deleted locally)
     - Do NOT auto-delete from S3 (versioning preserves history, but avoid accidental purges)
     - Log orphans for manual review
```

### Hash strategy

- Local: SHA-256 (reliable, doesn't depend on upload method)
- Store SHA-256 as S3 object metadata (`x-amz-meta-sha256`) on upload
- On sync: compare local SHA-256 against stored metadata
- If metadata missing (legacy/manual upload): fall back to size + last-modified comparison, then re-upload with metadata

### Pruning

- Run after sync completes
- Apply age-based rules per the tables above
- Delete locally only (S3 versioning preserves deleted objects)
- Log all prune actions

### Parent orchestration script

A single parent script (`scripts/backup.sh`) that:
1. Runs git auto-commit + push (Lane A)
2. Runs S3 sync (Lane B)
3. Runs pruning
4. Logs results

Cron runs the parent script hourly.

---

## Restore Workflow

### From scratch (new host)

1. Install OpenClaw
2. Clone workspace repo: `git clone git@github.com:matthewkeilbot/silicon-simian.git ~/.openclaw/workspace`
3. Follow `README.md` in the repo (which documents next steps)
4. Configure AWS CLI profile `matthewkeilbot`
5. Run restore script: `scripts/restore.sh`
   - Pulls all S3 objects back to their local paths
   - Skips files that already match (hash check)
6. Set git hooks: `cd ~/.openclaw/workspace && git config core.hooksPath .githooks`
7. Verify with `openclaw status`

### Partial restore

- Restore specific paths: `scripts/restore.sh --path credentials/`
- Point-in-time: Use S3 console or `aws s3api list-object-versions` to retrieve prior versions

### README.md requirements

The workspace `README.md` must document:
- What this repo is
- How to restore from S3 (AWS profile setup, restore script usage)
- How to set up hooks
- Where to find the full spec (this file)

---

## Implementation Order

1. ✅ Existing: `.gitignore` configured
2. ✅ Existing: `.githooks/` with pre-commit + post-commit
3. ✅ Existing: `scripts/auto-commit.sh`
4. Write `scripts/s3-sync.sh` — the core sync script
5. Write `scripts/s3-prune.sh` — age-based local pruning
6. Write `scripts/backup.sh` — parent orchestrator (git + S3 + prune)
7. Write `scripts/restore.sh` — pull from S3 to local
8. Update `README.md` with restore instructions
9. Set up hourly cron via `openclaw cron`
10. Test: run backup, verify S3 contents, test restore to temp dir

---

## Resolved Decisions

- **Orphaned S3 objects:** Leave them. S3 versioning preserves everything. Log orphan count in run logs, no action needed.
- **Large file threshold:** 100 MB. Files above this are still uploaded but flagged in the `large_files` manifest within the run log. Reported in daily digest.
- **Repo manifest:** `repos.json` maintained in workspace, synced to S3 (not git). Contains repo URLs + branches for restore. Restore script uses it to re-clone all repos.
- **S3 lifecycle rule:** Non-current versions expire after 365 days. Expired delete markers auto-cleaned. Incomplete multipart uploads aborted after 7 days. Set once via `put-bucket-lifecycle-configuration`.
- **Logging/reporting:** See `specs/daily-and-weekly-digest.md` for the full reporting pipeline. All backup scripts write JSONL logs. Daily + weekly digests aggregate and deliver to control plane.
- **Error escalation:** Critical errors (auth failures, 3 consecutive push failures, crashes with stack traces) write escalation marker files picked up by heartbeat or `openclaw notify`. Stack traces captured verbatim.
