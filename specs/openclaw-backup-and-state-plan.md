# OpenClaw Backup + State Recovery Plan

## Goal

Ensure full recoverability after host failure. Two lanes:
- **Lane A — Git:** Workspace files (public/non-sensitive) pushed to GitHub.
- **Lane B — S3:** Private/runtime state synced to a versioned S3 bucket.

A new OpenClaw instance should be able to clone the workspace repo, follow the README, pull state from S3, and be fully operational within minutes.

This spec is designed to be reusable. Bot-specific configuration (bucket name, AWS profile, repo URLs) lives in `README.md`, not here. The patterns and scripts are generic.

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

### S3 namespace

Each bot uses a **bot-specific prefix** in the bucket to avoid collisions if multiple bots share an AWS account/bucket. The prefix is configured in the sync script config (not hardcoded in this spec).

Example for this bot:
```
s3://matthewkeilbot/<bot-prefix>/credentials/aws.json
```

Within the prefix, S3 paths **mirror local paths exactly** from `~/.openclaw/` as root. No additional mapping or translation.

```
Local:  ~/.openclaw/credentials/aws.json
S3 key: <bot-prefix>/credentials/aws.json

Local:  ~/.openclaw/workspace/MEMORY.md
S3 key: <bot-prefix>/workspace/MEMORY.md

Local:  ~/.openclaw/openclaw.json
S3 key: <bot-prefix>/openclaw.json
```

Restore is trivial: strip the prefix, write to `~/.openclaw/<remainder>`.

Bot-specific prefix configuration is documented in `README.md`.

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

---

## Backup Registry

The backup registry is the single source of truth for what gets backed up where. The **local copy is always authoritative**. The S3 copy is just a backup — used only during restore.

**Location:** Local at `~/.openclaw/backup-registry.json`, backed up to S3.

### Three-state model (+transient unknown)

Every path is assigned one of three backup strategies, plus a transient fourth state:

| Value | Git | S3 | Meaning |
|---|---|---|---|
| `github` | tracked (not gitignored) | skipped by S3 sync | Git handles backup. |
| `s3` | gitignored | synced to S3 | S3 handles backup. |
| `ignored` | gitignored | skipped by S3 sync | Ephemeral, not backed up anywhere. |

The `unknown` state is **never persisted in the registry**. When a new path is discovered:
1. The sync script resolves the effective rule by walking up parent paths at runtime.
2. Backs up the new path using the parent's rule (or root default: `s3`).
3. Writes an escalation file with the new path, inherited parent path, and the rule being applied.
4. The escalation persists until someone adds a proper entry to the registry.
5. On subsequent runs, the same inheritance resolution happens until a formal entry exists.

### Root default rule

If inheritance walks all the way to root with no match, the default is:
- `backup: "s3"`, `pruneMaxDays: null`

This ensures unknown paths are always backed up, never pruned, and always escalated.

### Registry schema

The registry is a map where each key is a path (relative to `~/.openclaw/`) and each value is the config for that path. This allows O(1) lookup by path during directory walking.

```json
{
  "$schema": "backup-registry",
  "version": 1,
  "updated": "2026-03-29T17:30:00Z",
  "entries": {
    "openclaw.json": {
      "backup": "s3",
      "pruneMaxDays": null
    },
    "credentials": {
      "backup": "s3",
      "pruneMaxDays": null
    },
    "workspace/AGENTS.md": {
      "backup": "github",
      "pruneMaxDays": null
    },
    "workspace/MEMORY.md": {
      "backup": "s3",
      "pruneMaxDays": null
    },
    "workspace/skills": {
      "backup": "github",
      "pruneMaxDays": null
    },
    "workspace/repos": {
      "backup": "ignored",
      "pruneMaxDays": null
    },
    "cron/runs": {
      "backup": "s3",
      "pruneMaxDays": 7
    }
  }
}
```

### Entry fields

| Field | Type | Required | Description |
|---|---|---|---|
| `backup` | `"github"` \| `"s3"` \| `"ignored"` | ✅ | Backup strategy. |
| `pruneMaxDays` | number \| null | ✅ | Max age in days for local file pruning based on mtime. `null` = never prune. |

### Path resolution rules

