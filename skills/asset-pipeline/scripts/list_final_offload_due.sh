#!/usr/bin/env bash
set -euo pipefail

# List final assets older than TTL days (default: 7)
# Usage: skills/asset-pipeline/scripts/list_final_offload_due.sh [ttl_days]

TTL_DAYS="${1:-7}"
ROOT="assets/final"

if [[ ! -d "$ROOT" ]]; then
  echo "No final assets directory found: $ROOT"
  exit 0
fi

echo "Final assets older than ${TTL_DAYS} day(s) (offload candidates):"
find "$ROOT" -type f -mtime "+${TTL_DAYS}" -print | sort
