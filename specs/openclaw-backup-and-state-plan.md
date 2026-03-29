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

### Four-state model

Every path is assigned one of four backup strategies:

| Value | Git | S3 | Meaning |
|---|---|---|---|
| `github` | tracked (not gitignored) | skipped by S3 sync | Git handles backup. |
| `s3` | gitignored | synced to S3 | S3 handles backup. |
| `ignored` | gitignored | skipped by S3 sync | Ephemeral, not backed up anywhere. |
| `unknown` | — | **inherits parent rule** | New path detected. Backed up using parent's rule. Escalation written. Transient — replaced with `github`/`s3`/`ignored` after confirmation. |

### Registry schema

The registry is a map where each key is a path (relative to `~/.openclaw/`) and each value is the config for that path. This allows O(1) lookup by path during directory walking.

```json
{
  "$schema": "backup-registry",
  "version": 1,
  "updated": "2026-03-29T16:45:00Z",
  "entries": {
    "openclaw.json": {
      "backup": "s3",
      "pruneMaxDays": null
    },
    "credentials": {
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
| `backup` | `"github"` \| `"s3"` \| `"ignored"` \| `"unknown"` | ✅ | Backup strategy. |
| `pruneMaxDays` | number \| null | ✅ | Max age in days for local file pruning. `null` = never prune. |

### Inheritance and unknown path handling

All folders are expected to eventually have an entry in the registry. Inheritance is only used **transiently** when a new folder appears and hasn't been formally assigned yet.

When the sync script encounters a path not in the registry:

1. **Look up parent paths** by walking up segments (`workspace/memory/foo` → `workspace/memory` → `workspace` → root).
2. **If a parent has an entry** → use the parent's rule for this sync run.
3. **Add the new path to the registry** with `"backup": "unknown"` and `"pruneMaxDays": null`.
4. **Write an escalation** containing:
   - The new path
   - The parent path that was inherited from
   - The parent's backup rule
   - Suggested action: "Confirm or reassign backup strategy"
5. Escalation is picked up by heartbeat and posted to MEK control plane.
6. Once confirmed, the `unknown` entry is updated to `github`/`s3`/`ignored`.

**This ensures nothing is ever silently missed.** New folders are always backed up on first detection using the safest available rule (parent's), and the operator gets notified to formalize.

---

## S3 Artifacts Reference

These files live in S3 and are used by the backup/restore process. Documented here so any bot setting up from the silicon-simian repo knows what to expect.

| S3 key | Local path | Purpose |
|---|---|---|
| `backup-registry.json` | `~/.openclaw/backup-registry.json` | Source of truth for what gets backed up where. See schema above. |
| `workspace/repos/repos.json` | `~/.openclaw/workspace/repos/repos.json` | Manifest of git repos to clone on restore. |

### repos.json schema

**Location:** `~/.openclaw/workspace/repos/repos.json` (inside the gitignored `repos/` directory, synced to S3)

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
| `folderName` | string | ✅ | Directory name under `workspace/repos/`. Used when repo name differs from the clone target. |
| `origin` | string | ✅ | Git remote URL for `origin`. |
| `branch` | string | ✅ | Default branch to checkout. |
| `upstream` | string | ❌ | Git remote URL for `upstream` (forks that sync with an upstream source). |

---

## Sync Script Design

### Principle

One TypeScript script. No LLM involvement. Runs via cron. Deterministic.

### Technology

- **Language:** TypeScript (executed via `npx tsx`)
- **AWS SDK:** `@aws-sdk/client-s3` (typed, built-in retries, proper error handling)
- **Hashing:** Node.js `crypto.createHash('sha256')` with file streaming
- **Logging:** JSONL output via `JSON.stringify` per line

### Algorithm

```
1. Load backup-registry.json (local copy, synced from S3)
2. Scan ~/.openclaw/ for all files and directories
3. For each path found:
   a. Look up path in registry map (O(1))
   b. If no match → walk up parent segments until match or root
   c. If match found:
      - "github" or "ignored" → skip
      - "s3" → sync (see below)
      - "unknown" → sync using inherited parent rule
   d. If no match at all (no parent either) → 
      - Add as "unknown" to registry
      - Sync to S3 using default "s3" behavior
      - Write escalation
4. For "s3" paths:
   - Compute local SHA-256 (Node crypto stream)
   - HeadObject with ChecksumMode: ENABLED
   - If not in S3 → PutObject with ChecksumAlgorithm: SHA256
   - If in S3 but hash differs → PutObject
   - If in S3 and hash matches → skip
5. For each S3 object with no local counterpart:
   - Place a delete marker (DeleteObject)
   - S3 versioning preserves all prior versions
