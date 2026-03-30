#!/usr/bin/env bash
# restore-repos.sh — Clone repos from workspace/repos.json manifest
# Reads repos.json and clones each repo into workspace/repos/<folderName>
set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
REPOS_JSON="${WORKSPACE}/repos.json"
REPOS_DIR="${WORKSPACE}/repos"

if [ ! -f "$REPOS_JSON" ]; then
  echo "[restore-repos] ERROR: ${REPOS_JSON} not found" >&2
  echo "[restore-repos] Run restore.sh first to download it from S3" >&2
  exit 1
fi

mkdir -p "$REPOS_DIR"

# Parse repos.json — prefer node, fall back to python3

if command -v node &>/dev/null; then
  PARSER="node"
elif command -v python3 &>/dev/null; then
  PARSER="python3"
else
  echo "[restore-repos] ERROR: node or python3 required to parse JSON" &>2
  exit 1
fi
fi

REPO_COUNT=0
CLONED=0
SKIPPED=0
ERRORS=0

if [ "$PARSER" = "node" ]; then
  # Extract repo info using node
  eval "$(node -e "
const data = require('${REPOS_JSON}');
const repos = data.repos || [];
console.log('REPO_COUNT=' + repos.length);
repos.forEach((r, i) => {
  const esc = s => \"'\" + s.replace(/'/g, \"'\\\\''\" ) + \"'\";
  console.log('REPO_' + i + '_FOLDER=' + esc(r.folderName));
  console.log('REPO_' + i + '_ORIGIN=' + esc(r.origin));
  console.log('REPO_' + i + '_BRANCH=' + esc(r.branch || 'main'));
  console.log('REPO_' + i + '_UPSTREAM=' + esc(r.upstream || ''));
});
")"
else
  # Extract repo info using python3
  eval "$(python3 -c "
import json, sys, shlex
with open('${REPOS_JSON}') as f:
    data = json.load(f)
repos = data.get('repos', [])
print(f'REPO_COUNT={len(repos)}')
for i, r in enumerate(repos):
    fn = shlex.quote(r['folderName'])
    origin = shlex.quote(r['origin'])
    branch = shlex.quote(r.get('branch', 'main'))
    upstream = shlex.quote(r.get('upstream', ''))
    print(f'REPO_{i}_FOLDER={fn}')
    print(f'REPO_{i}_ORIGIN={origin}')
    print(f'REPO_{i}_BRANCH={branch}')
    print(f'REPO_{i}_UPSTREAM={upstream}')
")"
fi

echo "[restore-repos] $(date -u +%FT%T) — restoring ${REPO_COUNT} repos"

for i in $(seq 0 $((REPO_COUNT - 1))); do
  FOLDER_VAR="REPO_${i}_FOLDER"
  ORIGIN_VAR="REPO_${i}_ORIGIN"
  BRANCH_VAR="REPO_${i}_BRANCH"
  UPSTREAM_VAR="REPO_${i}_UPSTREAM"

  FOLDER="${!FOLDER_VAR}"
  ORIGIN="${!ORIGIN_VAR}"
  BRANCH="${!BRANCH_VAR}"
  UPSTREAM="${!UPSTREAM_VAR}"

  TARGET="${REPOS_DIR}/${FOLDER}"

  echo "[restore-repos] --- ${FOLDER} ---"

  # Skip if directory exists
  if [ -d "$TARGET" ]; then
    if [ -d "${TARGET}/.git" ]; then
      echo "[restore-repos] SKIP: ${FOLDER} already exists (git repo)"
    else
      echo "[restore-repos] WARN: ${FOLDER} exists but is NOT a git repo" >&2
    fi
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Clone
  echo "[restore-repos] cloning ${ORIGIN} -> ${TARGET} (branch: ${BRANCH})"
  if git clone --branch "$BRANCH" "$ORIGIN" "$TARGET" 2>/dev/null; then
    CLONED=$((CLONED + 1))
  else
    # Try cloning without --branch (branch might not exist on remote)
    echo "[restore-repos] WARN: branch '${BRANCH}' not found, cloning default branch"
    if git clone "$ORIGIN" "$TARGET" 2>/dev/null; then
      CLONED=$((CLONED + 1))
    else
      echo "[restore-repos] ERROR: failed to clone ${FOLDER}" >&2
      ERRORS=$((ERRORS + 1))
      continue
    fi
  fi

  # Add upstream remote if specified
  if [ -n "$UPSTREAM" ]; then
    echo "[restore-repos] adding upstream: ${UPSTREAM}"
    (cd "$TARGET" && git remote add upstream "$UPSTREAM" 2>/dev/null) || \
      echo "[restore-repos] WARN: upstream remote already exists or failed for ${FOLDER}"
  fi
done

echo ""
echo "[restore-repos] $(date -u +%FT%T) — complete"
echo "[restore-repos] cloned=${CLONED} skipped=${SKIPPED} errors=${ERRORS}"

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi
