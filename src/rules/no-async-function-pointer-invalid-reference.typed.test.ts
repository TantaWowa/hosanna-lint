import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import rule from './no-async-function-pointer-invalid-reference';

const cases: Array<[name: string, code: string, errors: number]> = [
  ['contextual fetch property rejects an arrow', 'const options: HsFetchOptions = { postProcessFunction: () => {} };', 1],
  ['contextual fetch call rejects an arrow', 'dispatch({ postProcessFunction: () => {} });', 1],
  ['contextual property rejects function expression', 'dispatch({ postProcessFunction: function process() {} });', 1],
  ['contextual shorthand rejects callback variable', 'const postProcessFunction = () => {}; dispatch({ postProcessFunction });', 1],
  ['contextual method shorthand rejects object method', 'dispatch({ postProcessFunction() {} });', 1],
  ['literal property name preserves pointer provenance', 'dispatch({ ["postProcessFunction"]: () => {} });', 1],
  ['type aliases preserve pointer provenance', 'type Alias = Pointer; const callback: Alias = () => {};', 1],
  ['generic aliases preserve pointer provenance', 'type Identity<T> = T; const callback: Identity<Pointer> = () => {};', 1],
  ['union aliases preserve pointer provenance', 'const callback: MaybePointer = () => {};', 1],
  ['indexed aliases preserve property provenance', 'type Callback = HsFetchOptions["postProcessFunction"]; const callback: Callback = () => {};', 1],
  ['imported call signature rejects arrow argument', 'consume(() => {});', 1],
  ['typed member call rejects arrow argument', 'client.consume(() => {});', 1],
  ['call aliases preserve parameter provenance', 'const accept = client.consume; accept(() => {});', 1],
  ['explicit generic call preserves argument provenance', 'function accept<T>(value: T) {} accept<Pointer>(() => {});', 1],
  ['typed property writes reject arrows', 'let options: HsFetchOptions = {}; options.postProcessFunction = () => {};', 1],
  ['typed function returns reject arrows', 'function create(): Pointer { return () => {}; }', 1],
  ['typed union returns reject arrows', 'function create(): MaybePointer { return () => {}; }', 1],
  ['typed arrow returns reject arrows', 'const create = (): Pointer => () => {};', 1],
  ['contextual arrow return type preserves pointer provenance', 'const create: () => Pointer = () => () => {};', 1],
  ['contextual function return preserves pointer provenance', 'const create: () => Pointer = function () { return () => {}; };', 1],
  ['parameter defaults reject arrows', 'function consumeDefault(callback: Pointer = () => {}) {}', 1],
  ['class field defaults reject arrows', 'class Owner { callback: Pointer = () => {}; }', 1],
  ['explicit pointer casts reject arrows', 'const callback = (() => {}) as Pointer;', 1],
  ['local named functions are not module exports', 'function local() {} consume(local);', 1],
  ['nested same-name functions do not inherit export status', 'export function handler() {} function run() { function handler() {} consume(handler); }', 1],
  ['imported exported arrows are not module functions', 'consume(exportedArrow);', 1],
  ['class methods cannot become named pointers', 'class Owner { callback() {} } consume(new Owner().callback);', 1],
  ['bound module functions lose their identity', 'consume(importedHandler.bind({}));', 1],
  ['untyped aliases of module functions require direct reference', 'const alias = importedHandler; consume(alias);', 1],
  ['conditional callback branch is checked', 'const callback: MaybePointer = flag ? importedHandler : () => {};', 1],
  ['module export is valid in contextual fetch field', 'export function process() {} dispatch({ postProcessFunction: process });', 0],
  ['imported named module function is valid', 'consume(importedHandler);', 0],
  ['named default module function is valid', 'consume(defaultHandler);', 0],
  ['namespace imported module function is valid', 'consume(handlers.handler);', 0],
  ['re-exported named module function is valid', 'consume(reexportedHandler);', 0],
  ['existing pointer parameter can be forwarded', 'function forward(callback: Pointer) { consume(callback); }', 0],
  ['existing pointer property can be forwarded', 'function forward(options: HsFetchOptions) { dispatch({ postProcessFunction: options.postProcessFunction }); }', 0],
  ['optional pointer may be absent', 'const callback: MaybePointer = undefined; dispatch({ postProcessFunction: undefined });', 0],
  ['string union alternative remains valid', 'const callback: Trigger = "loadNext";', 0],
  ['declared pointer factory result can be forwarded', 'function create(): Pointer { return importedHandler; } consume(create());', 0],
  ['already typed pointer aliases preserve serialization', 'const callback: Pointer = importedHandler; consume(callback);', 0],
  ['inferred alias of pointer property can be forwarded', 'function forward(options: HsFetchOptions) { const callback = options.postProcessFunction; if (callback) dispatch({ postProcessFunction: callback }); }', 0],
  ['indexed pointer properties preserve enum key provenance', 'enum Key { Loaded = "loaded" } function forward(options: { loaded?: MaybePointer }) { const callback = options[Key.Loaded]; if (callback) consume(callback); }', 0],
  ['indexed pointer arrays preserve element provenance', 'function forward(values: Pointer[]) { const callback = values[0]; consume(callback); }', 0],
  ['for-of pointer unions preserve element provenance', 'function forward(values: Trigger[]) { for (const callback of values) { if (typeof callback !== "string") consume(callback); } }', 0],
  ['map pointer unions preserve element provenance', 'function forward(values: Trigger[]) { values.map(callback => { if (typeof callback !== "string") consume(callback); }); }', 0],
  ['map over asserted pointer-union arrays preserves provenance', 'function forward(values: unknown) { (values as Trigger[]).map(callback => { if (typeof callback !== "string") consume(callback); }); }', 0],
  ['aliases of pointer arrays preserve map element provenance', 'function forward(values: { callbacks?: Trigger[] }) { const callbacks = values.callbacks as Trigger[] | undefined; callbacks?.map(callback => { if (typeof callback !== "string") consume(callback); }); }', 0],
  ['Array generic preserves for-of element provenance', 'function forward(values: Array<Pointer>) { for (const callback of values) consume(callback); }', 0],
  ['ordinary array callbacks do not become pointers via indexing', 'function forward(values: (() => void)[]) { const callback = values[0]; consume(callback); }', 1],
  ['ordinary array callbacks do not become pointers via for-of', 'function forward(values: (() => void)[]) { for (const callback of values) consume(callback); }', 1],
  ['ordinary array callbacks do not become pointers via map', 'function forward(values: (() => void)[]) { values.map(callback => consume(callback)); }', 1],
  ['inferred ordinary callback property does not become a pointer', 'function forward(options: { postProcessFunction: () => void }) { const callback = options.postProcessFunction; consume(callback); }', 1],
  ['conditional aliases cannot hide a raw callback branch', 'function forward(existing: Pointer) { const callback = flag ? existing : () => {}; consume(callback); }', 1],
  ['indexed unions cannot hide an ordinary callback property', 'function forward(values: { pointer: Pointer; callback: () => void }, key: "pointer" | "callback") { consume(values[key]); }', 1],
  ['ordinary callbacks remain unrestricted', 'ordinary(() => {}); const callback: () => void = () => {};', 0],
  ['ordinary matching property name is not pointer provenance', 'const options: { postProcessFunction?: () => void } = { postProcessFunction: () => {} };', 0],
  ['ordinary matching API name is not pointer provenance', 'interface HsFetchOptions { postProcessFunction?: () => void } const options: HsFetchOptions = { postProcessFunction: () => {} };', 0],
  ['local namesake alias is not Hosanna pointer type', 'type AsyncFunctionPointer = () => void; const callback: AsyncFunctionPointer = () => {};', 0],
  ['ordinary typed returns remain unrestricted', 'function create(): () => void { return () => {}; }', 0],
  ['ordinary generic wrappers remain unrestricted', 'type Identity<T> = T; const callback: Identity<() => void> = () => {};', 0],
];

