import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-build-flag-runtime-lookup';

function lint(code: string) {
  return new Linter().verify(code, [{
    languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
    plugins: { hosanna: { rules: { 'no-build-flag-runtime-lookup': rule } } },
    rules: { 'hosanna/no-build-flag-runtime-lookup': 'error' },
  }]);
}

describe('no-build-flag-runtime-lookup', () => {
  it.each([
    'const flags = { __DEV__: __DEV__, __PROD__: !__DEV__ }; Object.assign(globalThis, flags);',
    'const prod = __PROD__; const result = __ANDROID__ ? android() : other();',
    'if (__DEV__) { debug(); } if (!__DEV__) { release(); }',
    'const exists = typeof global !== "undefined"; const text = typeof ordinary;',
  ])('allows direct injected constants: %s', code => {
    expect(lint(code)).toEqual([]);
  });

  it.each([
    'const dev = typeof __DEV__ !== "undefined" ? __DEV__ : false;',
    'Object.assign(globalThis, { __DEV__: typeof __DEV__ === "boolean" ? __DEV__ : false });',
    'const prod = typeof (__PROD__ as boolean) !== "undefined";',
    'const value = typeof __CUSTOM_2__;',
  ])('rejects typeof fallback expressions: %s', code => {
    expect(lint(code)).toEqual([expect.objectContaining({ messageId: 'runtimeLookup' })]);
  });

  it.each([
    'const flags = { __DEV__: true }; const dev = flags.__DEV__;',
    'function read(globalThis: { __DEV__: boolean }) { return globalThis.__DEV__; }',
    'const global = { __DEV__: true }; const dev = global.__DEV__;',
    'globalThis.__DEV__ = __DEV__; global["__PROD__"] = !__DEV__;',
    'const host = globalThis; host.__DEV__ = __DEV__; Object.assign(host, { __PROD__: !__DEV__ });',
    'let host = globalThis; host = local; const dev = host.__DEV__;',
    'const key = getKey(); const value = globalThis[key];',
    'const { configuration: host } = globalThis; const enabled = host.__DEV__;',
    '(globalThis.__DEV__ as boolean) = __DEV__;',
    'const probes = globalThis.__HS_ANDROID_STARTUP_PROBES__; const tick = global.__HS_ANDROID_FRAME_TICK__;',
    'const host = globalThis; const probes = host["__HS_ANDROID_STARTUP_PROBES__"];',
  ])('preserves ordinary properties and host initialization: %s', code => {
    expect(lint(code)).toEqual([]);
  });

  it.each([
    'const dev = globalThis.__DEV__ ?? false;',
    'const dev = global["__DEV__"] === true ? true : false;',
    'const dev = (globalThis as { __DEV__?: boolean }).__DEV__ ?? false;',
    'const host = globalThis; const alias = host; const dev = alias.__DEV__;',
    'let host = globalThis; const dev = host.__DEV__;',
    'const dev = (globalThis as Globals)?.["__DEV__"];',
    'globalThis.__DEV__ ||= false;',
  ])('rejects runtime global flag reads and stable aliases: %s', code => {
    expect(lint(code)).toEqual([expect.objectContaining({ messageId: 'runtimeLookup' })]);
  });

  it('reports both lookups in the rejected bootstrap fallback, without rejecting its writes', () => {
    const messages = lint(`
      const metroDev: boolean = typeof __DEV__ !== 'undefined' ? __DEV__ : ((globalThis as any).__DEV__ ?? true);
      (globalThis as any).__DEV__ = metroDev;
      (globalThis as any).__PROD__ = !metroDev;
    `);
    expect(messages).toHaveLength(2);
    expect(messages.every(message => message.messageId === 'runtimeLookup')).toBe(true);
  });

  it('enables the public rule while preserving platform exclusion for Roku-only rules', async () => {
    const imported = await import('../index');
    const plugin = imported.default;
    expect(plugin.configs.recommended.rules['@hosanna-eslint/no-build-flag-runtime-lookup']).toBe('error');
    const messages = new Linter().verify(
      '// hs:exclude-from-platform roku\nconst dev = globalThis.__DEV__ ?? false; const value = Infinity;',
      [{
        languageOptions: { parser },
        plugins: { '@hosanna-eslint': plugin },
        rules: {
          '@hosanna-eslint/no-build-flag-runtime-lookup': 'error',
          '@hosanna-eslint/no-infinity-usage': 'error',
        },
      }],
    );
    expect(messages).toEqual([expect.objectContaining({ ruleId: '@hosanna-eslint/no-build-flag-runtime-lookup' })]);
  });

  it('retains the legacy processor exclusion without changing other consumers', async () => {
    const imported = await import('../index');
    const source = '// hs:exclude-from-platform roku\nconst dev = globalThis.__DEV__ ?? false;';
    expect(imported.default.processors.ts.preprocess(source, 'main.android.ts')).toEqual(['']);
  });

  it('does not exempt an individual native declaration from the cross-platform rule', async () => {
    const imported = await import('../index');
    const messages = new Linter().verify(`
      const first = 1;
      // hs:exclude-from-platform roku
      function nativeEntry() { return globalThis.__DEV__ ?? false; }
    `, [{
      languageOptions: { parser },
      plugins: { '@hosanna-eslint': imported.default },
      rules: { '@hosanna-eslint/no-build-flag-runtime-lookup': 'error' },
    }]);
    expect(messages).toEqual([expect.objectContaining({ messageId: 'runtimeLookup' })]);
  });

  it('respects standard ESLint suppression for the mapped diagnostic rule name', () => {
    expect(lint('// eslint-disable-next-line hosanna/no-build-flag-runtime-lookup\nconst value = typeof __DEV__;')).toEqual([]);
  });
});
