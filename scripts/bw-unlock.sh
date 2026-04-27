#!/usr/bin/env bash
set -euo pipefail

# Unlock Bitwarden CLI using API key env vars plus a master password fetched at runtime.
# Expected env:
#   BW_CLIENTID
#   BW_CLIENTSECRET
# Optional env:
#   BW_PASSWORD_CMD   command that prints the Bitwarden master password
#   BW_PASSWORD       fallback plaintext env var (discouraged)
#   BW_SESSION_CACHE  path to write the session token (default: ~/.openclaw/credentials/bitwarden-session)
#   BW_PASSWORD_ATTR_SERVICE (default: bitwarden)
#   BW_PASSWORD_ATTR_ACCOUNT (default: mekbot)
#
# Default password lookup behavior:
#   If secret-tool exists, use:
#     secret-tool lookup service "$BW_PASSWORD_ATTR_SERVICE" account "$BW_PASSWORD_ATTR_ACCOUNT"
#   Otherwise, require BW_PASSWORD_CMD or BW_PASSWORD.

require() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: required env var $name is not set" >&2
    exit 1
  fi
}

require BW_CLIENTID
require BW_CLIENTSECRET

if ! command -v bw >/dev/null 2>&1; then
  echo "ERROR: bw CLI is not installed or not on PATH" >&2
  exit 1
fi

BW_PASSWORD_ATTR_SERVICE="${BW_PASSWORD_ATTR_SERVICE:-bitwarden}"
BW_PASSWORD_ATTR_ACCOUNT="${BW_PASSWORD_ATTR_ACCOUNT:-mekbot}"
BW_SESSION_CACHE="${BW_SESSION_CACHE:-$HOME/.openclaw/credentials/bitwarden-session}"

get_password() {
  if [[ -n "${BW_PASSWORD_CMD:-}" ]]; then
    bash -lc "$BW_PASSWORD_CMD"
    return
  fi

  if command -v secret-tool >/dev/null 2>&1; then
    secret-tool lookup service "$BW_PASSWORD_ATTR_SERVICE" account "$BW_PASSWORD_ATTR_ACCOUNT"
    return
  fi

  if [[ -n "${BW_PASSWORD:-}" ]]; then
    printf '%s' "$BW_PASSWORD"
    return
  fi

  echo "ERROR: no password retrieval method available. Set BW_PASSWORD_CMD, install secret-tool, or set BW_PASSWORD." >&2
  exit 1
}

BW_PASSWORD_VALUE="$(get_password)"
if [[ -z "$BW_PASSWORD_VALUE" ]]; then
  echo "ERROR: retrieved Bitwarden password is empty" >&2
  exit 1
fi
export BW_PASSWORD="$BW_PASSWORD_VALUE"
unset BW_PASSWORD_VALUE

# Ensure login with API key. Ignore harmless 'already logged in' states.
login_output="$(bw login --apikey 2>&1 || true)"
if [[ "$login_output" != *"You are logged in!"* && "$login_output" != *"You are already logged in as"* ]]; then
  if [[ "$login_output" == *"Logout required before logging in"* ]]; then
    :
  elif [[ "$login_output" == *"You are already logged in as"* ]]; then
    :
  else
    echo "$login_output" >&2
  fi
fi

session="$(bw unlock --passwordenv BW_PASSWORD --raw)"
if [[ -z "$session" ]]; then
  echo "ERROR: bw unlock did not return a session token" >&2
  exit 1
fi

mkdir -p "$(dirname "$BW_SESSION_CACHE")"
printf '%s\n' "$session" > "$BW_SESSION_CACHE"
chmod 600 "$BW_SESSION_CACHE"

printf '%s\n' "$session"
