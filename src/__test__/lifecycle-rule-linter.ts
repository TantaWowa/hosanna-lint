import { Linter, Rule } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import { resolve } from 'path';

const fixtureRoot = resolve(__dirname, 'lifecycle-rules');
const inputFile = `${fixtureRoot}/input.ts`;
const notificationModule = `${fixtureRoot}/hosanna-ui/lib/notification-api.ts`;
const notificationCenterModule = `${fixtureRoot}/hosanna-ui/lib/NotificationCenter.ts`;
const dataSourceModule = `${fixtureRoot}/hosanna-list/CollectionViewDataSource.ts`;
const barrelModule = `${fixtureRoot}/notification-barrel.ts`;
const fixtures = new Map<string, string>([
  [notificationModule, `
    export interface INotification<T = undefined> { name: string; data: T; }
    export interface IIdentifiable { id: string; }
    export type Handler = (notification: INotification<unknown>) => void;
    export interface INotificationCenter {
      subscribe(name: string, handler: Handler): IIdentifiable;
      unsubscribe(name: string, handler: Handler | IIdentifiable): void;
    }
    export declare function onNotification(name: string): (...args: any[]) => void;
  `],
  [notificationCenterModule, `
    import { Handler, IIdentifiable, INotificationCenter } from '@hs-src/hosanna-ui/lib/notification-api';
    export declare class NotificationCenter implements INotificationCenter {
      subscribe(name: string, handler: Handler): IIdentifiable;
      unsubscribe(name: string, handler: Handler | IIdentifiable): void;
    }
  `],
  [dataSourceModule, `
    export declare class CollectionViewDataSource {
      onDataSourceChanged(callback: (changes: unknown[]) => void): void;
      removeOnDataSourceChanged(callback: (changes: unknown[]) => void): void;
    }
  `],
  [barrelModule, `export { onNotification as notification, INotificationCenter as Center } from '@hs-src/hosanna-ui/lib/notification-api';`],
]);

/** Real TypeScript symbols and real ESLint diagnostics, without a mutable on-disk test input. */
export function lintLifecycleRule(rule: Rule.RuleModule, code: string, typed = true): Linter.LintMessage[] {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    experimentalDecorators: true,
    skipLibCheck: true,
    types: [],
  };
  const host = ts.createCompilerHost(options, true);
  const files = new Map(fixtures);
  files.set(inputFile, code);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const source = files.get(fileName);
    return source === undefined ? originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) : ts.createSourceFile(fileName, source, languageVersion, true);
  };
  host.resolveModuleNames = names => names.map(name => {
    const fileName = name.startsWith('@hs-src/') ? `${fixtureRoot}/${name.slice('@hs-src/'.length)}.ts` : name === './notification-barrel' ? barrelModule : undefined;
    return fileName && files.has(fileName) ? { resolvedFileName: fileName, extension: ts.Extension.Ts } : undefined;
  });
  const program = typed ? ts.createProgram([inputFile], options, host) : undefined;
  const linter = new Linter();
  return linter.verify(code, [{
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ...(program ? { programs: [program] } : {}),
      },
    },
    plugins: { lifecycle: { rules: { tested: rule } } },
    rules: { 'lifecycle/tested': 'error' },
  }], { filename: inputFile });
}
