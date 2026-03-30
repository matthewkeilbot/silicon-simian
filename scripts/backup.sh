#!/usr/bin/env bash
# backup.sh — Orchestrator: git auto-commit (Lane A) then S3 sync (Lane B)
# Run via cron hourly.
set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[backup] $(date -u +%FT%T) — starting"

# Lane A: Git auto-commit + push
echo "[backup] Lane A — git auto-commit"
if bash "${SCRIPT_DIR}/auto-commit.sh"; then
  echo "[backup] Lane A — done"
else
  echo "[backup] Lane A — failed (continuing to Lane B)"
fi

# Lane B: S3 sync
echo "[backup] Lane B — S3 sync"
cd "$WORKSPACE"
if npx tsx "${SCRIPT_DIR}/s3-sync.ts"; then
  echo "[backup] Lane B — done"
else
  echo "[backup] Lane B — failed"
  exit 1
fi

echo "[backup] $(date -u +%FT%T) — complete"
