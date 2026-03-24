#!/usr/bin/env bash
# git-status-notify.sh — Run git status report and send to MEK control plane via openclaw cron
# This is the cron wrapper that generates the report and pipes it to openclaw for delivery.
set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
REPORT=$("$SCRIPT_DIR/git-status-report.sh" 2>&1)

# Output for openclaw cron to pick up and deliver
echo "$REPORT"
