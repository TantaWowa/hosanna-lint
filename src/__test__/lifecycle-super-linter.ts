import { Linter, Rule } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const frameworkFiles: Record<string, string> = {
  'hosanna-ui/views/lib/BaseView.ts': `export class BaseView {
    release(): void {} onWillReuse(): void {} onMount(parent: BaseView, childIndex = -1): void {} onUnmount(): void {}
  }`,
  'hosanna-list/CollectionViewSupplementaryView.ts': `export class CollectionViewSupplementaryView {
    onWillRelease(): void {} onWillReuse(): void {} protected onConfigure(): void {} protected onContentChanged(): void {}
  }`,
  'hosanna-list/CollectionView.ts': `import { BaseView } from '../hosanna-ui/views/lib/BaseView';
    export class CollectionViewView extends BaseView { override release(): void {} }`,
  'barrel.ts': `export { BaseView as ImportedBase } from './hosanna-ui/views/lib/BaseView';`,
  'namesakes.ts': `export class BaseView { release(): void {} onWillReuse(): void {} }
    export class CollectionViewSupplementaryView { onWillRelease(): void {} onWillReuse(): void {} }`,
};

export function lintLifecycleFixture(code: string, rule: Rule.RuleModule, options: { typed?: boolean; filename?: string } = {}): Linter.LintMessage[] {
  const root = mkdtempSync(path.join(tmpdir(), 'hosanna-lifecycle-super-'));
  try {
    for (const [filename, content] of Object.entries(frameworkFiles)) {
      const absolute = path.join(root, filename);
      mkdirSync(path.dirname(absolute), { recursive: true });
      writeFileSync(absolute, content);
    }
    const filename = path.join(root, options.filename ?? 'app.ts');
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, code);
    const program = ts.createProgram([filename], {
      target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs, strict: true, noLib: true,
    });
    return new Linter({ cwd: root }).verify(code, [{
      files: ['**/*.ts'],
      languageOptions: { parser, parserOptions: options.typed === false ? {} : { programs: [program], tsconfigRootDir: root } },
      plugins: { candidate: { rules: { check: rule } } },
      rules: { 'candidate/check': 'error' },
    }], { filename });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
