import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-mixed-conditional-compilation';

const ruleTester = new RuleTester({
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
  it('flags flag mixed with runtime (aligns with transpiler conditional-compilation.test)', () => {
    ruleTester.run('no-mixed-conditional-compilation', rule, {
      valid: [
        'if (true) { a = 1; }',
        'if (someVar) { a = 1; }',
        // With buildFlags mirroring DEV: true, __DEV__ alone is statically true — not mixed
        {
          code: 'if (__DEV__) { a = 1; }',
          options: [{ buildFlags: { DEV: true } }],
        },
      ],
      invalid: [
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
