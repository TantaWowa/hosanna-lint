#!/usr/bin/env bash
#
# Release script for hosanna-eslint-plugin.
#
# Usage (npm forwards args after --):
#   npm run release -- patch
#   npm run release -- minor --dry-run
#   npm run release -- major --dry
#
# Options:
#   --dry-run | --dry Preview without making changes
#   --skip-tests      Skip lint and test steps
#   --allow-branch    Allow releasing from a non-main branch (hotfixes)
#
# Prerequisites:
#   - On main branch with clean working directory
#   - npm logged in (npm login)
#   - gh CLI authenticated (for GitHub release)
# npm 2FA: do not use release-it --ci locally (blocks OTP). This script omits --ci so
#   release-it can prompt for OTP, or set NPM_OTP to pass it non-interactively.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# --- Parse arguments ---
BUMP_TYPE=""
DRY_RUN=""
SKIP_TESTS=""
ALLOW_BRANCH=""

for arg in "$@"; do
  case "$arg" in
    major|minor|patch)
      BUMP_TYPE="$arg"
      ;;
    --dry-run|--dry)
      DRY_RUN="--dry-run"
      ;;
    --skip-tests)
      SKIP_TESTS="1"
      ;;
    --allow-branch)
      ALLOW_BRANCH="1"
      ;;
  esac
done

if [ -z "$BUMP_TYPE" ]; then
  echo "Usage: npm run release -- <major|minor|patch> [--dry-run|--dry] [--skip-tests] [--allow-branch]"
  exit 1
fi

# --- Validate branch ---
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ -z "$ALLOW_BRANCH" ]; then
  echo "ERROR: Must be on main branch. Current branch: $BRANCH"
  echo "       For hotfix releases, use: npm run release -- patch --allow-branch"
  exit 1
fi

# --- Validate npm auth (skip for dry run) ---
if [ -z "$DRY_RUN" ]; then
  npm whoami &>/dev/null || { echo "ERROR: Not logged in to npm. Run: npm login"; exit 1; }
fi

# --- Export skip-tests flag for release-it hooks ---
if [ -n "$SKIP_TESTS" ]; then
  export RELEASE_SKIP_TESTS=1
  echo "==> Skipping lint and tests"
fi

echo "==> Starting $BUMP_TYPE release from $BRANCH"
if [ "$BRANCH" = "main" ]; then
  git pull origin main
else
  echo "==> Releasing from non-main branch: $BRANCH (--allow-branch)"
  echo "    Note: version will NOT be bumped to -next on main after release."
fi

# --- Strip -next suffix so release-it can bump cleanly ---
CURRENT_VERSION=$(node -p "require('./package.json').version")
BASE_VERSION=$(echo "$CURRENT_VERSION" | sed 's/-.*$//')

if [ "$CURRENT_VERSION" != "$BASE_VERSION" ]; then
  echo "==> Stripping pre-release suffix: $CURRENT_VERSION -> $BASE_VERSION"
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    pkg.version = '$BASE_VERSION';
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
fi

# --- Run release-it (no --ci: allows npm OTP prompt when 2FA is enabled) ---
REL_OTP=()
if [ -n "${NPM_OTP:-}" ]; then
  REL_OTP=(--npm.otp="$NPM_OTP")
fi
echo "==> Running release-it $BUMP_TYPE $DRY_RUN"
npx release-it "$BUMP_TYPE" $DRY_RUN "${REL_OTP[@]}"
