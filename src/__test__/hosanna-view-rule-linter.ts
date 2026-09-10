import { Linter, Rule } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const frameworkFiles: Record<string, string> = {
  'hosanna-ui/views/lib/view-api.ts': `
    export interface ViewState { id?: string; title?: string }
    export interface IHosannaView<T = ViewState> {
      renderer: object;
      onMount(parent: IHosannaView): void;
      onUnmount(): void;
      setState(state: Partial<T>): void;
      release(): void;
      getRenderer(): object;
    }
    export class ViewStruct<T = ViewState> {
      setState(state: T): void {}
    }
  `,
  'hosanna-ui/views/lib/BaseView.ts': `
    import { IHosannaView, ViewState } from './view-api';
    export class BaseView<T extends ViewState = ViewState> implements IHosannaView<T> {
      renderer: object = {};
      onMount(parent: IHosannaView): void {}
      onUnmount(): void {}
      setState(state: Partial<T>): void {}
      release(): void {}
      getRenderer(): object { return this.renderer; }
    }
  `,
  'hosanna-ui/lib/BaseApp.ts': `
    import { BaseView } from '../views/lib/BaseView';
    export class BaseApp extends BaseView {}
  `,
  'hosanna-ui/lib/decorators.ts': 'export function view(name: string): ClassDecorator { return () => {}; }',
  'hosanna-ui/hosanna-api.ts': `
    export interface IInstancePool { get<T>(name: string): T; release(value: unknown): void }
  `,
  'hosanna-list/CollectionViewSupplementaryView.ts': `
    import { IHosannaView } from '../hosanna-ui/views/lib/view-api';
    export class CollectionViewSupplementaryView {
      protected row!: { parent: IHosannaView; container: { appendChild(node: object): void } };
      protected fragment?: { viewsById: Record<string, { text: string }> };
      protected onConfigure(): void {}
      protected onContentChanged(): void {}
      protected onPresentationChanged(state: unknown): void {}
      protected prepareFragmentData(data: Record<string, unknown>): Record<string, unknown> { return data; }
      protected measureHeight(): number { return 40; }
      onWillRelease(): void {}
    }
  `,
  'namesakes.ts': `
    export class BaseView<T = unknown> { onMount(parent: unknown): void {} setState(state: unknown): void {} }
    export class CollectionViewSupplementaryView { protected onConfigure(): void {} }
    export function view(name: string): ClassDecorator { return () => {}; }
    export interface IInstancePool { get<T>(name: string): T }
  `,
};

export const viewImports = `
  import { BaseView } from './hosanna-ui/views/lib/BaseView';
  import { ViewState, ViewStruct, IHosannaView } from './hosanna-ui/views/lib/view-api';
  import { BaseApp } from './hosanna-ui/lib/BaseApp';
  import { view } from './hosanna-ui/lib/decorators';
  import { IInstancePool } from './hosanna-ui/hosanna-api';
  import { CollectionViewSupplementaryView } from './hosanna-list/CollectionViewSupplementaryView';
`;

/** Use the actual ESLint parser and TypeScript program for every asserted case. */
export function lintViewFixture(code: string, rule: Rule.RuleModule, options: unknown[] = [], typed = true): Linter.LintMessage[] {
  const root = mkdtempSync(path.join(tmpdir(), 'hosanna-view-lint-'));
  try {
    for (const [filename, content] of Object.entries(frameworkFiles)) {
      const absolute = path.join(root, filename);
      mkdirSync(path.dirname(absolute), { recursive: true });
      writeFileSync(absolute, content);
    }
    const filename = path.join(root, 'app.ts');
    const source = viewImports + code;
    writeFileSync(filename, source);
    const program = ts.createProgram([filename], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      experimentalDecorators: true,
      strict: true,
      noLib: true,
    });
    const linter = new Linter({ cwd: root });
    return linter.verify(source, [{
      files: ['**/*.ts'],
      languageOptions: { parser, parserOptions: typed ? { programs: [program], tsconfigRootDir: root } : {} },
      plugins: { candidate: { rules: { check: rule } } },
      rules: { 'candidate/check': ['error', ...options] as Linter.RuleEntry },
    }], { filename });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
