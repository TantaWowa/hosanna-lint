import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './bitwise-operator-polyfill';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2021, sourceType: 'module', parser },
});

describe('bitwise-operator-polyfill', () => {
  it('reports bitwise operators lowered through helpers', () => {
    ruleTester.run('bitwise-operator-polyfill', rule, {
      valid: [
        'x + y;',
        'x && y;',
        'x ||= y;',
      ],
      invalid: [
        {
          code: 'x & y;',
          errors: [{ messageId: 'bitwiseOperatorPolyfill', data: { operator: '&' } }],
        },
        {
          code: 'x | y;',
          errors: [{ messageId: 'bitwiseOperatorPolyfill', data: { operator: '|' } }],
        },
        {
          code: 'x ^ y;',
          errors: [{ messageId: 'bitwiseOperatorPolyfill', data: { operator: '^' } }],
        },
        {
          code: '~x;',
          errors: [{ messageId: 'bitwiseOperatorPolyfill', data: { operator: '~' } }],
        },
        {
          code: 'x &= y;',
          errors: [{ messageId: 'bitwiseOperatorPolyfill', data: { operator: '&=' } }],
        },
        {
          code: 'x |= y;',
          errors: [{ messageId: 'bitwiseOperatorPolyfill', data: { operator: '|=' } }],
        },
        {
          code: 'x ^= y;',
          errors: [{ messageId: 'bitwiseOperatorPolyfill', data: { operator: '^=' } }],
        },
      ],
    });
  });
});
