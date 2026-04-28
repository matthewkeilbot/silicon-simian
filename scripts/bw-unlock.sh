#!/usr/bin/env bash
set -euo pipefail

# Unlock Bitwarden CLI using API key env vars plus a master password fetched at runtime.
# Expected env:
#   BW_CLIENT_ID or BW_CLIENTID
#   BW_CLIENT_SECRET or BW_CLIENTSECRET
# Optional env:
#   BW_SCOPE          default: api
#   BW_GRANT_TYPE     default: client_credentials
#   BW_PASSWORD_CMD   command that prints the Bitwarden master password
#   BW_PASSWORD       fallback plaintext env var (discouraged)
#   BW_SESSION_CACHE  path to write the session token (default: ~/.openclaw/credentials/bitwarden-session)
#   BW_PASSWORD_ATTR_SERVICE (default: bitwarden)
#   BW_PASSWORD_ATTR_ACCOUNT (default: openclaw)
#
# Default password lookup behavior:
#   If secret-tool exists, use:
#     secret-tool lookup service "$BW_PASSWORD_ATTR_SERVICE" account "$BW_PASSWORD_ATTR_ACCOUNT"
#   Otherwise, require BW_PASSWORD_CMD or BW_PASSWORD.

first_set() {
  for name in "$@"; do
    if [[ -n "${!name:-}" ]]; then
      printf '%s' "${!name}"
      return 0
    fi
  done
  return 1
}

BW_CLIENTID="$(first_set BW_CLIENT_ID BW_CLIENTID || true)"
BW_CLIENTSECRET="$(first_set BW_CLIENT_SECRET BW_CLIENTSECRET || true)"
BW_SCOPE="${BW_SCOPE:-api}"
BW_GRANT_TYPE="${BW_GRANT_TYPE:-client_credentials}"

if [[ -z "$BW_CLIENTID" ]]; then
  echo "ERROR: required env var BW_CLIENT_ID or BW_CLIENTID is not set" >&2
  exit 1
fi

if [[ -z "$BW_CLIENTSECRET" ]]; then
  echo "ERROR: required env var BW_CLIENT_SECRET or BW_CLIENTSECRET is not set" >&2
  exit 1
fi

export BW_CLIENTID BW_CLIENTSECRET BW_SCOPE BW_GRANT_TYPE

if ! command -v bw >/dev/null 2>&1; then
  echo "ERROR: bw CLI is not installed or not on PATH" >&2
  exit 1
fi

BW_PASSWORD_ATTR_SERVICE="${BW_PASSWORD_ATTR_SERVICE:-bitwarden}"
BW_PASSWORD_ATTR_ACCOUNT="${BW_PASSWORD_ATTR_ACCOUNT:-openclaw}"
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