1. **O(1) exact match** — look up the full path in the registry map.
2. **Parent walk** — if no match, walk up path segments until a match or root.
3. **Root default** — if no parent matches, use `s3` with no pruning.
4. **Escalation** — any path resolved via inheritance (no own entry) triggers an escalation on every run until a formal entry is added.

### What gets entries

- **Directories:** Auto-detected. New directories trigger escalation + inheritance.
- **Root-level files** (`~/.openclaw/*` and `~/.openclaw/workspace/*`): Must have explicit entries. New root-level files also trigger escalation with default `s3` rule.
- **Files inside subdirectories:** Inherit from their parent directory entry. No explicit entries needed.

### Root-level files requiring explicit entries

These files live at the root of `~/.openclaw/` or `~/.openclaw/workspace/` and must each have a registry entry:

**`~/.openclaw/` root:**

| File | Backup | Notes |
|---|---|---|
| `openclaw.json` | `s3` | Config with secrets. |
| `backup-registry.json` | `s3` | This file. Always synced. |

**`~/.openclaw/workspace/` root:**

| File | Backup | Notes |
|---|---|---|
| `AGENTS.md` | `github` | Core identity/config. |
| `SOUL.md` | `github` | Personality. |
| `USER.md` | `github` | Human info. |
| `TOOLS.md` | `github` | Local notes. |
| `IDENTITY.md` | `github` | Bot identity. |
| `HEARTBEAT.md` | `github` | Heartbeat config. |
| `BOOTSTRAP.md` | `github` | Bootstrap config. |
| `MEMORY.md` | `s3` | Private long-term memory. Never prune. |
| `repos.json` | `s3` | Repo manifest. |

New files appearing at either root level are detected, backed up to S3 (root default), and escalated.

---

## S3 Artifacts Reference

These files live in S3 and are used by the backup/restore process. Documented here so any bot setting up from the silicon-simian repo knows what to expect.

| S3 key (under bot prefix) | Local path | Purpose |
|---|---|---|
| `backup-registry.json` | `~/.openclaw/backup-registry.json` | Source of truth for backup routing. Local copy is authoritative. |
| `workspace/repos.json` | `~/.openclaw/workspace/repos.json` | Manifest of git repos to clone on restore. |

### repos.json schema

**Location:** `~/.openclaw/workspace/repos.json` (gitignored, synced to S3)

```json
{
  "description": "Manifest of git repos for restore.",
  "updated": "2026-03-29T16:45:00Z",
  "repos": [
    {
      "folderName": "gstack",
      "origin": "git@github.com:matthewkeilbot/gstack.git",
      "branch": "main",
      "upstream": "https://github.com/garrytan/gstack.git"
    },
    {
      "folderName": "openclaw",
      "origin": "https://github.com/openclaw/openclaw.git",
      "branch": "main"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `folderName` | string | ✅ | Directory name under `workspace/repos/`. |
| `origin` | string | ✅ | Git remote URL for `origin`. |
| `branch` | string | ✅ | Default branch to checkout. |
| `upstream` | string | ❌ | Git remote URL for `upstream` (forks that sync). |

---

## Scan Boundaries

The sync script walks `~/.openclaw/` recursively. The following are **always excluded** from scanning, regardless of registry entries:

| Exclusion | Reason |
|---|---|
| `.git/` directories | Managed by git, not file-level backup. |
| `node_modules/` | Dependency registry caches. Regenerated via `npm install`. |
| `__pycache__/`, `.venv/`, `venv/` | Python caches/environments. Regenerated. |
| `.cache/` | Generic caches. Regenerated. |
| Sockets, pipes, device files | Not regular files. Cannot be backed up. |
| Symlinks | Stored as-is (not dereferenced). If a symlink's target path is not backed up, an escalation is written noting the dangling reference. No default backup of the target — there's likely a reason it's excluded. |

---

## Sync Script Design

### Principle

One TypeScript script. No LLM involvement. Runs via cron. Deterministic.

### Technology

- **Language:** TypeScript (executed via `npx tsx`)
- **AWS SDK:** `@aws-sdk/client-s3` (typed, built-in retries, proper error handling)
- **Hashing:** Node.js `crypto.createHash('sha256')` with file streaming
- **Logging:** JSONL output via `JSON.stringify` per line

### Two-phase algorithm

The sync runs in two phases. Phase 2 (deletions) only executes if Phase 1 (uploads) completes fully.

#### Phase 1 — Upload (best effort, track failures)

```
1. Load backup-registry.json (local copy — authoritative)
2. Scan ~/.openclaw/ for all files and directories (respecting scan boundaries)
3. Track all local paths seen during scan + any directories with read errors
4. For each path found:
   a. Resolve backup strategy (exact match → parent walk → root default)
   b. If "github" or "ignored" → skip
   c. If "s3" (own entry or inherited):
      - Compute local SHA-256 (Node crypto stream)
      - HeadObject with ChecksumMode: ENABLED
      - If not in S3 → PutObject with ChecksumAlgorithm: SHA256
      - If in S3 and no ChecksumSHA256 returned → always re-upload with ChecksumAlgorithm: SHA256
      - If in S3 and hash differs → PutObject with ChecksumAlgorithm: SHA256
      - If in S3 and hash matches → skip
   d. If resolved via inheritance (no own entry) → also write escalation
