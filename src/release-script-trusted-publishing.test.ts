import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';

const repositoryRoot = resolve(__dirname, '..');
const fixtureRoots: string[] = [];

interface CommandCall {
  command: string;
  args: string[];
  ci?: string;
  skipTests?: string;
}

const fakeCommand = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const command = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const record = (name, values) => fs.appendFileSync(process.env.RELEASE_TEST_TRACE,
  JSON.stringify({ command: name, args: values, ci: process.env.CI,
    skipTests: process.env.RELEASE_SKIP_TESTS }) + '\\n');
record(command, args);
if (command === 'git') {
  if (args.join(' ') === 'branch --show-current') {
    process.stdout.write('main\\n');
  } else if (args.join(' ') !== 'pull origin main') {
    process.exit(91);
  }
} else if (command === 'npm') {
  if (args[0] === 'whoami') {
    process.exit(process.env.RELEASE_TEST_NPM_AUTH === '1' ? 0 : 1);
  }
  if (args[0] !== 'run' || !['build', 'lint', 'test'].includes(args[1])) {
    process.exit(92);
  }
  if (args[1] === process.env.RELEASE_TEST_FAIL_STEP) process.exit(17);
} else if (command === 'npx' && args[0] === 'release-it') {
  if (!args.includes('--npm.skipChecks')) {
    const auth = spawnSync('npm', ['whoami'], { stdio: 'ignore' });
    if (auth.status !== 0) process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync('.release-it.json', 'utf8'));
  const validation = spawnSync('bash', ['-c', config.hooks['after:bump']], { stdio: 'inherit' });
  if (validation.status !== 0) process.exit(validation.status || 1);
  // Record delegation only. This fixture never invokes npm publish.
  if (config.npm.publish && !args.includes('--no-npm.publish')) {
    record('publish-delegated', config.npm.publishArgs);
  }
} else {
  process.exit(93);
}
`;

function runRelease(args: string[], environment: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'hosanna-lint-release-auth-'));
  fixtureRoots.push(root);
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'bin'));
  copyFileSync(join(repositoryRoot, 'scripts/release.sh'), join(root, 'scripts/release.sh'));
  copyFileSync(join(repositoryRoot, '.release-it.json'), join(root, '.release-it.json'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '1.0.0-next' }));
  for (const command of ['git', 'npm', 'npx']) {
    writeFileSync(join(root, 'bin', command), fakeCommand, { mode: 0o755 });
  }
  const trace = join(root, 'commands.jsonl');
  writeFileSync(trace, '');
  const result = spawnSync('bash', ['scripts/release.sh', ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      PATH: [join(root, 'bin'), dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter),
      CI: 'false',
      RELEASE_TEST_TRACE: trace,
      ...environment,
    },
  });
  const calls = readFileSync(trace, 'utf8').trim().split('\n')
    .filter(Boolean).map((line): CommandCall => JSON.parse(line));
  return { result, calls, version: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version };
}

const trustedEnvironment = {
  GITHUB_TOKEN: 'fixture-token',
  GITHUB_REPOSITORY: 'fixture/hosanna-lint',
};

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('release script trusted publishing authentication', () => {
  it('uses OIDC-compatible preflight while keeping every release validation hook', () => {
    const { result, calls, version } = runRelease(['minor', '--ci'], trustedEnvironment);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(version).toBe('1.0.0');
    expect(calls.find(call => call.command === 'npx')).toEqual({
      command: 'npx', args: ['release-it', 'minor', '--ci', '--npm.skipChecks'], ci: 'true',
    });
    expect(calls.filter(call => call.command === 'npm').map(call => call.args))
      .toEqual([['run', 'build'], ['run', 'lint'], ['run', 'test']]);
    expect(calls.every(call => call.skipTests === undefined)).toBe(true);
    expect(calls.at(-1)).toEqual({ command: 'publish-delegated', args: ['--access public'], ci: 'true' });
  });

  it('rejects a local release without npm login before changing the version', () => {
    const { result, calls, version } = runRelease(['patch']);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Not logged in to npm');
    expect(version).toBe('1.0.0-next');
    expect(calls.map(call => [call.command, ...call.args]))
      .toEqual([['git', 'branch', '--show-current'], ['npm', 'whoami']]);
  });

  it('keeps release-it npm preflight for an authenticated local release', () => {
    const { result, calls } = runRelease(['patch'], { RELEASE_TEST_NPM_AUTH: '1' });

    expect(result.status).toBe(0);
    expect(calls.find(call => call.command === 'npx')).toEqual({
      command: 'npx', args: ['release-it', 'patch'], ci: 'false',
    });
    expect(calls.filter(call => call.command === 'npm' && call.args[0] === 'whoami')).toHaveLength(2);
  });

  it.each(['GITHUB_TOKEN', 'GITHUB_REPOSITORY'])('requires %s for trusted releases', missing => {
    const { result, calls, version } = runRelease(['patch', '--ci'], {
      ...trustedEnvironment, [missing]: '',
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Trusted CI releases require');
    expect(version).toBe('1.0.0-next');
    expect(calls.map(call => call.command)).toEqual(['git']);
  });

  it.each(['build', 'lint', 'test'])('aborts publication when the %s hook fails', step => {
    const { result, calls } = runRelease(['minor', '--ci'], {
      ...trustedEnvironment, RELEASE_TEST_FAIL_STEP: step,
    });

    expect(result.status).toBe(17);
    expect(calls.at(-1)?.args).toEqual(['run', step]);
    expect(calls.some(call => call.command === 'publish-delegated')).toBe(false);
  });
});
