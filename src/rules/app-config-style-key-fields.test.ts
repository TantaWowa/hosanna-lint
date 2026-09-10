import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import rule from './app-config-style-key-valid';

describe('app-config-style-key-valid class fields and view defaults', () => {
  let root: string;
  let filename: string;
  let baseFile: string;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(tmpdir(), 'hosanna-style-fields-'));
    filename = path.join(root, 'app.ts');
    baseFile = path.join(root, 'hosanna-ui/views/lib/BaseView.ts');
    fs.mkdirSync(path.dirname(baseFile), { recursive: true });
    fs.writeFileSync(baseFile, 'export class BaseView<T> { protected defaultStyleKey?: string; }');
    fs.mkdirSync(path.join(root, 'assets/meta'), { recursive: true });
    fs.writeFileSync(path.join(root, 'assets/meta/app.config.base.json'), JSON.stringify({
      controls: { Card: { default: { width: 100 } } },
      theme: { fonts: { heading: 'Medium,20' } },
    }));
    fs.writeFileSync(path.join(root, 'assets/meta/app.config.json'), JSON.stringify({
      $extendFile: './app.config.base.json', styles: { active: {} },
    }));
  });

  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  function lint(body: string, typed = true) {
    const code = `import { BaseView as FrameworkView } from './hosanna-ui/views/lib/BaseView';\n${body}`;
    fs.writeFileSync(filename, code);
    const program = ts.createProgram([filename, baseFile], {
      strict: true, noLib: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
    });
    return new Linter({ cwd: root }).verify(code, [{
      files: ['**/*.ts'],
      languageOptions: { parser, parserOptions: typed ? { programs: [program] } : {} },
      plugins: { hosanna: { rules: { style: rule } } },
      rules: { 'hosanna/style': 'error' },
    }], { filename });
  }

  it.each([
    `class CardView extends FrameworkView<{}> { protected defaultStyleKey = 'controls.Card.default'; }`,
    `class Middle extends FrameworkView<{}> {} class CardView extends Middle { defaultStyleKey = 'styles.active'; }`,
    `class CardView extends FrameworkView<{}> { defaultStyleKey = getDynamicKey(); }`,
    `class CardView extends FrameworkView<{}> { update() { this.defaultStyleKey = 'controls.Card.default'; } }`,
    `class Other { defaultStyleKey = 'missing.path'; }`,
    `class BaseView {} class Other extends BaseView { defaultStyleKey = 'missing.path'; }`,
    `const other = { defaultStyleKey: 'missing.path' }; other.defaultStyleKey = 'missing.again';`,
    `class Settings { styleKey = 'styles.active'; fontKey = 'Medium,20'; fontStyleKey = 'theme.fonts.heading'; }`,
    `class Settings { styleKey = dynamic; }`,
    `class Settings { static styleKey = 'styles.active'; }`,
    `class CardView extends FrameworkView<{}> { static defaultStyleKey = 'unused.static'; }`,
    `const name = 'unrelated'; const value = { [name]: 'missing.path' }; value[name] = 'missing.path';`,
  ])('accepts %s', code => expect(lint(code)).toEqual([]));

  it.each([
    `class CardView extends FrameworkView<{}> { protected defaultStyleKey = 'controls.Card.typo'; }`,
    `class Middle extends FrameworkView<{}> {} class CardView extends Middle { defaultStyleKey = 'controls.Card.typo'; }`,
    `class CardView extends FrameworkView<{}> { update() { this.defaultStyleKey = 'controls.Card.typo'; } }`,
    `class CardView extends FrameworkView<{}> { ['defaultStyleKey'] = 'controls.Card.typo'; }`,
    `class CardView extends FrameworkView<{}> { update() { this['defaultStyleKey'] = 'controls.Card.typo'; } }`,
    `class Settings { styleKey = 'controls.Card.typo'; }`,
    `class Settings { static styleKey = 'controls.Card.typo'; }`,
    `class CardView extends FrameworkView<{}> { defaultStyleKey = 'controls.Card.typo' as const; }`,
    `class Settings { settingsKey = 'controls.Card.typo'; }`,
    `class Settings { cellSettingsKey = 'controls.Card.typo'; }`,
    `class Settings { loadingCellStyleKey = 'controls.Card.typo'; }`,
    `class Settings { fontStyleKey = 'controls.Card.typo'; }`,
    `const settings = { 'styleKey': 'controls.Card.typo' };`,
    `const settings = { ['styleKey']: 'controls.Card.typo' };`,
    `class Settings { styleKey = active ? 'styles.active' : 'controls.Card.typo'; }`,
  ])('reports the missing path and remedy: %s', code => {
    const messages = lint(code);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('invalidStyleKey');
    expect(messages[0].message).toContain('controls.Card.typo');
    expect(messages[0].message).toContain('merged app.config.json');
    expect(messages[0].message).toContain('Use an existing config path, or define');
  });

  it('does not guess view identity without type information', () => {
    expect(lint(`class CardView extends FrameworkView<{}> { defaultStyleKey = 'missing.path'; }`, false)).toEqual([]);
  });
});
