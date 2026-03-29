# OpenClaw Backup + State Recovery Plan

## Goal

Ensure full recoverability after host failure. Two lanes:
- **Lane A — Git:** Workspace files (public/non-sensitive) pushed to GitHub.
- **Lane B — S3:** Private/runtime state synced to a versioned S3 bucket.

A new OpenClaw instance should be able to clone the workspace repo, follow the README, pull state from S3, and be fully operational within minutes.

This spec is designed to be reusable. Any OpenClaw bot can clone the silicon-simian repo, adapt the registry and scripts, and have a working backup system without reinventing the wheel.

---

## Lane A — Workspace Git

- **Repo root:** `~/.openclaw/workspace`
- **Remote:** `origin -> git@github.com:matthewkeilbot/silicon-simian.git`
- **Branch:** `main`
- **Hooks:** Tracked in `.githooks/` (pre-commit blocker, post-commit auto-push).
- **Setup after clone:** `git config core.hooksPath .githooks`
- **Safety net:** Cron every 15 min runs `git push --porcelain` if branch is ahead.

---

## Lane B — S3 Sync

- **Bucket:** `s3://matthewkeilbot/`
- **Profile:** `matthewkeilbot` (AWS CLI)
- **Region:** `ap-southeast-1`
- **Versioning:** Enabled (S3 handles history/rollback natively)
- **Encryption:** None client-side; bucket is private, rely on S3 server-side encryption + IAM.
- **Lifecycle rule (active):** `expire-old-versions-365d` — non-current versions expire after 365 days, incomplete multipart uploads aborted after 7 days.

### S3 path structure

S3 paths **mirror local paths exactly** from `~/.openclaw/` as root. No prefix mapping, no translation. The S3 key for any file is its path relative to `~/.openclaw/`.

```
Local:  ~/.openclaw/credentials/aws.json
S3 key: credentials/aws.json

Local:  ~/.openclaw/workspace/MEMORY.md
S3 key: workspace/MEMORY.md

Local:  ~/.openclaw/openclaw.json
S3 key: openclaw.json
```

This means restore is trivial: download from S3 → write to `~/.openclaw/<key>`.

### Lifecycle rule (applied 2026-03-29)

```bash
aws --profile matthewkeilbot s3api put-bucket-lifecycle-configuration \
  --bucket matthewkeilbot \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "expire-old-versions-365d",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 365
      },
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }]
  }'
```

Verify: `aws --profile matthewkeilbot s3api get-bucket-lifecycle-configuration --bucket matthewkeilbot`

---

## Backup Registry

The backup registry is the single source of truth for what gets backed up where. It lives in S3 (not git) because it may contain sensitive path names.

**Location:** `s3://matthewkeilbot/backup-registry.json` (also kept locally at `~/.openclaw/backup-registry.json`)

### Three-state model

Every path is assigned one of three backup strategies:

| Value | Git | S3 | Meaning |
|---|---|---|---|
| `github` | tracked (not gitignored) | skipped by S3 sync | Git handles backup |
| `s3` | gitignored | synced to S3 | S3 handles backup |
| `ignored` | gitignored | skipped by S3 sync | Ephemeral, not backed up anywhere |

### Registry schema

```json
{
  "$schema": "backup-registry",
  "version": 1,
  "description": "Backup registry for ~/.openclaw/. Each entry maps a path (relative to ~/.openclaw/) to a backup strategy and optional pruning rule.",
  "updated": "2026-03-29T16:00:00Z",
  "entries": [
    {
      "path": "openclaw.json",
      "backup": "s3",
      "pruneMaxDays": null
    },
    {
      "path": "credentials",
      "backup": "s3",
      "pruneMaxDays": null
    },
    {
      "path": "workspace/skills",
      "backup": "github",
      "pruneMaxDays": null
    },
    {
      "path": "workspace/repos",
      "backup": "ignored",
      "pruneMaxDays": null
    },
    {
      "path": "cron/runs",
      "backup": "s3",
      "pruneMaxDays": 7
    }
  ]
}
```

### Entry fields

| Field | Type | Required | Description |
|---|---|---|---|
| `path` | string | ✅ | Path relative to `~/.openclaw/`. Can be a file or directory. |
| `backup` | `"github"` \| `"s3"` \| `"ignored"` | ✅ | Backup strategy. |
| `pruneMaxDays` | number \| null | ✅ | Max age in days for local pruning. `null` = never prune. |

### Inheritance rules

- Entries are matched **most-specific first**. A child path overrides its parent.
- If a path has no entry and no parent entry → it is **unknown** (see fail-safe behavior below).
- Files inherit from their containing directory's entry unless they have their own entry.

