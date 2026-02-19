#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: scripts/actions/commit-push.sh \"commit message\" [branch]"
  exit 1
fi

MESSAGE="$1"
BRANCH="${2:-$(git branch --show-current)}"

if [ -z "$BRANCH" ]; then
  echo "No active branch detected."
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "No staged changes to commit."
  exit 0
fi

git commit -m "$MESSAGE"
git push -u origin "$BRANCH"

echo "Committed and pushed to $BRANCH."
