import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './symbol-basic-support-roku';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('symbol-basic-support-roku', () => {
  it('passes when Symbol is not invoked as a direct call', () => {
    ruleTester.run('symbol-basic-support-roku', rule, {
      valid: [
        'const x = "Symbol";',
        'type T = symbol;',
        'const o = { Symbol: 1 };',
      ],
      invalid: [],
    });
  });

  it('warns on Symbol(...) call expression', () => {
    ruleTester.run('symbol-basic-support-roku', rule, {
      valid: [],
      invalid: [
        {
          code: "const k = Symbol('a');",
          errors: [{ messageId: 'symbolBasicSupportOnRoku' }],
        },
        {
          code: 'const k = Symbol();',
          errors: [{ messageId: 'symbolBasicSupportOnRoku' }],
        },
      ],
    });
  });
});
