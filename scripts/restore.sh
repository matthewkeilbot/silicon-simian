#!/usr/bin/env bash
# restore.sh — Restore ~/.openclaw/ state from S3
# Pure bash + aws s3api. No Node.js required.
#
# Usage:
#   scripts/restore.sh                    # Full restore
#   scripts/restore.sh --path credentials/  # Restore specific prefix
#   scripts/restore.sh --no-clobber       # Skip existing files
set -euo pipefail

# Config — update these or set via environment
BUCKET="${OPENCLAW_S3_BUCKET:-BUCKET_NAME}"
PROFILE="${OPENCLAW_S3_PROFILE:-AWS_PROFILE}"
REGION="${OPENCLAW_S3_REGION:-AWS_REGION}"
S3_PREFIX=".openclaw/"
LOCAL_ROOT="${HOME}/.openclaw"

# Parse arguments
FILTER_PATH=""
NO_CLOBBER=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path)
      FILTER_PATH="$2"
      shift 2
      ;;
    --no-clobber)
      NO_CLOBBER=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: restore.sh [--path <prefix>] [--no-clobber]"
      exit 1
      ;;
  esac
done

PREFIX="${S3_PREFIX}${FILTER_PATH}"

echo "[restore] $(date -u +%FT%T) — starting restore from s3://${BUCKET}/${PREFIX}"
echo "[restore] local root: ${LOCAL_ROOT}"
echo "[restore] no-clobber: ${NO_CLOBBER}"

# List all current objects (not delete markers) under the prefix
OBJECTS=$(aws --profile "$PROFILE" --region "$REGION" \
  s3api list-objects-v2 \
  --bucket "$BUCKET" \
  --prefix "$PREFIX" \
  --query 'Contents[].Key' \
  --output text 2>/dev/null || echo "")

if [ -z "$OBJECTS" ] || [ "$OBJECTS" = "None" ]; then
  echo "[restore] no objects found under s3://${BUCKET}/${PREFIX}"
  exit 0
fi

RESTORED=0
SKIPPED=0
ERRORS=0
SYMLINKS=0

for KEY in $OBJECTS; do
  # Strip the .openclaw/ prefix to get relative path
  REL_PATH="${KEY#${S3_PREFIX}}"

  if [ -z "$REL_PATH" ]; then
    continue
  fi

  LOCAL_PATH="${LOCAL_ROOT}/${REL_PATH}"

  # --no-clobber: skip if local file exists
  if [ "$NO_CLOBBER" = true ] && [ -e "$LOCAL_PATH" ]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Check for symlink metadata
  SYMLINK_TARGET=$(aws --profile "$PROFILE" --region "$REGION" \
    s3api head-object \
    --bucket "$BUCKET" \
    --key "$KEY" \
    --query 'Metadata."symlink-target"' \
    --output text 2>/dev/null || echo "None")

  if [ "$SYMLINK_TARGET" != "None" ] && [ -n "$SYMLINK_TARGET" ]; then
    # Create symlink
    mkdir -p "$(dirname "$LOCAL_PATH")"
    # Remove existing file/symlink if present
    rm -f "$LOCAL_PATH" 2>/dev/null || true
    if ln -s "$SYMLINK_TARGET" "$LOCAL_PATH"; then
      SYMLINKS=$((SYMLINKS + 1))
      RESTORED=$((RESTORED + 1))
      echo "[restore] symlink: ${REL_PATH} -> ${SYMLINK_TARGET}"
    else
      ERRORS=$((ERRORS + 1))
      echo "[restore] ERROR: failed to create symlink ${REL_PATH}" >&2
    fi
    continue
  fi

  # Download regular file
  mkdir -p "$(dirname "$LOCAL_PATH")"
  if aws --profile "$PROFILE" --region "$REGION" \
    s3api get-object \
    --bucket "$BUCKET" \
    --key "$KEY" \
    "$LOCAL_PATH" >/dev/null 2>&1; then
    RESTORED=$((RESTORED + 1))
    echo "[restore] downloaded: ${REL_PATH}"
  else
    ERRORS=$((ERRORS + 1))
    echo "[restore] ERROR: failed to download ${REL_PATH}" >&2
  fi
done

echo ""
echo "[restore] $(date -u +%FT%T) — complete"
echo "[restore] restored=${RESTORED} skipped=${SKIPPED} symlinks=${SYMLINKS} errors=${ERRORS}"

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi
