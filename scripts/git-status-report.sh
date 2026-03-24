#!/usr/bin/env bash
# git-status-report.sh — Report git status for the workspace root repo (silicon-simian)
# This intentionally ignores repos/ subdirectories — those have their own tracking.
set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
LOG="${WORKSPACE}/logs/git-status-report.log"
cd "$WORKSPACE"

branch=$(git branch --show-current 2>/dev/null || echo "detached")
unstaged=$(git diff --stat 2>/dev/null | tail -1)
staged=$(git diff --cached --stat 2>/dev/null | tail -1)
untracked_files=$(git ls-files --others --exclude-standard 2>/dev/null || true)
if [ -z "$untracked_files" ]; then
  untracked_count=0
else
  untracked_count=$(echo "$untracked_files" | wc -l)
fi
unpushed=$(git log --oneline @{upstream}..HEAD 2>/dev/null | wc -l)

REPORT="📊 Git Status Report — silicon-simian ($branch)\n"
REPORT+="$(date -u '+%F %H:%M UTC')\n"
REPORT+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

has_issues=false

if [ -n "$unstaged" ]; then
  REPORT+="⚠️ Unstaged changes: $unstaged\n"
  has_issues=true
fi

if [ -n "$staged" ]; then
  REPORT+="📦 Staged (uncommitted): $staged\n"
  has_issues=true
fi

if [ "$untracked_count" -gt 0 ]; then
  REPORT+="❓ Untracked files ($untracked_count):\n"
  echo "$untracked_files" | head -20 | while IFS= read -r f; do
    REPORT+="   • $f\n"
  done
  if [ "$untracked_count" -gt 20 ]; then
    REPORT+="   ... and $((untracked_count - 20)) more\n"
  fi
  has_issues=true
fi

if [ "$unpushed" -gt 0 ]; then
  REPORT+="🔺 Unpushed commits: $unpushed\n"
  has_issues=true
fi

if ! $has_issues; then
  REPORT+="✅ All clean — nothing uncommitted or unpushed.\n"
fi

# Log it
mkdir -p "$(dirname "$LOG")"
echo -e "$REPORT" >> "$LOG"

# Output
echo -e "$REPORT"