5. If a file upload fails → log the error, continue with remaining files.
   Track failures. Any failure blocks Phase 2 (deletions) but not remaining uploads.
```

#### Phase 2 — Delete markers (only if Phase 1 had zero failures)

```
1. If Phase 1 had ANY upload failures or read errors → skip Phase 2 entirely
2. List all S3 objects under the bot prefix
3. Compare against local paths seen in Phase 1
4. Safety checks before ANY delete markers:
   a. Minimum file count: if local scan found <90% of S3 object count → 
      abort deletions + escalate "possible scan failure"
   b. Deletion ratio cap: if >10% of S3 objects would be deleted in this run → 
      abort deletions + escalate "abnormal deletion volume"
   c. Read error exclusion: any S3 prefixes corresponding to directories that 
      had read errors in Phase 1 → exclude from deletion entirely
5. If all safety checks pass → place delete markers (DeleteObject) for orphaned S3 objects
```

#### Phase 3 — Local pruning (only if Phase 1 had zero failures)

```
1. For each registry entry with pruneMaxDays set:
   - Find local files with mtime older than pruneMaxDays
   - Only prune files that were successfully synced to S3 in this or a prior run
     (file must exist in S3 with matching checksum)
   - Delete local file
2. Log pruned files in run log
```

#### Phase 4 — Finalize

```
1. Write JSONL run log
2. If registry needs updating (modified locally) → it will be synced to S3 on next run
   (registry is just another file in the backup set)
```

### Hash strategy — native S3 checksums

S3 natively supports SHA-256 checksums as a first-class feature:

**Upload (TypeScript):**
```typescript
import { PutObjectCommand } from '@aws-sdk/client-s3';
await s3.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: `${BOT_PREFIX}/${relativePath}`,
  Body: fileStream,
  ChecksumAlgorithm: 'SHA256'
}));
```

**Check (TypeScript):**
```typescript
import { HeadObjectCommand } from '@aws-sdk/client-s3';
const head = await s3.send(new HeadObjectCommand({
  Bucket: BUCKET,
  Key: `${BOT_PREFIX}/${relativePath}`,
  ChecksumMode: 'ENABLED'
}));
// head.ChecksumSHA256 → base64-encoded SHA-256
```

**Local computation (TypeScript):**
```typescript
import { createHash } from 'crypto';
import { createReadStream } from 'fs';

