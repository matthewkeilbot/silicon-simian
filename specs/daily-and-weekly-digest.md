# Daily & Weekly System Digest

## Goal

A single, unified reporting pipeline for all system processes. Each process writes structured logs. A digest job aggregates them into a human-readable summary delivered to the control plane (MEK Telegram).

No LLM involvement in log collection or aggregation. LLM only used for final digest formatting + delivery.

---

## Architecture

```
[Process Logs]          [Aggregator]           [Digest]
                                               
backup  ──→ logs/backup/    ──┐                
email   ──→ logs/email/      ──┤──→ digest job ──→ Telegram (MEK)
pruning ──→ logs/pruning/    ──┤               
git     ──→ logs/git/        ──┘               
future  ──→ logs/<process>/  ──┘               
```

---

## Log Format

All process logs use **JSONL** (one JSON object per line). This makes them trivially parseable by scripts without an LLM.

### Per-run log entry

```jsonl
{
  "process": "s3-sync",
  "timestamp": "2026-03-29T14:00:00Z",
  "duration_sec": 12,
  "status": "success",
  "summary": {
    "files_scanned": 142,
    "files_uploaded": 3,
    "files_skipped": 139,
    "bytes_uploaded": 28400,
    "orphans_detected": 0,
    "large_files_flagged": 0,
    "files_pruned": 2
  },
  "errors": [],
  "warnings": ["logs/config-audit.jsonl: metadata missing, re-uploaded with sha256"],
  "large_files": []
}
```

### Error entry (within `errors` array)

```json
{
  "file": "credentials/aws.json",
  "error": "AccessDenied",
  "message": "Upload failed: 403 Forbidden",
  "stack": "aws s3api put-object ...\nAn error occurred (AccessDenied) when calling the PutObject operation: Access Denied",
  "retries": 3,
  "resolved": false
}
```

### Large file entry (within `large_files` array)

```json
{
  "file": "media/inbound/video-2026-03-29.mp4",
  "size_mb": 247,
  "uploaded": true
}
```

---

## Log Locations

### Local

```
~/.openclaw/workspace/logs/
  backup/
    s3-sync-YYYY-MM-DD-HHMM.jsonl       ← one file per S3 sync run
    git-push-YYYY-MM-DD-HHMM.jsonl      ← one file per git push run
    prune-YYYY-MM-DD-HHMM.jsonl         ← one file per prune run
  email/
    check-YYYY-MM-DD-HHMM.jsonl         ← one file per email check run (future)
  digest/
    daily-YYYY-MM-DD.json               ← aggregated daily digest data
    weekly-YYYY-WW.json                 ← aggregated weekly digest data
```

All under `logs/` which is `.gitignored` and synced to S3.

### S3 mirror

```
s3://matthewkeilbot/openclaw/logs/
  backup/...
  email/...
  digest/...
```

Logs get uploaded as part of the regular S3 sync (they live in backed-up paths).

---

## Log Retention (local)

| Log type | Local retention | S3 retention |
|---|---|---|
| Per-run logs (`backup/`, `email/`, etc.) | 14 days | Versioned (12 months via lifecycle) |
| Daily digests | 90 days | Versioned |
| Weekly digests | 1 year | Versioned |

Pruning handled by the existing `s3-prune.sh` age rules.

---

## Aggregation

### Daily digest

- **Runs:** Once daily via cron (e.g., 06:00 UTC = 13:00 ICT)
- **Script:** `scripts/daily-digest.sh`
- **Input:** All JSONL log files from the past 24 hours across all `logs/<process>/` dirs
- **Output:** `logs/digest/daily-YYYY-MM-DD.json`

Aggregation logic (no LLM, pure script):

```
For each process directory:
  1. Read all JSONL files from past 24h
  2. Count: total runs, successes, failures, warnings
  3. Sum: files scanned, uploaded, pruned, bytes transferred
  4. Collect: all errors (with stack traces), all warnings, all large files
  5. Compute: average run duration, longest run
```

Output structure:

```json
{
  "date": "2026-03-29",
  "generated_at": "2026-03-30T06:00:00Z",
  "processes": {
    "s3-sync": {
      "runs": 24,
      "successes": 24,
      "failures": 0,
      "total_files_uploaded": 17,
      "total_bytes_uploaded": 142000,
      "total_files_pruned": 4,
      "avg_duration_sec": 11,
      "max_duration_sec": 23,
      "errors": [],
      "warnings": ["2 files re-uploaded with missing metadata"],
      "large_files": [
        { "file": "media/inbound/video.mp4", "size_mb": 247 }
      ]
    },
    "git-push": {
      "runs": 24,
      "successes": 23,
      "failures": 1,
      "errors": [
        {
          "timestamp": "2026-03-29T15:00:00Z",
          "error": "push rejected",
          "message": "remote: Permission denied",
          "stack": "git push origin main\nERROR: Permission to matthewkeilbot/silicon-simian.git denied...",
          "retries": 3,
          "resolved": false
        }
      ],
      "warnings": []
    },
    "email": {
      "runs": 6,
      "successes": 6,
      "failures": 0,
      "new_messages": 12,
      "errors": [],
      "warnings": []
    }
  }
}
```

