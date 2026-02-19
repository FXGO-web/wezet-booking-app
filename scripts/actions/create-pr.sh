#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: scripts/actions/create-pr.sh \"PR title\" [base-branch]"
  exit 1
fi

TITLE="$1"
BASE_BRANCH="${2:-main}"
CURRENT_BRANCH="$(git branch --show-current)"

if [ -z "$CURRENT_BRANCH" ]; then
  echo "No active branch detected."
  exit 1
fi

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
  echo "Current branch equals base branch ($BASE_BRANCH). Create a feature/hotfix branch first."
  exit 1
fi

gh pr create \
  --base "$BASE_BRANCH" \
  --head "$CURRENT_BRANCH" \
  --title "$TITLE" \
  --fill

echo "PR created from $CURRENT_BRANCH to $BASE_BRANCH."
