import { Linter, Rule } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';

const root = '/virtual/hosanna-lint-ownership-batching';
const input = `${root}/input.ts`;
const fixtures: Record<string, string> = {
  'hosanna-bridge-core/brs-api.ts': 'export interface IIdentifiable { id: string }',
  'hosanna-bridge-core/decorators.ts': 'export declare function inject(): PropertyDecorator;',
  'hosanna-bridge-core/AppUtils.ts': 'export declare class AppUtils { static resolve<T>(name: string): T }',
  'hosanna-ui/lib/renderer-api.ts': `export enum ViewPhase { Initial, Pending, Mounted, Unmounted, Hibernating }`,
  'hosanna-ui/views/lib/BaseView.ts': `
    import { ViewPhase } from '../../lib/renderer-api';
    export class BaseView {
      release(): void { this.onUnmount(); }
      onUnmount(): void {}
      onMount(): void {}
      protected onConfigure(): void {}
      protected onViewPhaseChange(_phase: ViewPhase): void {}
      onAppear(): void {}
      onDisappear(): void {}
      onDidAppearInAggregateView(_view: unknown): void { this.onAppear(); }
      onDidReappearInAggregateView(_view: unknown): void { this.onAppear(); }
      onDisappearFromAggregateView(_view: unknown): void { this.onDisappear(); }
      onWillRemoveFromAggregateView(_view: unknown): void {}
      onDidRemoveFromAggregateView(_view: unknown): void {}
    }
  `,
  'hosanna-ui/lib/BaseApp.ts': `import { BaseView } from '../views/lib/BaseView'; export class BaseApp extends BaseView {}`,
  'hosanna-list/CollectionViewSupplementaryView.ts': `export class CollectionViewSupplementaryView { protected onConfigure(): void {} onWillRelease(): void {} onWillReuse(): void {} }`,
  'hosanna-ui/lib/notification-api.ts': `
    import { IIdentifiable } from '../../hosanna-bridge-core/brs-api';
    export interface INotification { name: string }
    export type Handler = (notification: INotification) => void;
    export interface INotificationCenter { subscribe(name: string, handler: Handler): IIdentifiable; unsubscribe(name: string, handler: Handler | IIdentifiable): void }
    export declare function onNotification(name: string): MethodDecorator;
  `,
  'hosanna-ui/lib/NotificationCenter.ts': `
    import { IIdentifiable } from '../../hosanna-bridge-core/brs-api';
    import { INotificationCenter, Handler } from './notification-api';
    export declare class NotificationCenter implements INotificationCenter { subscribe(name: string, handler: Handler): IIdentifiable; unsubscribe(name: string, handler: Handler | IIdentifiable): void }
  `,
  'hosanna-list/CollectionViewDataSource.ts': `
    import { IIdentifiable } from '../hosanna-bridge-core/brs-api';
    export interface IDataSourceChange { rowId?: string }
    export declare class CollectionViewDataSource {
      constructor(rows: unknown[]);
      onDataSourceChanged(callback: (changes: IDataSourceChange[]) => void): void;
      removeOnDataSourceChanged(callback: (changes: IDataSourceChange[]) => void): void;
      applyUpdates(): void;
      updateItem(rowId: string, index: number, item: IIdentifiable, applyNow?: boolean): void;
      appendItemsToRow(rowId: string, items: IIdentifiable[], applyNow?: boolean): void;
      insertItemsToRow(rowId: string, items: IIdentifiable[], index: number, applyNow?: boolean): void;
      removeItemsFromRow(rowId: string, start: number, end: number, applyNow?: boolean): void;
      addLoadedItemsToRow(rowId: string, items: IIdentifiable[], applyNow?: boolean): void;
      appendRows(rows: unknown[], index?: number, applyNow?: boolean): void;
      removeRow(rowId: string, applyNow?: boolean): void;
      UpdateRowConfiguration(row: object, data: object, applyNow?: boolean): void;
    }
  `,
  'barrel.ts': `export { INotificationCenter as Center } from './hosanna-ui/lib/notification-api'; export { CollectionViewDataSource as Source } from './hosanna-list/CollectionViewDataSource';`,
};
export const ownershipImports = `
  import { BaseView } from '@hs-src/hosanna-ui/views/lib/BaseView';
  import { ViewPhase } from '@hs-src/hosanna-ui/lib/renderer-api';
  import { BaseApp } from '@hs-src/hosanna-ui/lib/BaseApp';
  import { CollectionViewSupplementaryView } from '@hs-src/hosanna-list/CollectionViewSupplementaryView';
  import { INotificationCenter, INotification, onNotification } from '@hs-src/hosanna-ui/lib/notification-api';
  import { NotificationCenter } from '@hs-src/hosanna-ui/lib/NotificationCenter';
  import { CollectionViewDataSource, IDataSourceChange } from '@hs-src/hosanna-list/CollectionViewDataSource';
  import { IIdentifiable } from '@hs-src/hosanna-bridge-core/brs-api';
  import { inject } from '@hs-src/hosanna-bridge-core/decorators';
  import { AppUtils } from '@hs-src/hosanna-bridge-core/AppUtils';
`;

export function lintOwnershipBatching(rule: Rule.RuleModule, code: string, typed = true, extraFiles: Record<string, string> = {}) {
  const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true, experimentalDecorators: true, skipLibCheck: true, types: [] };
  const host = ts.createCompilerHost(options, true);
  const files = new Map(Object.entries({ ...fixtures, ...extraFiles }).map(([name, source]) => [`${root}/${name}`, source]));
  const source = ownershipImports + code;
  files.set(input, source);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (filename, version, onError, fresh) => files.has(filename) ? ts.createSourceFile(filename, files.get(filename)!, version, true) : getSourceFile(filename, version, onError, fresh);
  host.resolveModuleNames = (names, containing) => names.map(name => {
    const parts = (name.startsWith('@hs-src/') ? `${root}/${name.slice(8)}` : `${containing.slice(0, containing.lastIndexOf('/'))}/${name}`).split('/');
    const normalized: string[] = [];
    for (const part of parts) { if (part === '..') normalized.pop(); else if (part !== '.') normalized.push(part); }
    const filename = normalized.join('/') + '.ts';
    return files.has(filename) ? { resolvedFileName: filename, extension: ts.Extension.Ts } : undefined;
  });
  const program = typed ? ts.createProgram([input], options, host) : undefined;
  const messages = new Linter({ cwd: root }).verify(source, [{
    files: ['**/*.ts'],
    languageOptions: { parser, parserOptions: { sourceType: 'module', ...(program ? { programs: [program] } : {}) } },
    plugins: { candidate: { rules: { check: rule } } }, rules: { 'candidate/check': 'warn' },
  }], { filename: input });
  return { messages, diagnostics: () => program ? ts.getPreEmitDiagnostics(program).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')) : [] };
}