### Weekly digest

- **Runs:** Once weekly via cron (Monday 06:00 UTC)
- **Script:** `scripts/weekly-digest.sh`
- **Input:** Daily digest files from the past 7 days
- **Output:** `logs/digest/weekly-YYYY-WW.json`
- **Adds:** Week-over-week trends (storage growth, error frequency, etc.)

---

## Digest Delivery

### Daily digest → Telegram

- Cron triggers a lightweight LLM session (haiku model) that:
  1. Reads `logs/digest/daily-YYYY-MM-DD.json`
  2. Formats a concise Telegram message
  3. Posts to MEK control plane

Format:

```
📊 Daily System Digest — March 29, 2026

🗄️ S3 Sync: 24/24 runs ✅ | 17 files synced (139 KB)
📦 Git Push: 23/24 runs ⚠️ | 1 failure (see below)
📧 Email: 6 runs | 12 new messages

⚠️ Issues:
• Git push failed at 15:00 UTC — Permission denied (3 retries, unresolved)
  └ git push origin main → ERROR: Permission to matthewkeilbot/silicon-simian.git denied...

📁 Large files uploaded:
• media/inbound/video.mp4 (247 MB)

🧹 Pruned: 4 files (aged out per retention rules)
```

- **If no issues:** Still deliver a one-liner confirmation (`📊 Daily digest: all systems nominal ✅`)
- **If critical errors:** Also escalate immediately (see below)

### Weekly digest → Telegram

Same flow, broader summary with trends:

```
📊 Weekly System Digest — Week 13, 2026

🗄️ S3 Sync: 168/168 runs ✅ | 89 files synced (2.1 MB total)
📦 Git Push: 166/168 runs | 2 failures (both resolved)
📧 Email: 42 runs | 67 new messages

📈 Trends:
• Storage growth: +14 MB this week
• Backup reliability: 99.4% (up from 98.1%)
• No recurring errors
```

---

## Error Escalation (Immediate)

Some errors can't wait for the daily digest. These get escalated immediately.

### Escalation triggers

| Condition | Action |
|---|---|
| S3 auth failure (403/401) after 3 retries | Alert immediately |
| Git push failed 3 consecutive times | Alert immediately |
| Backup script crashed (non-zero exit + stack trace) | Alert immediately |
| Disk space <1 GB | Alert immediately |
| Any unhandled exception with stack trace | Alert immediately |

### Escalation mechanism

The backup/sync scripts write a special `ESCALATE` marker file:

```
~/.openclaw/workspace/logs/escalations/YYYY-MM-DD-HHMM-<process>.json
```

```json
{
  "process": "s3-sync",
  "timestamp": "2026-03-29T15:01:00Z",
  "severity": "critical",
  "error": "AccessDenied",
  "message": "S3 upload failed after 3 retries — possible credential expiry",
  "stack": "aws s3api put-object --bucket matthewkeilbot --key openclaw/credentials/aws.json\nAn error occurred (AccessDenied) when calling the PutObject operation...",
  "context": {
    "file": "credentials/aws.json",
    "retries": 3,
    "last_successful_sync": "2026-03-29T14:00:00Z"
  }
}
```

The heartbeat picks up escalation files on next run and posts to control plane. This means worst-case latency is ~30 min (heartbeat interval). For truly critical failures, the script can also use `openclaw notify` (if available) to push immediately without LLM.

### Stack trace capture

All scripts wrap critical sections in error handlers that capture:
- Exit code
- stderr output (full)
- The command that failed
- Any library/runtime stack trace

These go into the `stack` field verbatim — no truncation, no summarization.

---

## Adding New Processes

To add a new process to the digest pipeline:

1. Create `logs/<process>/` directory
2. Write JSONL log files using the standard format (see Log Format above)
3. Add a process-specific summary block to the aggregator script
4. The digest job automatically picks up any new `logs/<process>/` directories

---

## Implementation Order

1. Create `logs/` subdirectory structure
2. Update backup scripts to write JSONL logs
3. Write `scripts/daily-digest.sh` (aggregator)
4. Write `scripts/weekly-digest.sh` (aggregator)
5. Set up cron jobs for daily + weekly digest delivery
6. Add escalation file detection to heartbeat
7. Test end-to-end: trigger a failure, verify escalation + digest
