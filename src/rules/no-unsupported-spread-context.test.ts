import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-spread-context';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsupported-spread-context', () => {
  it('allows spread in array, call, and object', () => {
    ruleTester.run('no-unsupported-spread-context', rule, {
      valid: [
        'const a = [1, ...b];',
        'fn(...args);',
        'const o = { ...x, a: 1 };',
        'new Set([...arr]);',
      ],
      invalid: [],
    });
  });

  it('flags spread in new-expression arguments (transpiler unsupported context)', () => {
    ruleTester.run('no-unsupported-spread-context', rule, {
      valid: [],
      invalid: [
        {
          code: 'const parts = [2020, 1, 1] as const; new Date(...parts);',
          errors: [{ messageId: 'unsupportedSpread' }],
        },
      ],
    });
  });
});
