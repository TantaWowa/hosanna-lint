import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-infinity-usage';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-infinity-usage', () => {
  it('flags Infinity usage (HS-1038)', () => {
    ruleTester.run('no-infinity-usage', rule, {
      valid: [],
      invalid: [
        {
          code: 'const inf = Infinity;',
          errors: [{ messageId: 'infinityNotSupported' }],
        },
        {
          code: 'const x = Number.POSITIVE_INFINITY;',
          errors: [{ messageId: 'infinityNotSupported' }],
        },
        {
          code: 'const x = Number.NEGATIVE_INFINITY;',
          errors: [{ messageId: 'infinityNotSupported' }],
        },
      ],
    });
  });

  it('does NOT flag regular number constants', () => {
    ruleTester.run('no-infinity-usage', rule, {
      valid: [
        'const x = 2147483647;',
        'const x = 0;',
        'const x = -1;',
      ],
      invalid: [],
    });
  });
});
