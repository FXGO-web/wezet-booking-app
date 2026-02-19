#!/usr/bin/env bash
set -euo pipefail

BUMP="${1:-auto}"

case "$BUMP" in
  auto|patch|minor|major)
    ;;
  *)
    echo "Usage: scripts/actions/run-release.sh [auto|patch|minor|major]"
    exit 1
    ;;
esac

gh workflow run "Release" \
  --ref main \
  -f bump_override="$BUMP"

echo "Triggered Release workflow on main (bump_override=$BUMP)."
