#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const releasedVersion = process.argv[2];
if (!releasedVersion) {
  console.error('Usage: release-bump-next.js <version>');
  process.exit(1);
}

const nextVersion = `${releasedVersion}-next`;
const packagePath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.version = nextVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`==> Bumped to ${nextVersion} for next development cycle`);

// Commit and push
execSync('git add package.json', { stdio: 'inherit' });
execSync(`git commit -m "chore: bump version to ${nextVersion}"`, { stdio: 'inherit' });
execSync('git push origin main', { stdio: 'inherit' });

console.log(`==> Main branch updated to ${nextVersion}`);
