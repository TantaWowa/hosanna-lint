import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import * as ts from 'typescript';
import { resolve } from 'node:path';
import rule from './focus-target-valid';

const root = resolve(__dirname, '../__test__/focus-target-fixture');
const input = root + '/input.ts';
const fixtures: Record<string, string> = {
  '/hosanna-ui/views/lib/view-api.ts': `
    export interface ViewState { id?: string; nextFocusMap?: Record<string, string | undefined> }
    export class ViewStruct<T = ViewState> {
      id(value: string): this { return this; }
      nextFocusMap(value: Record<string, string | undefined>): this { return this; }
      text(value: string): this { return this; }
      onInputEvent(handler: () => void): this { return this; }
      onFindNextFocusable(handler: () => unknown): this { return this; }
    }
    export enum NextViewFocus { Exit = 'exit', Maintain = 'maintain', None = 'none' }
  `,
  '/hosanna-ui/views/lib/BaseView.ts': `
    import { ViewStruct } from './view-api';
    export class BaseView {
      protected getViews(): ViewStruct[] | undefined { return undefined; }
      protected decorateViews(views: ViewStruct[] | undefined): ViewStruct[] | undefined { return views; }
      addSubView(view: unknown): void {}
    }
  `,
  '/Button-generated-struct.ts': `
    import { ViewStruct, ViewState } from './hosanna-ui/views/lib/view-api';
    export class GeneratedBaseStruct<T extends ViewState = ViewState> extends ViewStruct<T> {}
    export class ButtonViewStruct<T extends ViewState = ViewState> extends GeneratedBaseStruct<T> {}
    export declare function Button<T extends ViewState = ViewState>(state?: ViewState): ButtonViewStruct<T>;
    export declare function Group(children: ViewStruct[]): ViewStruct;
  `,
  '/barrel.ts': `export { Button as Control, Group } from './Button-generated-struct';`,
};
const imports = `
  import { BaseView } from './hosanna-ui/views/lib/BaseView';
  import { ViewStruct, NextViewFocus } from './hosanna-ui/views/lib/view-api';
  import { Button, Group } from './Button-generated-struct';
  import { Control } from './barrel';
`;
function lint(body: string, typed = true) {
  const code = imports + body;
  const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true, types: [], noLib: true };
  const host = ts.createCompilerHost(options, true);
  const files = new Map(Object.entries(fixtures).map(([path, source]) => [root + path, source]));
  files.set(input, code);
  host.getSourceFile = (name, version) => files.has(name) ? ts.createSourceFile(name, files.get(name)!, version, true) : undefined;
  host.resolveModuleNames = (names, containing) => names.map(name => {
    const filename = resolve(containing, '..', name) + '.ts';
    return files.has(filename) ? { resolvedFileName: filename, extension: ts.Extension.Ts } : undefined;
  });
  const program = ts.createProgram([input], options, host);
  return new Linter().verify(code, [{
    files: ['**/*.ts'],
    languageOptions: { parser, parserOptions: typed ? { programs: [program] } : {} },
    plugins: { candidate: { rules: { focus: rule } } },
    rules: { 'candidate/focus': 'error' },
  }], { filename: input });
}
function view(body: string, members = '') { return `class Menu extends BaseView { getViews() { ${body} } ${members} }`; }

