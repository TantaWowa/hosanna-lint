import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { resolveAppConfigFromFile, resolveAppConfigFromParsedFile, resolveAppConfigInput, validateExtendFileUsage } from './app-config-resolver';

describe('app-config-resolver', () => {
  let tempDir: string;
  let metaDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'hosanna-lint-config-'));
    metaDir = path.join(tempDir, 'assets', 'meta');
    fs.mkdirSync(metaDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writeConfig(name: string, value: unknown): string {
    const filePath = path.join(metaDir, name);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
    return filePath;
  }

  it('resolves short selectors to app.config variants', () => {
    expect(resolveAppConfigInput(tempDir, 'simulator')).toBe(path.join(metaDir, 'app.config.simulator.json'));
  });

  it('deep merges parent and child config', () => {
    writeConfig('app.config.json', {
      rows: { base: { a: true } },
      theme: { colors: { white: '#fff', black: '#000' }, fonts: { body: 'Medium,20' } },
      cells: ['base'],
    });
    const child = writeConfig('app.config.simulator.json', {
      $extendFile: './app.config.json',
      rows: { simulator: { b: true } },
      theme: { colors: { white: '#eee' } },
      cells: ['simulator'],
    });

    expect(resolveAppConfigFromFile(child).config).toEqual({
      rows: { base: { a: true }, simulator: { b: true } },
      theme: { colors: { white: '#eee', black: '#000' }, fonts: { body: 'Medium,20' } },
      cells: ['simulator'],
    });
  });

  it('uses the parsed child config instead of re-reading the child file', () => {
    const child = path.join(metaDir, 'app.config.simulator.json');
    writeConfig('app.config.json', {
      rows: { base: true },
      theme: { colors: { white: '#fff' } },
    });

    const result = resolveAppConfigFromParsedFile(child, {
      $extendFile: './app.config.json',
      rows: { simulator: true },
      theme: { colors: 'disabled' },
    });

    expect(result.config).toEqual({
      rows: { base: true, simulator: true },
      theme: { colors: 'disabled' },
    });
  });

  it('rejects nested $extendFile', () => {
    expect(() => validateExtendFileUsage({ nested: { $extendFile: './x.json' } }, 'app.config.json')).toThrow(/root/);
  });

  it('detects circular inheritance', () => {
    const a = writeConfig('app.config.a.json', { $extendFile: './app.config.b.json' });
    writeConfig('app.config.b.json', { $extendFile: './app.config.a.json' });

    expect(() => resolveAppConfigFromFile(a)).toThrow(/Circular app config inheritance/);
  });
});
