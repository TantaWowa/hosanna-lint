# Releasing @tantawowa/hosanna-eslint-plugin

## Quick Start

```bash
npm run release -- patch         # 1.31.0-next → 1.31.1
npm run release -- minor         # 1.31.0-next → 1.32.0
npm run release -- major         # 1.31.0-next → 2.0.0
```

Dry run (preview without making changes):

```bash
npm run release -- patch --dry-run
# or
npm run release -- patch --dry
```

Use `--` after `release` so npm passes bump and flags to the script. If you write `npm run release patch --dry`, npm does not forward `--dry` to the script.

## What Happens

When you run a release command, the following steps execute automatically in order:

1. **Validate** — confirms you're on `main`, logged in to npm
2. **Pull** — `git pull origin main`
3. **Strip suffix** — removes `-next` from the current version
4. **Bump version** — increments patch/minor/major in `package.json`
5. **Build** — `npm run build`
6. **Lint** — `npm run lint`
7. **Test** — `npm run test`
8. **Generate changelog** — conventional changelog (`@release-it/conventional-changelog`, angular preset)
9. **Commit & tag** — `chore(release): vX.Y.Z`
10. **Publish to npm** — `npm publish --access public`
11. **Push** — pushes commit and tag to origin
12. **GitHub Release** — creates a GitHub Release
13. **Bump to next** — sets version to `X.Y.Z-next`, commits, pushes

If any step fails, the process stops before publishing.

## Prerequisites

### npm Authentication

```bash
npm login
```

You must be logged in to npm with publish access to `@tantawowa/hosanna-eslint-plugin`.

If your npm account uses **2FA** for publishes, the release script does **not** pass `--ci` to release-it so you can be prompted for a one-time password at publish time. To pass the code without a prompt (e.g. automation): `NPM_OTP=123456 npm run release -- patch` (code expires quickly).

Run `npm pkg fix` if npm warns about `repository` during publish; the repo uses the canonical `git+https://…` form.

### Environment Variables

```bash
# Required: GitHub CLI must be authenticated
# Run: gh auth login
```

### Tools

- Node 18+
- GitHub CLI (`gh`) — authenticated via `gh auth login`
- `npm install` completed (installs `release-it` and other deps)

## Options

Pass extra flags after `--`:

```bash
# Skip lint and tests (use with caution)
npm run release -- patch --skip-tests

# Release from a non-main branch (hotfix)
npm run release -- patch --allow-branch
```

## Hotfix Releases

To release from a non-main branch (e.g., a hotfix branch), use `--allow-branch`:

```bash
# 1. Create hotfix branch from the release tag
git checkout -b hotfix/1.31.1 v1.31.0

# 2. Apply your fix, commit

# 3. Release from the hotfix branch
npm run release -- patch --allow-branch

# 4. Merge the fix back to main
git checkout main && git merge hotfix/1.31.1
```

When releasing from a non-main branch, the post-release `-next` version bump is skipped.

## Troubleshooting

**"Must be on main branch"** — Switch to main (`git checkout main`) or use `--allow-branch` for hotfix releases.

**"Not logged in to npm"** — Run `npm login` first.

**Build/test failure** — The release aborts before publishing. Fix the issue and re-run.

**Dry run shows unexpected version** — The script strips `-next` then bumps. If current version is `1.31.0-next` and you run `npm run release -- patch`, the result is `1.31.1` (strips to `1.31.0`, bumps patch).