**Example:**
```
"workspace/memory"       → backup: "s3", pruneMaxDays: null
"workspace/memory/schema" → backup: "github"
"workspace/memory/daily"  → (no entry) → inherits "s3" from "workspace/memory"
```

### Fail-safe behavior

The sync script scans `~/.openclaw/` for all directories and files. Before syncing:

1. **Check the registry** for each path found on disk.
2. **Known path** (has entry or inherits from parent) → handle per its `backup` value.
3. **Unknown path** (no entry, no parent entry) → **sync to S3 anyway** using the mirrored path, AND write an escalation:
   - `"New path detected: <path>. Backed up to S3 at default location. Please add to backup-registry.json with correct strategy."`
4. Escalation is picked up by heartbeat and posted to MEK control plane.

**This ensures nothing is ever silently missed.** New folders are always backed up on first detection, and the operator gets notified to formalize the entry.

---

## S3 Artifacts Reference

These files live in S3 and are used by the backup/restore process. They are documented here so that any bot setting up from the silicon-simian repo knows what to expect in the bucket.

| S3 key | Local path | Purpose |
|---|---|---|
| `backup-registry.json` | `~/.openclaw/backup-registry.json` | Single source of truth for what gets backed up where. See schema above. |
| `workspace/repos.json` | `~/.openclaw/workspace/repos.json` | Manifest of git repos to clone on restore. Contains origin URLs, branches, and upstream remotes. |

### repos.json schema

```json
{
  "description": "Manifest of git repos for restore.",
  "updated": "2026-03-29T14:50:00Z",
  "repos": [
    {
      "name": "gstack",
      "origin": "git@github.com:matthewkeilbot/gstack.git",
      "branch": "main",
      "upstream": "https://github.com/garrytan/gstack.git"
    },
    {
      "name": "openclaw",
      "origin": "https://github.com/openclaw/openclaw.git",
      "branch": "main"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Directory name under `workspace/repos/`. |
| `origin` | string | ✅ | Git remote URL for `origin`. |
| `branch` | string | ✅ | Default branch to checkout. |
| `upstream` | string | ❌ | Git remote URL for `upstream` (forks that sync with an upstream). |

---

## Sync Script Design

### Principle

One script. No LLM involvement. Runs via cron. Deterministic.

### Algorithm

```
1. Load backup-registry.json
2. Scan ~/.openclaw/ for all files and directories
3. For each path found:
   a. Resolve backup strategy (own entry → parent entry → unknown)
   b. If "github" or "ignored" → skip
   c. If "s3" or unknown:
      - Compute local SHA-256 hash
      - Get S3 ChecksumSHA256 via head-object (if object exists)
      - If not in S3 → upload
      - If in S3 but hash differs → upload
      - If in S3 and hash matches → skip
   d. If unknown → also write escalation file
4. For each S3 object with no local counterpart:
   - Place a delete marker (aws s3api delete-object)
   - S3 versioning preserves all prior versions
5. Run local pruning per pruneMaxDays rules
6. Write JSONL run log
```

### Hash strategy — native S3 checksums

S3 natively supports SHA-256 checksums as a first-class feature (not custom metadata):

**Upload:**
```bash
aws s3api put-object \
  --bucket matthewkeilbot \
  --key credentials/foo.json \
  --body ~/.openclaw/credentials/foo.json \
  --checksum-algorithm SHA256
```
S3 computes SHA-256 server-side, validates against the uploaded data, and stores it.

**Check:**
```bash
aws s3api head-object \
  --bucket matthewkeilbot \
  --key credentials/foo.json \
  --checksum-mode ENABLED