const directory = '/virtual/hosanna-lint-async-pointer';
const prelude = `
  import { HsFetchOptions, Pointer, MaybePointer, Trigger, dispatch, consume, client, ordinary } from './api';
  import defaultHandler, { handler as importedHandler, exportedArrow } from './handlers';
  import * as handlers from './handlers';
  import { handler as reexportedHandler } from './barrel';
  declare const flag: boolean;
`;
const files = new Map<string, string>([
  [`${directory}/hosanna-ui/globals.d.ts`, 'declare type AsyncFunctionPointer<T extends (...args: any[]) => any = (...args: any[]) => any> = T;'],
  [`${directory}/api.ts`, `
    export interface HsFetchOptions { postProcessFunction?: AsyncFunctionPointer<(response: unknown) => void>; contextData?: unknown; }
    export type Pointer = AsyncFunctionPointer<() => void>;
    export type MaybePointer = Pointer | undefined;
    export type Trigger = string | Pointer;
    export function dispatch(options: HsFetchOptions): void {}
    export function consume(callback: Pointer): void {}
    export const client: { consume(callback: MaybePointer): void } = { consume() {} };
    export function ordinary(callback: () => void): void {}
  `],
  [`${directory}/handlers.ts`, 'export function handler() {} export const exportedArrow = () => {}; export default function defaultHandler() {}'],
  [`${directory}/barrel.ts`, 'export { handler } from "./handlers";'],
  ...cases.map(([, code], index): [string, string] => [`${directory}/case-${index}.ts`, `${code.includes('interface HsFetchOptions') ? prelude.replace('HsFetchOptions, ', '') : prelude}
${code}`]),
]);
const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true };
const diskHost = ts.createCompilerHost(options);
const host: ts.CompilerHost = {
  ...diskHost,
  fileExists: file => files.has(file) || diskHost.fileExists(file),
  readFile: file => files.get(file) ?? diskHost.readFile(file),
  directoryExists: directoryName => [...files.keys()].some(file => file.startsWith(`${directoryName}/`)) || (diskHost.directoryExists?.(directoryName) ?? false),
  getSourceFile: (file, languageVersion, onError, shouldCreateNewSourceFile) => files.has(file)
    ? ts.createSourceFile(file, files.get(file)!, languageVersion, true)
    : diskHost.getSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile),
};
const program = ts.createProgram([...files.keys()], options, host);
const linter = new Linter({ cwd: directory });

describe('AsyncFunctionPointer contextual type provenance', () => {
  it('resolves all fixture imports and types without TypeScript errors', () => {
    expect(program.getSemanticDiagnostics().map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([]);
  });
  it.each(cases.map((entry, index) => ({ name: entry[0], errors: entry[2], index })))('$name', ({ errors, index }) => {
    const filename = `${directory}/case-${index}.ts`;
    const messages = linter.verify(files.get(filename)!, [{
      files: ['**/*.ts'],
      languageOptions: { parser, parserOptions: { programs: [program] } },
      plugins: { hosanna: { rules: { pointer: rule } } },
      rules: { 'hosanna/pointer': 'error' },
    }], { filename });
    expect(messages.filter(message => message.fatal)).toEqual([]);
    expect(messages).toHaveLength(errors);
    for (const message of messages) {
      expect(message.ruleId).toBe('hosanna/pointer');
      expect(message.message).toContain('serialized by module/function name on Roku');
      expect(message.message).toContain('export function handleResponse(response)');
      expect(message.message).toContain('options.contextData');
      expect(message.message).toContain('response.contextData');
    }
  });
});