describe('focus-target-valid', () => {
  it.each([
    ['literal state', 'return [Button({ id: "play", nextFocusMap: { right: "detailsButon" } }), Button({ id: "detailsButton" })];'],
    ['fluent setter', 'return [Button().id("play").nextFocusMap({ right: "detailsButon" }), Button().id("detailsButton")];'],
    ['nested inline declarations', 'return [Group([Button({ id: "play" }).nextFocusMap({ right: "detailsButon" }), Button({ id: "detailsButton" })])];'],
    ['import alias', 'return [Control({ id: "play" }).nextFocusMap({ right: "detailsButon" }), Control({ id: "detailsButton" })];'],
    ['const arrays and props', 'const props = { id: "detailsButton" }; const controls = [Button(props)]; return [Button({ id: "play" }).nextFocusMap({ right: "detailsButon" }), ...controls];'],
    ['unrelated dynamic target does not hide typo', 'return [Button({ id: "play" }).nextFocusMap({ right: "detailsButon", left: this.external }), Button({ id: "detailsButton" })];'],
    ['computed literal properties', 'return [Button({ ["id"]: "play", ["nextFocusMap"]: { ["right"]: "detailsButon" } }), Button({ id: "detailsButton" })];'],
    ['unrelated string is not a declared ID', 'const note = "detailsButon"; return [Button({ id: "play" }).text(note).nextFocusMap({ right: "detailsButon" }), Button({ id: "detailsButton" })];'],
    ['deferred callback is not executed', 'return [Button({ id: "play" }).onInputEvent(() => this.performAction()).nextFocusMap({ right: "detailsButon" }), Button({ id: "detailsButton" })];'],
  ])('reports %s', (_name, body) => {
    const messages = lint(view(body, 'external!: string; performAction() {}'));
    expect(messages.map(message => message.messageId)).toEqual(['missingTarget']);
    expect(messages[0].message).toContain('Did you mean "detailsButton"?');
    expect(messages[0].message).toContain('owned by "Menu"');
    expect(messages[0].message).toContain('focus-boundary contract');
  });

  it.each([
    ['escaped props can change IDs', 'const props = { id: "old" }; const ignored = mutate(props); return [Button({ id: "play" }).nextFocusMap({ right: "added" }), Button(props)];'],
    ['mutated fluent alias', 'const a = Button({ id: "old" }); const b = a.id("target"); return [Button({ id: "play" }).nextFocusMap({ right: "target" }), a];'],
    ['mutation within a const initializer', 'const controls = [Button({ id: "play" }).nextFocusMap({ right: "added" })]; const ignored = controls.push(Button({ id: "added" })); return controls;'],
    ['matching target', 'return [Button({ id: "play" }).nextFocusMap({ right: "detailsButton" }), Button({ id: "detailsButton" })];'],
    ['fluent id wins', 'return [Button({ id: "play" }).nextFocusMap({ right: "replacement" }), Button({ id: "old" }).id("replacement")];'],
    ['fluent map wins', 'return [Button({ id: "play", nextFocusMap: { right: "missing" } }).nextFocusMap({ right: "detailsButton" }), Button({ id: "detailsButton" })];'],
    ['sentinels and undefined', 'return [Button({ id: "play" }).nextFocusMap({ right: NextViewFocus.Exit, left: "maintain", up: "none", down: undefined })];'],
    ['dynamic id leaves scope open', 'return [Button({ id: this.dynamic }).nextFocusMap({ right: "missing" })];'],
    ['dynamic target', 'return [Button({ id: "play" }).nextFocusMap({ right: this.dynamic })];'],
    ['unknown spread can change IDs', 'return [Button({ ...this.props }).nextFocusMap({ right: "missing" })];'],
    ['unknown sibling factory', 'return [Button({ id: "play" }).nextFocusMap({ right: "missing" }), this.makeExtra()];'],
    ['unknown siblings', 'return [Button({ id: "play" }).nextFocusMap({ right: "missing" }), ...this.extra];'],
    ['mutated declarations', 'const items = [Button({ id: "play" }).nextFocusMap({ right: "missing" })]; items.push(Button({ id: "missing" })); return items;'],
    ['automatic ID with runtime owner', 'return [Button().nextFocusMap({ right: "owner-1" }), Button()];'],
    ['custom focus replaces map', 'return [Button({ id: "play" }).nextFocusMap({ right: "missing" }).onFindNextFocusable(() => this.target)];'],
    ['unresolved map spread', 'return [Button({ id: "play" }).nextFocusMap({ right: "missing", ...this.map })];'],
    ['different owner tree is unresolved factory', 'return [Button({ id: "play" }).nextFocusMap({ right: "externalChild" }), this.externalComponent()];'],
  ])('accepts or leaves unverified %s', (_name, body) => {
    expect(lint(view(body, 'dynamic!: string; props!: any; extra!: ViewStruct[]; map!: any; target!: any; makeExtra(): ViewStruct { return Button(); } externalComponent(): ViewStruct { return Button(); }'))).toEqual([]);
  });

  it('checks each complete return branch rather than pooling their IDs', () => {
    const messages = lint(view('if (this.ready) return [Button({ id: "a" }).nextFocusMap({ right: "b" })]; return [Button({ id: "b" })];', 'ready = true;'));
    expect(messages.map(message => message.messageId)).toEqual(['missingTarget']);
  });
  it('skips scopes with inherited decorator injection', () => {
    expect(lint('class Parent extends BaseView { decorateViews(views: ViewStruct[]) { return views; } } class Child extends Parent { getViews() { return [Button({ id: "a" }).nextFocusMap({ right: "injected" })]; } }')).toEqual([]);
  });
  it('skips owners that imperatively add views', () => {
    expect(lint(view('return [Button({ id: "a" }).nextFocusMap({ right: "injected" })];', 'attach() { this.addSubView({ id: "injected" }); }'))).toEqual([]);
  });
  it.each([
    ['super call', 'super.addSubView({ id: "injected" });'],
    ['computed member', 'this["addSubView"]({ id: "injected" });'],
    ['computed super member', 'super["addSubView"]({ id: "injected" });'],
    ['wrapped receiver', '(this as BaseView).addSubView({ id: "injected" });'],
  ])('leaves owner open for imperative %s', (_name, mutation) => {
    expect(lint(view('return [Button({ id: "a" }).nextFocusMap({ right: "injected" })];', `attach() { ${mutation} }`))).toEqual([]);
  });
  it('leaves owner open for mutation inherited through generic intermediates', () => {
    expect(lint(`
      class Grandparent extends BaseView { attach() { this.addSubView({ id: "injected" }); } }
      class Parent<T> extends Grandparent { data?: T; }
      class Child extends Parent<string> {
        getViews() { return [Button({ id: "a" }).nextFocusMap({ right: "injected" })]; }
      }
    `)).toEqual([]);
  });
  it('still checks a closed owner inherited through generic intermediates', () => {
    const messages = lint(`
      class Parent<T> extends BaseView { data?: T; }
      class Child extends Parent<string> {
        getViews() { return [Button({ id: "a" }).nextFocusMap({ right: "missing" })]; }
      }
    `);
    expect(messages.map(message => message.messageId)).toEqual(['missingTarget']);
  });
  it('ignores unrelated methods/classes and strings', () => {
    expect(lint('class Other { getViews() { return [Button({ id: "a" }).nextFocusMap({ right: "b" })]; } } const text = "nextFocusMap: missing";')).toEqual([]);
  });
  it('does not claim typed validation without a project', () => {
    expect(lint(view('return [Button({ id: "a" }).nextFocusMap({ right: "missing" })];'), false)).toEqual([]);
  });
});