function computeSHA256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('base64')));
    stream.on('error', reject);
  });
}
```

Produces identical base64-encoded SHA-256 to what S3 stores. Verified 2026-03-29.

**No fallback needed:** If an S3 object was uploaded without a checksum, the sync script always re-uploads it with `ChecksumAlgorithm: SHA256`. This self-heals legacy objects over time.

### Log format

The sync script writes JSONL logs to `~/.openclaw/workspace/logs/backup/`. One file per run.

**Filename:** `s3-sync-YYYY-MM-DD-HHMM.jsonl`

**Per-run entry:**
```json
{
  "process": "s3-sync",
  "timestamp": "2026-03-29T14:00:00Z",
  "duration_sec": 12,
  "status": "success",
  "metrics": {
    "files_scanned": 142,
    "files_uploaded": 3,
    "files_skipped": 139,
    "files_pruned": 2,
    "bytes_uploaded": 28400,
    "large_files_flagged": 0,
    "read_errors": 0,
    "escalations_written": 0
  },
  "errors": [],
  "warnings": [],
  "large_files": [],
  "deletions_skipped_reason": null
}
```

**Error entry (within `errors` array):**
```json
{
  "file": "credentials/aws.json",
  "error": "AccessDenied",
  "message": "Upload failed: 403 Forbidden",
  "stack": "full stderr / stack trace verbatim",
  "retries": 3,
  "resolved": false
}
```

### Log retention

| Log type | Local retention | S3 retention |
|---|---|---|
| Per-run logs (`logs/backup/`) | 7 days | Versioned (12 months via lifecycle) |

Per-run logs are kept locally for 7 days for debugging, then pruned. They're synced to S3 before pruning (Phase 1 runs before Phase 3).

### Large file handling

Files >100 MB are uploaded normally but flagged in the run log `large_files` array and reported in the daily digest. This is informational — no behavioral change, but the operator should know when unusually large files are being backed up.

### Escalation triggers

| Condition | Action |
|---|---|
| S3 auth failure (403/401) after retries | Write escalation file |
| 3+ consecutive run failures | Write escalation file |
| Script crash with stack trace | Write escalation file |
| New path discovered (no registry entry) | Write escalation file |
| Symlink target not in backup set | Write escalation file |
| Phase 2 safety check tripped | Write escalation file |

Escalation files written to `~/.openclaw/workspace/logs/escalations/`. Heartbeat picks them up (≤30 min latency) and posts to MEK control plane.

### Parent orchestration script

A thin bash script (`scripts/backup.sh`) that:
1. Runs `scripts/auto-commit.sh` (git auto-commit + push — Lane A)
2. Runs `npx tsx scripts/s3-sync.ts` (S3 sync — Lane B)

Cron runs the parent script hourly.

---

## Restore Workflow

### From scratch (new host)

1. Install OpenClaw
2. Clone workspace repo: `git clone git@github.com:matthewkeilbot/silicon-simian.git ~/.openclaw/workspace`
3. Follow `README.md` in the repo (which documents next steps, including bot prefix)
4. Install AWS CLI and configure profile
5. Run restore script: `scripts/restore.sh`
   - Pure bash + `aws s3api` — no Node.js/npm required
   - Downloads `backup-registry.json` from S3
   - Lists all S3 objects under the bot prefix
   - Downloads each to `~/.openclaw/<path>` (overwrites local)
   - No hash checking — restore is a full overwrite by default, `--no-clobber` flag skips existing files
6. Run repo restore: `scripts/restore-repos.sh`
   - Reads `workspace/repos.json`
   - For each repo: if directory exists → skip. If not → clone with correct remotes.
   - Sets upstream remote if specified.
7. Install Node.js, then `cd ~/.openclaw/workspace && npm install` (for ongoing TS sync scripts)
8. Set git hooks: `cd ~/.openclaw/workspace && git config core.hooksPath .githooks`
9. Verify with `openclaw status`

### Partial restore

- Restore specific paths: `scripts/restore.sh --path credentials/`

### Point-in-time restore

- Use S3 console or `aws s3api list-object-versions` to retrieve prior versions

### Repo restore behavior

| Scenario | Action |
|---|---|
| Target directory doesn't exist | Clone from `origin`, checkout `branch`, add `upstream` remote if specified |
| Target directory exists and is a git repo | Skip (assume already restored or manually managed) |
| Target directory exists but is NOT a git repo | Skip + log warning |
| Auth failure during clone | Log error, continue with remaining repos |
| Branch doesn't exist on remote | Clone default branch, log warning |

### README.md requirements

The workspace `README.md` must document:
- What this repo is and who it belongs to
- Bot-specific configuration: bucket name, AWS profile, bot prefix, region
- Prerequisites (Node.js, AWS CLI, OpenClaw)
- How to restore from S3 (profile setup, restore script usage)
- How to set up git hooks
- What S3 artifacts exist and their purpose
- How to adapt this for a new bot (change prefix, create registry, etc.)

---

## Implementation Order

1. ✅ Existing: `.gitignore` configured
2. ✅ Existing: `.githooks/` with pre-commit + post-commit
3. ✅ Existing: `scripts/auto-commit.sh`
4. ✅ Applied: S3 lifecycle rule (`expire-old-versions-365d`)
5. ✅ Created: `workspace/repos.json` manifest (gitignored, synced to S3)
6. Create initial `backup-registry.json` with all current paths mapped
7. Add `package.json` + `tsconfig.json` for TypeScript scripts (if not existing)
8. Write `scripts/s3-sync.ts` — two-phase sync with safety gates
9. Write `scripts/backup.sh` — thin bash orchestrator
10. Write `scripts/restore.sh` — pure bash S3 restore
11. Write `scripts/restore-repos.sh` — repo cloning from manifest
12. Update `README.md` with restore instructions, bot-specific config, S3 artifact reference
13. Set up hourly cron via `openclaw cron`
14. Test: run backup, verify S3 contents, test restore to temp dir

---

## Resolved Decisions

- **Backup registry:** Local copy is authoritative. S3 copy is just a backup. Three-state model (`github`/`s3`/`ignored`) with runtime-only inheritance for unknown paths. Map-based schema for O(1) lookup.
- **Unknown paths:** Resolved at runtime via parent walk, never persisted as `unknown`. Escalation written on every run until formal entry added. Root default: `s3`, no pruning.
- **S3 path structure:** Bot-specific prefix + mirror of `~/.openclaw/`. Prefix configured per bot in README.md.
- **Two-phase sync:** Phase 1 (uploads) is best-effort — continues on individual failures but tracks them. Phase 2 (delete markers) only runs if Phase 1 had zero failures. Safety checks: minimum file count (90%), deletion ratio cap (10%), read-error prefix exclusion.
- **Pruning safety:** Local files only pruned after confirming they exist in S3 with matching checksum. Pruning uses mtime for age calculation.
- **No checksum fallback:** Objects without checksums are always re-uploaded with `ChecksumAlgorithm: SHA256`. Self-heals over time.
- **Delete markers:** Placed only after successful full upload pass + safety checks. S3 versioning preserves all prior versions. Delete markers expire after 365 days via lifecycle rule.
- **Large file threshold:** 100 MB. Informational flagging in run log and daily digest. No behavioral change.
- **Repo manifest:** `workspace/repos.json` (gitignored, synced to S3). `folderName` field for clone targets.
- **Repo restore:** Separate script (`restore-repos.sh`). Skip existing directories. Log errors, continue with remaining repos.
- **S3 lifecycle rule:** Non-current versions expire after 365 days. Incomplete multipart uploads aborted after 7 days.
- **Logging:** Per-process JSONL. Backup logs in `logs/backup/`. 7-day local retention. See `specs/daily-and-weekly-digest.md` for aggregation/delivery.
- **Error escalation:** Marker files in `logs/escalations/`. Heartbeat pickup (≤30 min). No `openclaw notify` — heartbeat is sufficient.
- **Hash strategy:** Native S3 SHA-256 checksums. Node.js `crypto.createHash('sha256').digest('base64')`. Verified 2026-03-29.
- **Scan boundaries:** Exclude `.git/`, `node_modules/`, `__pycache__/`, `.venv/`, `.cache/`, sockets, pipes, device files. Symlinks stored as-is; escalation if target not backed up.
- **Scripting:** TypeScript for `s3-sync.ts` (via `npx tsx`). Bash for orchestration (`backup.sh`), restore (`restore.sh`, `restore-repos.sh`), and git scripts. No Python.
- **Registry location:** Local is authoritative. S3 is backup only. Not in git (may contain sensitive paths).
- **Namespace separation:** Bot-specific S3 prefix. Configured per bot, documented in README.md.
- **Root-level files:** Explicit registry entries required for files at `~/.openclaw/` and `~/.openclaw/workspace/` roots. New root files trigger escalation with default `s3` rule.
- **Workspace memory:** Never pruned locally — needed for QMD access.
