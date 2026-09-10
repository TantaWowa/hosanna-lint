import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import rule from './app-config-style-key-valid';

describe('app-config-style-key-valid config selection', () => {
  let root: string;
  const code = (key: string) => `const card = { styleKey: "${key}" };`;
  function write(file: string, value: unknown): void {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
  }
  function lint(source: string, inputs?: string[], typed = false) {
    const filename = path.join(root, 'src/input.ts');
    write('src/input.ts', source);
    const program = typed ? ts.createProgram([filename], { noLib: true, strict: true, target: ts.ScriptTarget.ES2020 }) : undefined;
    return new Linter({ cwd: root }).verify(source, [{
      files: ['**/*.ts'],
      languageOptions: { parser, parserOptions: program ? { programs: [program] } : {} },
      plugins: { hosanna: { rules: { style: rule } } },
      rules: { 'hosanna/style': ['error', ...(inputs ? [{ appConfigInputs: inputs }] : [])] },
    }], { filename });
  }
  function namedApps() {
    write('assets/meta/app.config.alpha.json', { $extendFile: './app.config.json', controls: { Alpha: { default: {} } } });
    write('assets/meta/app.config.beta.json', { $extendFile: './app.config.json', controls: { Beta: { default: {} } } });
    write('.hosanna-tools/run.json', {
      schemaVersion: 1,
      apps: {
        alpha: { appConfig: 'alpha' },
        beta: { appConfig: 'beta' },
      },
    });
  }

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(tmpdir(), 'hosanna-style-inputs-'));
    write('assets/meta/app.config.json', { controls: { Base: { default: {} } } });
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('retains the legacy config when no inputs are declared', () => {
    expect(lint(code('controls.Base.default'))).toEqual([]);
    const messages = lint(code('controls.Missing.default'));
    expect(messages.map(message => message.messageId)).toEqual(['invalidStyleKey']);
    expect(messages[0].message).toContain('"assets/meta/app.config.json"');
  });

  it('accepts a brand-owned key in shared source without merging the brand configs', () => {
    namedApps();
    expect(lint(code('controls.Alpha.default'))).toEqual([]);
    expect(lint(code('controls.Beta.default'))).toEqual([]);
    expect(lint(code('controls.Base.default'))).toEqual([]);
  });

  it('reports a path absent from every declared alternative and names those inputs', () => {
    namedApps();
    const messages = lint(code('controls.Missing.default'));
    expect(messages.map(message => message.messageId)).toEqual(['invalidStyleKey']);
    expect(messages[0].message).toContain('all inspected AppConfig inputs after inheritance');
    expect(messages[0].message).toContain('"assets/meta/app.config.alpha.json"');
    expect(messages[0].message).toContain('"assets/meta/app.config.beta.json"');
    expect(messages[0].message).toContain('does not infer runtime reachability across brands');
  });

  it('keeps exact wrong-brand checks with an explicit per-file selection', () => {
    namedApps();
    expect(lint(code('controls.Alpha.default'), ['alpha'])).toEqual([]);
    const messages = lint(code('controls.Alpha.default'), ['beta']);
    expect(messages.map(message => message.messageId)).toEqual(['invalidStyleKey']);
    expect(messages[0].message).not.toContain('app.config.alpha.json');
  });

  it('accepts an explicitly selected set as alternatives, including absolute inputs', () => {
    namedApps();
    expect(lint(code('controls.Beta.default'), ['alpha', path.join(root, 'assets/meta/app.config.beta.json')])).toEqual([]);
  });

  it('checks a typed BaseView defaultStyleKey against the selected brand', () => {
    namedApps();
    write('src/hosanna-ui/views/lib/BaseView.ts', 'export class BaseView {}');
    const source = 'import { BaseView } from "./hosanna-ui/views/lib/BaseView"; class Card extends BaseView { protected defaultStyleKey = "controls.Alpha.default"; }';
    expect(lint(source, undefined, true)).toEqual([]);
    expect(lint(source, ['beta'], true).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('follows a named compiler input and platform expression inheritance', () => {
    write('assets/meta/app.config.phone.json', { $extendFile: './app.config.json', controls: { Phone: { default: {} } } });
    write('app-config/brand/phone.json', { $extendFile: '../../assets/meta/app.config.phone.json' });
    write('.hosanna-tools/run.json', {
      schemaVersion: 1,
      apps: { brand: { appConfigCompiler: { enabled: true }, platforms: { ios: { appConfigCompiler: { input: 'app-config/brand/phone.json' } } } } },
    });
    expect(lint(code('controls.Phone.default'))).toEqual([]);
    expect(lint(code('controls.Base.default'))).toEqual([]);
  });

  it('prefers a declared compiler input over the fallback appConfig in its scope', () => {
    namedApps();
    write('.hosanna-tools/run.json', { apps: { brand: { appConfig: 'alpha', appConfigCompiler: { enabled: true, input: 'beta' } } } });
    expect(lint(code('controls.Beta.default'))).toEqual([]);
    expect(lint(code('controls.Alpha.default')).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('uses appConfig when that scope explicitly disables its compiler', () => {
    namedApps();
    write('.hosanna-tools/run.json', { defaults: { appConfig: 'alpha', appConfigCompiler: { enabled: false, input: 'beta' } } });
    expect(lint(code('controls.Alpha.default'))).toEqual([]);
    expect(lint(code('controls.Beta.default')).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('reads defaults and declared environment/platform compiler inputs', () => {
    namedApps();
    write('.hosanna-tools/run.json', { defaults: { platforms: { web: { appConfig: 'alpha' } }, environments: { prod: { platforms: { roku: { appConfigCompiler: { input: 'beta' } } } } } } });
    expect(lint(code('controls.Alpha.default'))).toEqual([]);
    expect(lint(code('controls.Beta.default'))).toEqual([]);
  });

  it('does not discover an unrelated config from the filesystem or unknown run keys', () => {
    write('assets/meta/app.config.stray.json', { controls: { Stray: { default: {} } } });
    write('.hosanna-tools/run.json', { metadata: { appConfig: 'stray' }, defaults: { appConfig: 'app.config.json' } });
    expect(lint(code('controls.Stray.default')).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('skips missing-path assertions while a declared generated input is unavailable', () => {
    namedApps();
    write('.hosanna-tools/run.json', { apps: { alpha: { appConfig: 'alpha' }, generated: { appConfigCompiler: { input: 'generated/app.config.json' } } } });
    expect(lint(code('controls.Missing.default'))).toEqual([]);
    write('generated/app.config.json', { controls: {} });
    expect(lint(code('controls.Missing.default')).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('does not let an unresolved unselected app suppress an explicit scope', () => {
    namedApps();
    write('.hosanna-tools/run.json', { apps: { generated: { appConfig: 'missing' } } });
    expect(lint(code('controls.Alpha.default'), ['beta']).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it.each(['not JSON', { schemaVersion: 2 }, []])('does not claim absence from an unreadable run selection: %s', run => {
    write('.hosanna-tools/run.json', run);
    expect(lint(code('controls.Missing.default'))).toEqual([]);
    expect(lint(code('controls.Missing.default'), ['app.config.json']).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('refreshes cached config content even when its modification time is restored', () => {
    namedApps();
    const target = path.join(root, 'assets/meta/app.config.alpha.json');
    const before = fs.statSync(target);
    expect(lint(code('controls.Alpha.default'), ['alpha'])).toEqual([]);
    write('assets/meta/app.config.alpha.json', { controls: { Other: { default: {} } } });
    fs.utimesSync(target, before.atime, before.mtime);
    expect(lint(code('controls.Alpha.default'), ['alpha']).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('refreshes cached parent configs', () => {
    namedApps();
    expect(lint(code('controls.Base.default'))).toEqual([]);
    write('assets/meta/app.config.json', { controls: {} });
    expect(lint(code('controls.Base.default')).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('refreshes cached run selections', () => {
    namedApps();
    expect(lint(code('controls.Alpha.default'))).toEqual([]);
    write('.hosanna-tools/run.json', { apps: { beta: { appConfig: 'beta' } } });
    expect(lint(code('controls.Alpha.default')).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('notices a newly added run selector after legacy fallback was cached', () => {
    expect(lint(code('controls.Alpha.default')).map(message => message.messageId)).toEqual(['invalidStyleKey']);
    namedApps();
    expect(lint(code('controls.Alpha.default'))).toEqual([]);
  });

  it('retries an unresolved inherited file after that file becomes available', () => {
    write('assets/meta/app.config.child.json', { $extendFile: './app.config.parent.json' });
    expect(lint(code('controls.Missing.default'), ['child'])).toEqual([]);
    write('assets/meta/app.config.parent.json', { controls: {} });
    expect(lint(code('controls.Missing.default'), ['child']).map(message => message.messageId)).toEqual(['invalidStyleKey']);
  });

  it('still checks direct font formats even when config selection is unresolved', () => {
    expect(lint('const label = { fontKey: "Small,zero" };', ['missing']).map(message => message.messageId)).toEqual(['invalidFontKeyFormat']);
  });
});
