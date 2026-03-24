#!/usr/bin/env bash
# Pull latest changes for repos listed in REPO_TRACKING.md under "## Pull Changes"
set -euo pipefail

WORKSPACE="/home/openclaw/.openclaw/workspace"
TRACKING="$WORKSPACE/REPO_TRACKING.md"
REPOS_DIR="$WORKSPACE/repos"

if [[ ! -f "$TRACKING" ]]; then
  echo "ERROR: $TRACKING not found"
  exit 1
fi

# Parse repo names under "## Pull Changes"
in_section=false
repos=()
while IFS= read -r line; do
  if [[ "$line" =~ ^##[[:space:]]+Pull[[:space:]]+Changes ]]; then
    in_section=true
    continue
  fi
  if $in_section && [[ "$line" =~ ^## ]]; then
    break
  fi
  if $in_section; then
    name=$(echo "$line" | sed -n 's/^- *//p' | xargs)
    [[ -n "$name" ]] && repos+=("$name")
  fi
done < <(cat "$TRACKING"; echo)

echo "Found pull repos: ${repos[*]:-none}"

# Parse repo names under "## Sync From Upstream"
in_section=false
upstream_repos=()
while IFS= read -r line; do
  if [[ "$line" =~ ^##[[:space:]]+Sync[[:space:]]+From[[:space:]]+Upstream ]]; then
    in_section=true
    continue
  fi
  if $in_section && [[ "$line" =~ ^## ]]; then
    break
  fi
  if $in_section; then
    name=$(echo "$line" | sed -n 's/^- *//p' | xargs)
    [[ -n "$name" ]] && upstream_repos+=("$name")
  fi
done < <(cat "$TRACKING"; echo)

echo "Found upstream-sync repos: ${upstream_repos[*]:-none}"

if [[ ${#repos[@]} -eq 0 && ${#upstream_repos[@]} -eq 0 ]]; then
  echo "No repos found in REPO_TRACKING.md"
  exit 0
fi

results=()

# Pull Changes — reset to origin trunk
for repo in "${repos[@]}"; do
  dir="$REPOS_DIR/$repo"
  if [[ ! -d "$dir/.git" ]]; then
    results+=("⚠️ $repo — not a git repo at $dir")
    continue
  fi
  echo "--- Pulling $repo ---"
  trunk=$(cd "$dir" && git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || true)
  trunk="${trunk:-main}"
  if output=$(cd "$dir" && \
    git fetch --all 2>&1 && \
    git checkout "$trunk" 2>&1 && \
    git reset --hard "origin/$trunk" 2>&1); then
    results+=("✅ $repo ($trunk) — pulled")
  else
    results+=("❌ $repo — $output")
  fi
done

# Sync From Upstream — fetch upstream, merge, push to origin
for repo in "${upstream_repos[@]}"; do
  dir="$REPOS_DIR/$repo"
  if [[ ! -d "$dir/.git" ]]; then
    results+=("⚠️ $repo — not a git repo at $dir")
    continue
  fi
  # Verify upstream remote exists
  if ! (cd "$dir" && git remote get-url upstream &>/dev/null); then
    results+=("⚠️ $repo — no 'upstream' remote configured")
    continue
  fi
  echo "--- Syncing $repo from upstream ---"
  trunk=$(cd "$dir" && git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || true)
  trunk="${trunk:-main}"
  if output=$(cd "$dir" && \
    git fetch upstream 2>&1 && \
    git checkout "$trunk" 2>&1 && \
    git merge "upstream/$trunk" --no-edit 2>&1 && \
    git push origin "$trunk" 2>&1); then
    # Check if merge brought new commits
    if echo "$output" | grep -q "Already up to date"; then
      results+=("✅ $repo ($trunk) — already up to date")
    else
      results+=("🔄 $repo ($trunk) — synced new changes from upstream")
    fi
  else
    results+=("❌ $repo — $output")
  fi
done

echo ""
echo "=== Summary ==="
for r in "${results[@]}"; do
  echo "$r"
done