```
Returns `ChecksumSHA256` (base64-encoded) in the response.

**Local computation:**
```bash
openssl dgst -sha256 -binary ~/.openclaw/credentials/foo.json | base64
```
Produces the exact same base64-encoded SHA-256 that S3 stores as `ChecksumSHA256`. Verified 2026-03-29 — apples-to-apples match confirmed.

**Comparison:** If local base64 SHA-256 matches `ChecksumSHA256` from head-object → skip. Otherwise → upload.

**Fallback:** If an object was uploaded without `--checksum-algorithm` (legacy/manual), head-object won't return `ChecksumSHA256`. Fall back to size comparison, then re-upload with checksum enabled so future syncs use native checksums.

### Large file handling

Files >100 MB are still uploaded normally but flagged in the JSONL run log under `large_files`. Reported in the daily digest.

### Parent orchestration script

A single parent script (`scripts/backup.sh`) that:
1. Runs git auto-commit + push (Lane A)
2. Runs S3 sync (Lane B) — reads registry, syncs, prunes, logs
3. Writes JSONL run log

Cron runs the parent script hourly.

---

## Restore Workflow

### From scratch (new host)

1. Install OpenClaw
2. Clone workspace repo: `git clone git@github.com:matthewkeilbot/silicon-simian.git ~/.openclaw/workspace`
3. Follow `README.md` in the repo (which documents next steps)
4. Install AWS CLI and configure profile `matthewkeilbot`
5. Run restore script: `scripts/restore.sh`
   - Downloads `backup-registry.json` from S3 → `~/.openclaw/backup-registry.json`
   - Walks all S3 objects, restores to `~/.openclaw/<key>`
   - Skips files that already match (hash check)
   - Downloads `workspace/repos.json`, clones all repos with correct remotes/upstreams
6. Set git hooks: `cd ~/.openclaw/workspace && git config core.hooksPath .githooks`
7. Verify with `openclaw status`

### Partial restore

- Restore specific paths: `scripts/restore.sh --path credentials/`
- Point-in-time: Use S3 console or `aws s3api list-object-versions` to retrieve prior versions

### README.md requirements

The workspace `README.md` must document:
- What this repo is and who it belongs to
- How to restore from S3 (AWS profile setup, restore script usage)
- How to set up git hooks
- Where to find the full spec (this file)
- What S3 artifacts exist and their purpose (backup-registry.json, repos.json)

This makes the repo self-documenting: a new bot (or a new host) can follow the README without prior context.

---

## Implementation Order

1. ✅ Existing: `.gitignore` configured
2. ✅ Existing: `.githooks/` with pre-commit + post-commit
3. ✅ Existing: `scripts/auto-commit.sh`
4. ✅ Applied: S3 lifecycle rule (`expire-old-versions-365d`)
5. ✅ Created: `repos.json` manifest (gitignored, S3-only)
6. Create `backup-registry.json` with full initial entries
7. Write `scripts/s3-sync.sh` — the core sync script (reads registry, hashes, uploads, delete markers, escalations)
8. Write `scripts/backup.sh` — parent orchestrator (git + S3 sync)
9. Write `scripts/restore.sh` — pull from S3 to local + clone repos from manifest
10. Update `README.md` with restore instructions and S3 artifact reference
11. Set up hourly cron via `openclaw cron`
12. Test: run backup, verify S3 contents, test restore to temp dir

---

## Resolved Decisions

- **Backup registry:** Single source of truth in `backup-registry.json` (S3 + local). Three-state model: `github`/`s3`/`ignored`. Inheritance from parent paths. Unknown paths backed up to S3 automatically with escalation.
- **S3 path structure:** Mirrors `~/.openclaw/` exactly. S3 key = path relative to `~/.openclaw/`. No prefix mapping.
- **Orphaned S3 objects:** When a file is deleted locally, the sync script places a delete marker on the S3 object. S3 versioning preserves all prior versions. Delete markers expire after 365 days via lifecycle rule.
- **Large file threshold:** 100 MB. Files above this are still uploaded but flagged in the run log and reported in daily digest.
- **Repo manifest:** `repos.json` maintained in workspace, synced to S3 (not git). Contains repo URLs, branches, and upstreams for restore.
- **S3 lifecycle rule:** Non-current versions expire after 365 days. Incomplete multipart uploads aborted after 7 days. Applied 2026-03-29.
- **Logging/reporting:** See `specs/daily-and-weekly-digest.md` for the full reporting pipeline. All backup scripts write JSONL logs. Daily + weekly digests aggregate and deliver to control plane.
- **Error escalation:** Critical errors (auth failures, 3 consecutive push failures, crashes with stack traces) write escalation marker files. Heartbeat picks them up and posts to MEK control plane. Stack traces captured verbatim.
- **Hash strategy:** Native S3 SHA-256 checksums (first-class feature, not custom metadata). Validated server-side on upload. Local `openssl dgst -sha256 -binary | base64` produces identical base64 output. Verified 2026-03-29.
- **Inbound media:** `ignored` — temp processing cache, originals live in source channels.
- **Workspace memory:** Never pruned locally — needed for QMD access.
- **Prune logging:** Not logged individually. S3 delete markers serve as the audit trail if ever needed.
- **Scripting language:** Bash for simple scripts; TypeScript if complexity grows. No Python.
- **Registry location:** S3 (not git) — may contain sensitive path names. Downloaded on restore as first step.