6. Apply pruneMaxDays rules (delete local files exceeding age)
7. Write JSONL run log
8. If registry was modified (unknown paths added) → upload updated registry to S3
```

### Hash strategy — native S3 checksums

S3 natively supports SHA-256 checksums as a first-class feature:

**Upload (TypeScript):**
```typescript
import { PutObjectCommand } from '@aws-sdk/client-s3';
await s3.send(new PutObjectCommand({
  Bucket: 'matthewkeilbot',
  Key: 'credentials/foo.json',
  Body: fileStream,
  ChecksumAlgorithm: 'SHA256'
}));
```

**Check (TypeScript):**
```typescript
import { HeadObjectCommand } from '@aws-sdk/client-s3';
const head = await s3.send(new HeadObjectCommand({
  Bucket: 'matthewkeilbot',
  Key: 'credentials/foo.json',
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

Produces identical base64-encoded SHA-256 to what S3 stores. Verified 2026-03-29 using `openssl` equivalent (same algorithm, same encoding).

**Fallback:** If an object was uploaded without `ChecksumAlgorithm` (legacy/manual), HeadObject won't return `ChecksumSHA256`. Fall back to size comparison, then re-upload with checksum enabled.

### Large file handling

Files >100 MB are still uploaded normally but flagged in the JSONL run log under `large_files`. Reported in the daily digest.

### Parent orchestration script

A thin bash script (`scripts/backup.sh`) that:
1. Runs `scripts/auto-commit.sh` (git auto-commit + push — Lane A)
2. Runs `npx tsx scripts/s3-sync.ts` (S3 sync + prune + logging — Lane B)

Cron runs the parent script hourly.

---

## Restore Workflow

### From scratch (new host)

1. Install OpenClaw + Node.js
2. Clone workspace repo: `git clone git@github.com:matthewkeilbot/silicon-simian.git ~/.openclaw/workspace`
3. Follow `README.md` in the repo (which documents next steps)
4. Install AWS CLI and configure profile `matthewkeilbot`
5. `cd ~/.openclaw/workspace && npm install` (install TS dependencies)
6. Run restore script: `npx tsx scripts/restore.ts`
   - Downloads `backup-registry.json` from S3 → `~/.openclaw/backup-registry.json`
   - Walks all S3 objects, restores to `~/.openclaw/<key>`
   - Skips files that already match (hash check)
   - Downloads `workspace/repos/repos.json`, clones all repos with correct remotes/upstreams
7. Set git hooks: `cd ~/.openclaw/workspace && git config core.hooksPath .githooks`
8. Verify with `openclaw status`

### Partial restore

- Restore specific paths: `npx tsx scripts/restore.ts --path credentials/`
- Point-in-time: Use S3 console or `aws s3api list-object-versions` to retrieve prior versions

### README.md requirements

The workspace `README.md` must document:
- What this repo is and who it belongs to
- Prerequisites (Node.js, AWS CLI, OpenClaw)
- How to restore from S3 (AWS profile setup, npm install, restore script usage)
- How to set up git hooks
- Where to find the full spec (this file)
- What S3 artifacts exist and their purpose (backup-registry.json, repos.json)

---

## Implementation Order

1. ✅ Existing: `.gitignore` configured
2. ✅ Existing: `.githooks/` with pre-commit + post-commit
3. ✅ Existing: `scripts/auto-commit.sh`
4. ✅ Applied: S3 lifecycle rule (`expire-old-versions-365d`)
5. ✅ Created: `repos/repos.json` manifest (in gitignored `repos/`, synced to S3)
6. Create initial `backup-registry.json` with all current paths mapped
7. Add `package.json` + `tsconfig.json` for TypeScript scripts
8. Write `scripts/s3-sync.ts` — the core sync script (reads registry, hashes, uploads, delete markers, unknown path handling, escalations, pruning, JSONL logging)
9. Write `scripts/backup.sh` — thin bash orchestrator (git + TS sync)
10. Write `scripts/restore.ts` — pull from S3 to local + clone repos from manifest
11. Update `README.md` with restore instructions and S3 artifact reference
12. Set up hourly cron via `openclaw cron`
13. Test: run backup, verify S3 contents, test restore to temp dir

---

## Resolved Decisions

- **Backup registry:** Single source of truth in `backup-registry.json` (S3 + local). Four-state model: `github`/`s3`/`ignored`/`unknown`. Map-based schema for O(1) lookup. Unknown paths are transient — backed up using parent rule, escalation written, replaced after confirmation.
- **S3 path structure:** Mirrors `~/.openclaw/` exactly. S3 key = path relative to `~/.openclaw/`. No prefix mapping.
- **Orphaned S3 objects:** When a file is deleted locally, the sync script places a delete marker on the S3 object. S3 versioning preserves all prior versions. Delete markers expire after 365 days via lifecycle rule.
- **Large file threshold:** 100 MB. Files above this are still uploaded but flagged in the run log and reported in daily digest.
- **Repo manifest:** `repos/repos.json` in workspace (inside gitignored `repos/` dir), synced to S3. Contains repo origin URLs, branches, upstreams, and `folderName` for clone targets.
- **S3 lifecycle rule:** Non-current versions expire after 365 days. Incomplete multipart uploads aborted after 7 days. Applied 2026-03-29.
- **Logging/reporting:** See `specs/daily-and-weekly-digest.md` for the full reporting pipeline. All backup scripts write JSONL logs. Daily + weekly digests aggregate and deliver to control plane.
- **Error escalation:** Critical errors write escalation marker files. Heartbeat picks them up and posts to MEK control plane. Stack traces captured verbatim.
- **Hash strategy:** Native S3 SHA-256 checksums (first-class feature). Validated server-side on upload. Node.js `crypto.createHash('sha256').digest('base64')` produces identical output. Verified 2026-03-29.
- **Inbound media:** `ignored` — temp processing cache, originals live in source channels.
- **Workspace memory:** Never pruned locally — needed for QMD access.
- **Prune logging:** Not logged individually. S3 delete markers serve as the audit trail.
- **Scripting language:** TypeScript for sync/restore scripts (via `npx tsx`). Bash for thin orchestration (`backup.sh`) and simple git scripts. No Python.
- **Registry location:** S3 (not git) — may contain sensitive path names. Downloaded on restore as first step.
