#!/usr/bin/env bash
set -euo pipefail

# Remove working assets older than TTL days (default: 3)
# Usage: skills/asset-pipeline/scripts/cleanup_working_assets.sh [ttl_days]

TTL_DAYS="${1:-3}"
ROOT="assets/working"

if [[ ! -d "$ROOT" ]]; then
  echo "No working assets directory found: $ROOT"
  exit 0
fi

echo "Pruning working assets older than ${TTL_DAYS} day(s) under $ROOT"
find "$ROOT" -type f -mtime "+${TTL_DAYS}" -print -delete
