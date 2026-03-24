#!/usr/bin/env bash
# auto-commit.sh — Hourly git backup for workspace
# Checks for uncommitted changes and pushes them.
set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
cd "$WORKSPACE"

# Check if there are any changes (staged, unstaged, or untracked)
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "[auto-commit] $(date -u +%FT%T) — nothing to commit"
  exit 0
fi

echo "[auto-commit] $(date -u +%FT%T) — uncommitted changes detected"

# Stage everything
git add -A

# Let pre-commit hook handle blocking sensitive files.
# If it blocks, we unstage the offending files and retry.
MAX_RETRIES=10
for i in $(seq 1 $MAX_RETRIES); do
  # Bail if nothing is staged
  if git diff --cached --quiet; then
    echo "[auto-commit] nothing left staged after filtering"
    exit 0
  fi

  output=$(git commit -m "chore(auto): hourly backup $(date -u +%F-%H%M)" 2>&1) && break

  # Extract blocked path from pre-commit output
  blocked=$(echo "$output" | grep -oP '(?<=BLOCKED sensitive path: ).*' || true)
  if [ -n "$blocked" ]; then
    echo "[auto-commit] unstaging blocked path: $blocked"
    git reset HEAD -- "$blocked" >/dev/null 2>&1 || true
  else
    echo "[auto-commit] commit failed for unknown reason:"
    echo "$output"
    exit 1
  fi

  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "[auto-commit] too many blocked paths, giving up"
    exit 1
  fi
done

echo "[auto-commit] committed successfully"

# Push (ignore post-commit warnings about repo visibility)
git push origin main 2>&1 || echo "[auto-commit] push failed — will retry next hour"
echo "[auto-commit] done"
