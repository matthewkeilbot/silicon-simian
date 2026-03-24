#!/usr/bin/env bash
# git-status-report.sh — Weekly inventory of tracked vs untracked at workspace root
# Scope: silicon-simian repo only (not repos/ subdirectories)
set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
LOG="${WORKSPACE}/logs/git-status-report.log"
cd "$WORKSPACE"

branch=$(git branch --show-current 2>/dev/null || echo "detached")

# Get all root-level items
all_files=()
all_dirs=()
for item in * .*; do
  [ "$item" = "." ] || [ "$item" = ".." ] || [ "$item" = ".git" ] && continue
  if [ -d "$item" ]; then
    all_dirs+=("$item")
  elif [ -f "$item" ]; then
    all_files+=("$item")
  fi
done

# Check what git tracks (any file under a dir = dir is tracked)
tracked_files=()
untracked_files=()
for f in "${all_files[@]}"; do
  if git ls-files --error-unmatch "$f" &>/dev/null; then
    tracked_files+=("$f")
  elif git check-ignore -q "$f" 2>/dev/null; then
    untracked_files+=("$f (gitignored)")
  else
    untracked_files+=("$f")
  fi
done

tracked_dirs=()
untracked_dirs=()
for d in "${all_dirs[@]}"; do
  # A dir is "tracked" if git knows about any file inside it
  if [ -n "$(git ls-files "$d/" 2>/dev/null | head -1)" ]; then
    tracked_dirs+=("$d/")
  elif git check-ignore -q "$d" 2>/dev/null; then
    untracked_dirs+=("$d/ (gitignored)")
  else
    # Could have untracked files not yet added
    untracked_dirs+=("$d/")
  fi
done

# Build report
R=""
R+="### \`silicon-simian\` Git Status Report\n"
R+="Branch: \`$branch\` | $(date -u '+%F %H:%M UTC')\n\n"

R+="#### Tracked Files\n"
if [ ${#tracked_files[@]} -eq 0 ]; then
  R+="_None_\n"
else
  for f in "${tracked_files[@]}"; do R+="• $f\n"; done
fi

R+="\n#### Untracked Files\n"
if [ ${#untracked_files[@]} -eq 0 ]; then
  R+="_None_\n"
else
  for f in "${untracked_files[@]}"; do R+="• $f\n"; done
fi

R+="\n#### Tracked Folders\n"
if [ ${#tracked_dirs[@]} -eq 0 ]; then
  R+="_None_\n"
else
  for d in "${tracked_dirs[@]}"; do R+="• $d\n"; done
fi

R+="\n#### Untracked Folders\n"
if [ ${#untracked_dirs[@]} -eq 0 ]; then
  R+="_None_\n"
else
  for d in "${untracked_dirs[@]}"; do R+="• $d\n"; done
fi

# Dirty status summary
unstaged=$(git diff --stat 2>/dev/null | tail -1)
unpushed=$(git log --oneline @{upstream}..HEAD 2>/dev/null | wc -l)
new_untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l || echo 0)

if [ -n "$unstaged" ] || [ "$unpushed" -gt 0 ] || [ "$new_untracked" -gt 0 ]; then
  R+="\n#### ⚠️ Pending Changes\n"
  [ -n "$unstaged" ] && R+="• Uncommitted: $unstaged\n"
  [ "$unpushed" -gt 0 ] && R+="• Unpushed commits: $unpushed\n"
  [ "$new_untracked" -gt 0 ] && R+="• New untracked files: $new_untracked\n"
else
  R+="\n✅ All clean — nothing uncommitted or unpushed.\n"
fi

# Log
mkdir -p "$(dirname "$LOG")"
echo -e "$R" >> "$LOG"

# Output
echo -e "$R"
