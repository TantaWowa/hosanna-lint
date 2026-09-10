import { Linter, Rule } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import { resolve } from 'node:path';

const fixtureRoot = resolve(__dirname, 'get-views-side-effects-fixtures');
const inputFile = `${fixtureRoot}/input.ts`;
const fixtures: Record<string, string> = {
  'hosanna-ui/views/lib/view-api.ts': `
    export interface IHosannaView { setState(state: Record<string, unknown>): void; }
    export class ViewStruct {
      onClick(callback: () => void): this { return this; }
      onInputEvent(callback: () => void): this { return this; }
      setState(state: Record<string, unknown>): this { return this; }
    }
  `,
  'hosanna-ui/views/lib/BaseView.ts': `
    import { IHosannaView, ViewStruct } from './view-api';
    import { INotificationCenter } from '../../lib/notification-api';
    import { TimerService } from '../../../hosanna-bridge-core/TimerService';
    export class BaseView implements IHosannaView {
      protected notificationCenter!: INotificationCenter;
      protected getViews(): ViewStruct[] { return []; }
      setState(state: Record<string, unknown>): void {}
    }
  `,
  'hosanna-ui/lib/notification-api.ts': `
    export interface INotificationCenter {
      subscribe(name: string, callback: () => void): object;
      dispatch(notification: { name: string }): void;
      unsubscribe(name: string, handle: object): void;
    }
  `,
  'hosanna-ui/lib/NotificationCenter.ts': `
    export declare class NotificationCenter {
      subscribe(name: string, callback: () => void): object;
      dispatch(notification: { name: string }): void;
    }
  `,
  'hosanna-ui/hosanna-api.ts': `
    export declare class HsObservable {
      addObserver(key: string, owner: object, handler: (key: string, value: unknown) => void): void;
    }
  `,
  'hosanna-bridge-core/TimerService.ts': `
    export declare class TimerService {
      setTimer(callback: () => void, delay?: number, repeat?: boolean): number;
      setTimeout(callback: () => void, delay?: number): number;
      setInterval(callback: () => void, delay?: number): number;
      registerTickable(owner: object, id?: string): void;
    }
  `,
  'barrel.ts': `
    export { BaseView as FrameworkView } from '@hs-src/hosanna-ui/views/lib/BaseView';
    export { NotificationCenter as Center } from '@hs-src/hosanna-ui/lib/NotificationCenter';
  `,
  'namesakes.ts': `
    export class BaseView { protected getViews(): unknown[] { return []; } setState(state: object): void {} }
    export class NotificationCenter { subscribe(name: string, callback: () => void): void {} dispatch(note: unknown): void {} }
    export class TimerService { setTimeout(callback: () => void): void {} setTimer(callback: () => void): void {} registerTickable(owner: object): void {} }
    export class HsObservable { addObserver(key: string, owner: object, callback: () => void): void {} }
  `,
};

export const getViewsEffectImports = `
  import { BaseView } from '@hs-src/hosanna-ui/views/lib/BaseView';
  import { ViewStruct, IHosannaView } from '@hs-src/hosanna-ui/views/lib/view-api';
  import { INotificationCenter } from '@hs-src/hosanna-ui/lib/notification-api';
  import { NotificationCenter } from '@hs-src/hosanna-ui/lib/NotificationCenter';
  import { HsObservable } from '@hs-src/hosanna-ui/hosanna-api';
  import { TimerService } from '@hs-src/hosanna-bridge-core/TimerService';
  declare const center: INotificationCenter;
  declare const concreteCenter: NotificationCenter;
  declare const observable: HsObservable;
  declare const timers: TimerService;
  declare const anotherView: IHosannaView;
`;

/** Exercise real ESLint diagnostics and TypeScript standard-library/API provenance. */
export function lintGetViewsEffects(rule: Rule.RuleModule, code: string, typed = true): Linter.LintMessage[] {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    skipLibCheck: true,
    types: [],
  };
  const files = new Map(Object.entries(fixtures).map(([name, source]) => [`${fixtureRoot}/${name}`, source]));
  const source = `${getViewsEffectImports}\n${code}`;
  files.set(inputFile, source);
  const host = ts.createCompilerHost(options, true);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => {
    const text = files.get(file);
    return text === undefined ? originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile)
      : ts.createSourceFile(file, text, languageVersion, true);
  };
  host.resolveModuleNames = (names, containingFile) => names.map(name => {
    const file = name.startsWith('@hs-src/') ? `${fixtureRoot}/${name.slice('@hs-src/'.length)}.ts`
      : resolve(containingFile, '..', `${name}.ts`);
    return files.has(file) ? { resolvedFileName: file, extension: ts.Extension.Ts } : undefined;
  });
  const program = typed ? ts.createProgram([inputFile], options, host) : undefined;
  return new Linter().verify(source, [{
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: { ...(program ? { programs: [program] } : {}), ecmaVersion: 2020, sourceType: 'module' },
    },
    plugins: { candidate: { rules: { effects: rule } } },
    rules: { 'candidate/effects': 'error' },
  }], { filename: inputFile });
}
