#!/usr/bin/env bash
# git-status-report.sh — Weekly report of git status across all workspace repos
set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
LOG="${WORKSPACE}/logs/git-status-report.log"
REPORT=""
DIRTY_COUNT=0
CLEAN_COUNT=0

# Find all git repos under workspace (max depth 4)
while IFS= read -r gitdir; do
  repo_path=$(dirname "$gitdir")
  repo_name="${repo_path#"$WORKSPACE/"}"
  [ "$repo_path" = "$WORKSPACE" ] && repo_name="(workspace root)"

  cd "$repo_path"

  # Check for uncommitted changes
  has_changes=false
  unstaged=$(git diff --stat 2>/dev/null | tail -1)
  staged=$(git diff --cached --stat 2>/dev/null | tail -1)
  untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
  unpushed=$(git log --oneline @{upstream}..HEAD 2>/dev/null | wc -l)
  branch=$(git branch --show-current 2>/dev/null || echo "detached")

  status_lines=""

  if [ -n "$unstaged" ]; then
    status_lines+="  ⚠️ Unstaged: $unstaged\n"
    has_changes=true
  fi
  if [ -n "$staged" ]; then
    status_lines+="  📦 Staged: $staged\n"
    has_changes=true
  fi
  if [ "$untracked" -gt 0 ]; then
    status_lines+="  ❓ Untracked files: $untracked\n"
    has_changes=true
  fi
  if [ "$unpushed" -gt 0 ]; then
    status_lines+="  🔺 Unpushed commits: $unpushed\n"
    has_changes=true
  fi

  if $has_changes; then
    REPORT+="❌ $repo_name ($branch)\n$status_lines\n"
    DIRTY_COUNT=$((DIRTY_COUNT + 1))
  else
    REPORT+="✅ $repo_name ($branch) — clean\n"
    CLEAN_COUNT=$((CLEAN_COUNT + 1))
  fi

done < <(find "$WORKSPACE" -name .git -type d -maxdepth 4 2>/dev/null | sort)

# Build final report
HEADER="📊 Weekly Git Status Report — $(date -u '+%F %H:%M UTC')\n"
HEADER+="Clean: $CLEAN_COUNT | Dirty: $DIRTY_COUNT\n"
HEADER+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

FULL_REPORT="${HEADER}\n${REPORT}"

# Log it
mkdir -p "$(dirname "$LOG")"
echo -e "$FULL_REPORT" >> "$LOG"

# Output for cron/notification pickup
echo -e "$FULL_REPORT"
