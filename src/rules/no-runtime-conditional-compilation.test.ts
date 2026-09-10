import { describe, expect, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import pluginModule from '../index';
import rule from './no-runtime-conditional-compilation';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

// Register RuleTester cases during Vitest collection, with each case reported as a test.
class VitestRuleTester extends RuleTester {
  static describe = describe;
  static it = it;
}

const ruleTester = new VitestRuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
    globals: { __ROKU__: 'readonly', __DEV__: 'readonly' },
  },
});

const runtimeUse = { messageId: 'runtimeUse' };
const definitionOrMutation = { messageId: 'definitionOrMutation' };

describe('no-runtime-conditional-compilation', () => {
  describe('preserves direct compiler tests and reports every executable directive use outside compiler tests', () => {
    ruleTester.run('no-runtime-conditional-compilation', rule, {
      valid: [
        'if (__ROKU__) { renderRoku(); } if (!__ROKU__) { renderNative(); }',
        'if (!(__DEV__ || __ROKU__) && true) { render(); }',
        'if (__UNKNOWN__ && !__CUSTOM_2__) { render(); }',
        'if (__ROKU__) { if (ready()) { render(); } }',
        'if (ready()) { if (__ROKU__) { render(); } }',
        'declare const __ROKU__: boolean; declare const __DEV__: boolean;',
        'declare global { const __ROKU__: boolean; }',
        'declare function native(__ROKU__: boolean): void;',
        'type Native = (__ROKU__: boolean) => void;',
        'import type { __ROKU__ } from "./types";',
        'const flags = { __ROKU__: false }; flags.__ROKU__ = true; use(flags.__ROKU__);',
        'const { __ROKU__: roku } = flags; use(roku);',
        'interface Flags { __ROKU__: boolean } type Platform = typeof __ROKU__; type Other = __SomeType__;',
        'const fixture = "return __ROKU__;"; // return __DEV__; ',
        'const nativeGlobal = globalThis.__HS_ANDROID_LAUNCH_ARGS__; use(nativeGlobal);',
        'Object.assign(config, { __ROKU__: false, __DEV__: true });',
        'Object.assign(globalThis, { __HS_NATIVE_SERVICE_EVENT__: handler });',
        'function install(Object) { Object.assign(globalThis, { __ROKU__: false }); }',
        'Object.defineProperty(config, "__ROKU__", { value: false });',
        'Object.defineProperty(globalThis, "__HS_NATIVE_SERVICE_EVENT__", { value: handler });',
        'const ordinary = globalThis.__proto__; use(ordinary);',
        'function inspect(globalThis) { return globalThis.__DEV__; }',
        'const window = { __DEV__: true }; use(window.__DEV__);',
        'const local = {}; const { __DEV__: dev } = local; use(dev);',
        'const host = globalThis; host.__HS_NATIVE_SERVICE_EVENT__ = handler; use(host.__HS_NATIVE_SERVICE_EVENT__);',
        'if (runtimeCondition) { render(); }',
      ],
      invalid: [
        { code: 'const kind = typeof __ROKU__;', errors: [runtimeUse] },
        { code: 'if (typeof __ROKU__ !== "undefined") { render(); }', errors: [runtimeUse] },
        { code: 'const kind = typeof globalThis.__ROKU__;', errors: [runtimeUse] },
        { code: 'target = __ROKU__;', errors: [runtimeUse] },
        { code: '__ROKU__ = false;', errors: [definitionOrMutation] },
        { code: '__ROKU__ ||= false;', errors: [definitionOrMutation] },
        { code: '__ROKU__++;', errors: [definitionOrMutation] },
        { code: '({ value: __ROKU__ } = flags);', errors: [definitionOrMutation] },
        { code: '[__ROKU__] = flags;', errors: [definitionOrMutation] },
        { code: 'for (__ROKU__ of flags) { render(); }', errors: [definitionOrMutation] },
        { code: 'for (__ROKU__ in flags) { render(); }', errors: [definitionOrMutation] },
        { code: 'for (let __ROKU__ of flags) { render(); }', errors: [definitionOrMutation] },
        { code: 'const __ROKU__ = false;', errors: [definitionOrMutation] },
        { code: 'let __ROKU__;', errors: [definitionOrMutation] },
        { code: 'const { value: __ROKU__ } = flags;', errors: [definitionOrMutation] },
        { code: 'function configured(__ROKU__: boolean) {}', errors: [definitionOrMutation] },
        { code: 'const configured = (__ROKU__: boolean) => false;', errors: [definitionOrMutation] },
        { code: 'globalThis.__ROKU__ = false;', errors: [definitionOrMutation] },
        { code: 'globalThis["__DEV__"] = true;', errors: [definitionOrMutation] },
        { code: 'const host = globalThis; host.__ROKU__ = false;', errors: [definitionOrMutation] },
        { code: 'Object.assign(globalThis, { __ROKU__: false });', errors: [definitionOrMutation] },
        { code: 'const host = globalThis; Object.assign(host, { "__DEV__": true });', errors: [definitionOrMutation] },
        { code: 'Object.assign(globalThis, { ["__ROKU__"]: false }, { __DEV__: true });', errors: [definitionOrMutation, definitionOrMutation] },
        { code: 'Object.defineProperty(globalThis, "__ROKU__", { value: false });', errors: [definitionOrMutation] },
        { code: 'const host = globalThis; Object.defineProperty(host, "__DEV__", { get() { return true; } });', errors: [definitionOrMutation] },
        { code: 'use(() => __ROKU__);', errors: [runtimeUse] },
        { code: 'const config = { enabled: () => __ROKU__ };', errors: [runtimeUse] },
        { code: 'const configured = (enabled = __ROKU__) => enabled;', errors: [runtimeUse] },
        { code: 'const { enabled = __ROKU__ } = flags;', errors: [runtimeUse] },
        { code: 'function isRokuRuntime(): boolean { return __ROKU__; }', errors: [runtimeUse] },
        { code: 'const isRokuRuntime = () => __ROKU__;', errors: [runtimeUse] },
        { code: 'const roku = __ROKU__; if (roku) { render(); }', errors: [runtimeUse] },
        { code: 'function platform() { return !__ROKU__; }', errors: [runtimeUse] },
        { code: 'const renderer = __ROKU__ ? rokuRenderer : nativeRenderer;', errors: [runtimeUse] },
        { code: 'configure(__ROKU__);', errors: [runtimeUse] },
        { code: 'function configure(enabled = __ROKU__) {}', errors: [runtimeUse] },
        { code: 'const roku = globalThis.__ROKU__;', errors: [runtimeUse] },
        { code: 'const dev = globalThis["__DEV__"];', errors: [runtimeUse] },
        { code: 'if ((globalThis as Globals).__DEV__) { render(); }', errors: [runtimeUse] },
        { code: 'if (globalThis.__ROKU__) { render(); }', errors: [runtimeUse] },
        { code: 'const custom = window.__CUSTOM_FLAG__;', errors: [runtimeUse] },
        { code: 'global.__ROKU__ ||= true;', errors: [definitionOrMutation] },
        { code: 'const host = globalThis; const alias = host; use(alias.__ROKU__);', errors: [runtimeUse] },
        { code: 'const { __ROKU__: roku } = globalThis;', errors: [runtimeUse] },
        { code: 'const { "__ROKU__": roku } = globalThis;', errors: [runtimeUse] },
        { code: 'const host = globalThis; const { __DEV__: dev } = host;', errors: [runtimeUse] },
        { code: 'let roku; ({ ["__ROKU__"]: roku } = globalThis);', errors: [runtimeUse] },
        { code: 'if (self?.__ROKU__) { render(); }', errors: [runtimeUse] },
        { code: 'const flags = { roku: __ROKU__ };', errors: [runtimeUse] },
        { code: 'const flags = { __ROKU__ };', errors: [runtimeUse] },
        { code: 'const flags = [__ROKU__];', errors: [runtimeUse] },
        { code: 'const flags = { [__ROKU__]: true };', errors: [runtimeUse] },
        { code: 'if (__ROKU__ && ready()) { render(); }', errors: [runtimeUse] },
        { code: 'if (ready() || __ROKU__) { render(); }', errors: [runtimeUse] },
        { code: 'if (__ROKU__ === true) { render(); }', errors: [runtimeUse] },
        { code: 'if (Boolean(__ROKU__)) { render(); }', errors: [runtimeUse] },
        { code: 'if (__ROKU__ as boolean) { render(); }', errors: [runtimeUse] },
        { code: 'if (__ROKU__ ?? false) { render(); }', errors: [runtimeUse] },
        { code: 'while (__ROKU__) { render(); }', errors: [runtimeUse] },
        { code: 'if (ready()) { render(); } else if (__ROKU__) { renderRoku(); }', errors: [runtimeUse] },
        { code: 'if (__ROKU__) { renderRoku(); } else { renderNative(); }', errors: [runtimeUse] },
        { code: 'if (ready()) { use(__ROKU__); }', errors: [runtimeUse] },
        { code: 'if (__ROKU__) { use(__DEV__); }', errors: [runtimeUse] },
        { code: 'const telemetry = __SCROLL_JANK_TELEMETRY__;', errors: [runtimeUse] },
        { code: 'const custom = __customFlag__;', errors: [runtimeUse] },
        { code: 'const flags = __ROKU__ && __DEV__;', errors: [runtimeUse, runtimeUse] },
      ],
    });
  });

  describe('explains why the construct is wrong and points to the correct compiler mechanism', () => {
    ruleTester.run('no-runtime-conditional-compilation', rule, {
      valid: [],
      invalid: [
        {
          code: 'const enabled = __ROKU__;',
          errors: [{ message: /Compiler directive __ROKU__ may only appear.*compile-time branch pruning.*if \(__ROKU__\).*nest runtime conditions/ }],
        },
        {
          code: '__ROKU__ = false;',
          errors: [{ message: /Do not define or assign compiler directive __ROKU__.*Set ROKU in hsconfig\.json buildFlags.*if \(__ROKU__\)/ }],
        },
      ],
    });
  });

  describe('honors the existing directive suppression and Roku exclusion wrapper', () => {
    ruleTester.run('no-runtime-conditional-compilation', wrapRuleWithHsDisable(rule, 'no-runtime-conditional-compilation'), {
      valid: [
        '// hs:disable-next-line no-runtime-conditional-compilation\nconst roku = __ROKU__;',
        '/* hs:disable no-runtime-conditional-compilation */\nconst roku = __ROKU__;',
        '// hs:exclude-from-platform roku\nconst roku = __ROKU__;',
      ],
      invalid: [
        { code: 'const roku = __ROKU__;', errors: [runtimeUse] },
      ],
    });
  });

  it('exports and enables the rule in the recommended configuration', () => {
    const plugin = pluginModule as { rules: Record<string, unknown>; configs: { recommended: { rules: Record<string, string> } } };
    expect(plugin.rules['no-runtime-conditional-compilation']).toBeDefined();
    expect(plugin.configs.recommended.rules['@hosanna-eslint/no-runtime-conditional-compilation']).toBe('error');
  });
});
