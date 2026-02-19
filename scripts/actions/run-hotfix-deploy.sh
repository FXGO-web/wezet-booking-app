#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: scripts/actions/run-hotfix-deploy.sh \"reason\" [environment]"
  exit 1
fi

REASON="$1"
ENVIRONMENT="${2:-production}"
REF_BRANCH="$(git branch --show-current)"

if [ -z "$REF_BRANCH" ]; then
  REF_BRANCH="main"
fi

gh workflow run "Hotfix Deploy (Manual)" \
  --ref "$REF_BRANCH" \
  -f environment="$ENVIRONMENT" \
  -f reason="$REASON"

echo "Triggered Hotfix Deploy workflow on ref $REF_BRANCH ($ENVIRONMENT)."
