#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Usage:
  scripts/actions/run-action.sh quick "commit message" [branch]
  scripts/actions/run-action.sh pr "commit message" "PR title" [base-branch]
  scripts/actions/run-action.sh hotfix "commit message" "reason" [environment]

Modes:
  quick   Commit + push using scripts/actions/commit-push.sh
  pr      Commit + push + create PR
  hotfix  Commit + push + trigger Hotfix Deploy workflow
EOF
}

if [ $# -lt 2 ]; then
  usage
  exit 1
fi

MODE="$1"
shift

case "$MODE" in
  quick)
    COMMIT_MESSAGE="$1"
    BRANCH="${2:-$(git branch --show-current)}"
    scripts/actions/commit-push.sh "$COMMIT_MESSAGE" "$BRANCH"
    ;;

  pr)
    if [ $# -lt 2 ]; then
      usage
      exit 1
    fi
    COMMIT_MESSAGE="$1"
    PR_TITLE="$2"
    BASE_BRANCH="${3:-main}"
    scripts/actions/commit-push.sh "$COMMIT_MESSAGE"
    scripts/actions/create-pr.sh "$PR_TITLE" "$BASE_BRANCH"
    ;;

  hotfix)
    if [ $# -lt 2 ]; then
      usage
      exit 1
    fi
    COMMIT_MESSAGE="$1"
    REASON="$2"
    ENVIRONMENT="${3:-production}"
    scripts/actions/commit-push.sh "$COMMIT_MESSAGE"
    scripts/actions/run-hotfix-deploy.sh "$REASON" "$ENVIRONMENT"
    ;;

  *)
    usage
    exit 1
    ;;
esac

