# Daily & Weekly System Digest

## Goal

Aggregate structured logs from all system processes into human-readable daily and weekly summaries, delivered to the control plane (MEK Telegram).

The digest pipeline does **not** define log formats — each process owns its own logging spec (see `openclaw-backup-and-state-plan.md` for backup logs). The digest simply reads whatever JSONL files exist in `logs/<process>/` directories and aggregates them.

---

## Pipeline Overview

No LLM involvement in aggregation. LLM used only for final delivery formatting.

```
cron (daily)   → scripts/daily-digest.sh  → pure bash, aggregates JSONL → digest JSON
cron (weekly)  → scripts/weekly-digest.sh → pure bash, aggregates dailies → weekly JSON
cron (daily)   → haiku LLM session        → reads digest JSON → formats + posts to MEK
heartbeat      → checks logs/escalations/  → posts critical alerts to MEK (≤30 min latency)
```

---

## Architecture

```
[Process Logs]              [Aggregator]           [Digest]
                                                   
backup  ──→ logs/backup/     ──┐                   
email   ──→ logs/email/       ──┤──→ digest job ──→ Telegram (MEK)
git     ──→ logs/git/         ──┤                  
future  ──→ logs/<process>/   ──┘                  
```

Each process is responsible for writing its own JSONL logs to its own `logs/<process>/` directory. The digest pipeline discovers all process directories automatically and aggregates whatever it finds.

---

## Log Contract

The digest pipeline expects each JSONL log entry to contain **at minimum**:

| Field | Type | Required | Description |
|---|---|---|---|
| `process` | string | ✅ | Process name (should match directory name). |
| `timestamp` | string (ISO 8601) | ✅ | When the run started. |
| `status` | `"success"` \| `"failure"` | ✅ | Run outcome. |
| `duration_sec` | number | ✅ | How long the run took. |
| `errors` | array | ✅ | Error objects (empty array if none). |
| `warnings` | array | ✅ | Warning strings (empty array if none). |

Beyond these required fields, each process can include whatever additional metrics make sense. The digest aggregator uses the required fields for counts and status; process-specific metrics are passed through to the digest output for the LLM formatter to pick up.

---

## Log Discovery

Digest scripts scan `~/.openclaw/workspace/logs/` for subdirectories. Each subdirectory is treated as a process. Within each:
- Daily digest reads all `*.jsonl` files with mtime in the past 24 hours.
- Weekly digest reads all `daily-*.json` files from `logs/digest/` from the past 7 days.

No hardcoded process list — new processes are picked up automatically when they start writing logs.

---

## Digest Output

### Log locations

```
~/.openclaw/workspace/logs/
  digest/
    daily-YYYY-MM-DD.json       ← aggregated daily digest data
    weekly-YYYY-WW.json         ← aggregated weekly digest data
```

### Daily digest

- **Schedule:** Once daily via cron (06:00 UTC = 13:00 ICT)
- **Script:** `scripts/daily-digest.sh`

Aggregation per process:
1. Count: total runs, successes, failures
2. Collect: all errors (with stack traces), all warnings
3. Sum: any numeric metrics present across runs
4. Compute: average and max `duration_sec`

Output:
```json
{
  "date": "2026-03-29",
  "generated_at": "2026-03-30T06:00:00Z",
  "processes": {
    "s3-sync": {
      "runs": 24,
      "successes": 24,
      "failures": 0,
      "avg_duration_sec": 11,
      "max_duration_sec": 23,
      "metrics": {
        "files_uploaded": 17,
        "bytes_uploaded": 142000
      },
      "errors": [],
      "warnings": []
    }
  }
}
```

### Weekly digest

- **Schedule:** Once weekly via cron (Monday 06:00 UTC)
- **Script:** `scripts/weekly-digest.sh`
- **Input:** Daily digest files from the past 7 days
- **Adds:** Week-over-week trends (totals, error frequency, etc.)

---

## Digest Delivery

### Daily → Telegram

Cron triggers a lightweight LLM session (haiku model) that:
1. Reads `logs/digest/daily-YYYY-MM-DD.json`
2. Formats a concise Telegram message
3. Posts to MEK control plane

Format example:
```
📊 Daily System Digest — March 29, 2026

🗄️ S3 Sync: 24/24 runs ✅ | 17 files synced (139 KB)
📦 Git Push: 23/24 runs ⚠️ | 1 failure (see below)
📧 Email: 6 runs | 12 new messages

⚠️ Issues:
• Git push failed at 15:00 UTC — Permission denied (3 retries, unresolved)
```

- **If no issues:** One-liner confirmation (`📊 Daily digest: all systems nominal ✅`)
- **If critical errors:** Also escalated via escalation pipeline (see below)

### Weekly → Telegram

Same flow, broader summary with trends:
```
📊 Weekly System Digest — Week 13, 2026

🗄️ S3 Sync: 168/168 runs ✅ | 89 files synced (2.1 MB total)
📈 Trends: Storage +14 MB, reliability 99.4%
```

---

## Digest Retention (local)

| Type | Local retention | S3 retention |
|---|---|---|
| Daily digests | 30 days | Versioned (12 months via lifecycle) |
| Weekly digests | 1 month | Versioned |

Note: per-run log retention is owned by the process that writes them, not by the digest pipeline. See individual process specs for their retention rules.

---

## Error Escalation

Escalation is a separate mechanism from the digest. Processes write escalation marker files for critical errors that can't wait for the daily digest.

### Escalation file location

```
~/.openclaw/workspace/logs/escalations/YYYY-MM-DD-HHMM-<process>.json
```

### Escalation schema

```json
{
  "process": "s3-sync",
  "timestamp": "2026-03-29T15:01:00Z",
  "severity": "critical",
  "error": "AccessDenied",
  "message": "S3 upload failed after 3 retries — possible credential expiry",
  "stack": "<full stderr / stack trace verbatim>",
  "context": {}
}
```

### Pickup

Heartbeat checks `logs/escalations/` on each run. If files exist:
1. Posts alert to MEK control plane
2. Moves processed files to `logs/escalations/handled/`

Worst-case latency: ~30 min (heartbeat interval).

### Escalation triggers

Each process defines its own escalation triggers. Common patterns:
- Auth failures after retries
- Consecutive run failures
- Crashes with stack traces
- Disk space critically low

---

## Adding New Processes

1. Create `logs/<process>/` directory
2. Write JSONL log files with the required fields (see Log Contract above)
3. Include any process-specific metrics you want surfaced in the digest
4. The digest pipeline discovers the new directory automatically — no config changes needed
