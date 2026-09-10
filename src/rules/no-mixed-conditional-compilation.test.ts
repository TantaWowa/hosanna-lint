import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-mixed-conditional-compilation';

class VitestRuleTester extends RuleTester {
  static describe = describe;
  static it = it;
}

const ruleTester = new VitestRuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
    parserOptions: {
      ecmaFeatures: { globalReturn: true },
    },
    globals: {
      __DEV__: 'readonly',
      __ROKU__: 'readonly',
    },
  },
});

describe('no-mixed-conditional-compilation', () => {
  describe('flags flag mixed with runtime (aligns with transpiler conditional-compilation.test)', () => {
    ruleTester.run('no-mixed-conditional-compilation', rule, {
      valid: [
        'if (true) { a = 1; }',
        'if (someVar) { a = 1; }',
        'if (__APPLE__ || __ANDROID__) { a = 1; }',
        'if (__UNKNOWN_A__ && !__UNKNOWN_B__) { a = 1; }',
        'if (!(__UNKNOWN_A__ || __UNKNOWN_B__) && true) { a = 1; }',
        // With buildFlags mirroring DEV: true, __DEV__ alone is statically true — not mixed
        {
          code: 'if (__DEV__) { a = 1; }',
          options: [{ buildFlags: { DEV: true } }],
        },
      ],
      invalid: [
        {
          code: 'if (__UNKNOWN_A__ && runtimeValue) { a = 1; }',
          errors: [{ messageId: 'mixed' }],
        },
        {
          code: 'let x = true; if (__DEV__ && x) { a = 5; }',
          options: [{ buildFlags: { DEV: true } }],
          errors: [{ messageId: 'mixed' }],
        },
        {
          code: 'if (typeof __DEV__ !== "undefined" && __DEV__) { a = 1; }',
          options: [{ buildFlags: { DEV: true } }],
          errors: [{ messageId: 'mixed' }],
        },
      ],
    });
  });
});
