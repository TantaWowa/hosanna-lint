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
    expect(resolveAppConfigInput(tempDir, 'phone')).toBe(path.join(metaDir, 'app.config.phone.json'));
  });

  it('deep merges parent and child config', () => {
    writeConfig('app.config.json', {
      rows: { base: { a: true } },
      theme: { colors: { white: '#fff', black: '#000' }, fonts: { body: 'Medium,20' } },
      cells: ['base'],
    });
    const child = writeConfig('app.config.phone.json', {
      $extendFile: './app.config.json',
      rows: { phone: { b: true } },
      theme: { colors: { white: '#eee' } },
      cells: ['phone'],
    });

    expect(resolveAppConfigFromFile(child).config).toEqual({
      rows: { base: { a: true }, phone: { b: true } },
      theme: { colors: { white: '#eee', black: '#000' }, fonts: { body: 'Medium,20' } },
      cells: ['phone'],
    });
  });

  it('uses the parsed child config instead of re-reading the child file', () => {
    const child = path.join(metaDir, 'app.config.phone.json');
    writeConfig('app.config.json', {
      rows: { base: true },
      theme: { colors: { white: '#fff' } },
    });

    const result = resolveAppConfigFromParsedFile(child, {
      $extendFile: './app.config.json',
      rows: { phone: true },
      theme: { colors: 'disabled' },
    });

    expect(result.config).toEqual({
      rows: { base: true, phone: true },
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
