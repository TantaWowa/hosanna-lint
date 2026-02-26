#!/usr/bin/env bash
set -euo pipefail

# Manual release script - replicates .github/workflows/release.yml for local execution
# Usage: ./scripts/release.sh [version] [npmTag]
#   version: major|minor|patch or specific semver (e.g. 1.2.3, 1.2.3-rc.1). Default: minor
#   npmTag:  npm dist-tag (e.g. latest, next). Default: latest

VERSION_INPUT="${1:-minor}"
NPM_TAG="${2:-latest}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# --- Helpers ---
die() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "==> $*"; }

# --- Pre-flight checks ---
info "Pre-flight checks..."
[[ -n "$(git status --porcelain)" ]] && die "Working directory is not clean. Commit or stash changes first."
[[ -z "${XAI_API_KEY:-}" ]] && die "XAI_API_KEY must be set for changelog generation."
npm whoami &>/dev/null || die "Not logged in to npm. Run 'npm login' first."
command -v gh &>/dev/null || info "gh CLI not found - GitHub Release will be skipped."

# --- Calculate new version ---
info "Calculating new version..."
CURRENT_VERSION=$(node -p 'require("./package.json").version')
echo "Current version: $CURRENT_VERSION"

if [[ "$VERSION_INPUT" =~ ^(major|minor|patch)$ ]]; then
  IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
  MAJOR="${VERSION_PARTS[0]}"
  MINOR="${VERSION_PARTS[1]}"
  PATCH="${VERSION_PARTS[2]%%-*}"  # strip pre-release suffix
  case "$VERSION_INPUT" in
    major) NEW_VERSION="$((MAJOR + 1)).0.0" ;;
    minor) NEW_VERSION="$MAJOR.$((MINOR + 1)).0" ;;
    patch) NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
  esac
  info "Bumping $VERSION_INPUT: $CURRENT_VERSION -> $NEW_VERSION"
else
  if [[ ! "$VERSION_INPUT" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
    die "Invalid version format: $VERSION_INPUT. Use major|minor|patch or semver (e.g. 1.2.3)"
  fi
  NEW_VERSION="$VERSION_INPUT"
  info "Using specific version: $NEW_VERSION"
fi

RELEASE_BRANCH="release/v$NEW_VERSION"

# --- Lint, build, test ---
info "Installing dependencies..."
npm ci
info "Linting..."
npm run lint
info "Building..."
npm run build
info "Running tests..."
npm test

# --- Git setup ---
git config user.name 2>/dev/null || git config user.name "release-script"
git config user.email 2>/dev/null || git config user.email "release@local"

# --- Create release branch ---
info "Creating release branch $RELEASE_BRANCH..."
git fetch origin
git checkout main
git pull origin main

if git ls-remote --heads origin "$RELEASE_BRANCH" 2>/dev/null | grep -q "$RELEASE_BRANCH"; then
  git checkout -B "$RELEASE_BRANCH" origin/"$RELEASE_BRANCH" 2>/dev/null || git checkout "$RELEASE_BRANCH"
  git reset --hard origin/main
else
  git checkout -b "$RELEASE_BRANCH"
fi

# --- Bump version ---
info "Bumping version to $NEW_VERSION..."
npm version "$NEW_VERSION" --no-git-tag-version

# --- Generate changelog ---
info "Generating CHANGELOG.md..."
npm run changelog

# --- Commit ---
info "Committing version and changelog..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): v$NEW_VERSION"

# --- Tag ---
info "Creating tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

# --- Push branch and tag ---
info "Pushing branch and tag..."
git push origin "$RELEASE_BRANCH"
git push origin "v$NEW_VERSION"

# --- Publish to npm ---
info "Publishing to npm (tag: $NPM_TAG)..."
npm publish --access public --tag "$NPM_TAG"

# --- GitHub Release (optional) ---
if command -v gh &>/dev/null; then
  info "Creating GitHub Release..."
  CHANGELOG_ENTRY=$(sed -n '/^## \[/, /^## \[/p' CHANGELOG.md | head -n -1)
  if [[ -n "$CHANGELOG_ENTRY" ]]; then
    echo "$CHANGELOG_ENTRY" | gh release create "v$NEW_VERSION" \
      --title "v$NEW_VERSION" \
      --notes-file -
  else
    gh release create "v$NEW_VERSION" --title "v$NEW_VERSION" --notes "Release v$NEW_VERSION"
  fi
else
  info "Skipping GitHub Release (gh CLI not installed)"
fi

# --- Merge to main ---
info "Merging release branch to main..."
git checkout main
git pull --ff-only origin main
git merge --no-ff "$RELEASE_BRANCH" -m "Merge release v$NEW_VERSION into main"
git push origin main

# --- Calculate next development version ---
info "Calculating next development version..."
if [[ "$NEW_VERSION" =~ -([a-zA-Z0-9.-]+)$ ]]; then
  NEXT_VERSION="${NEW_VERSION%-*}-next"
else
  IFS='.' read -ra VP <<< "$NEW_VERSION"
  MAJ="${VP[0]}"
  MIN="${VP[1]}"
  NEXT_VERSION="$MAJ.$((MIN + 1)).0-next"
fi
info "Next version: $NEXT_VERSION"

# --- Bump to next on main ---
info "Bumping to $NEXT_VERSION on main..."
npm version "$NEXT_VERSION" --no-git-tag-version

# --- Regenerate changelog for next (optional - workflow doesn't do this, but user said "changelog update")
# The workflow only bumps version, not changelog. So we just bump version.
git add package.json package-lock.json
git commit -m "chore: bump version to $NEXT_VERSION"
git push origin main

info "Done! Released v$NEW_VERSION, main is now at $NEXT_VERSION"
