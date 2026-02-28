import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-number-static-methods';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsupported-number-static-methods', () => {
  it('should pass supported Number static methods', () => {
    ruleTester.run('no-unsupported-number-static-methods', rule, {
      valid: [
        'Number.isFinite(x);',
        'Number.isInteger(x);',
        'Number.isNaN(x);',
        'Number.isSafeInteger(x);',
        'Number.parseFloat("1.5");',
        'Number.parseInt("42");',
      ],
      invalid: [],
    });
  });

  it('should report unsupported Number static methods', () => {
    ruleTester.run('no-unsupported-number-static-methods', rule, {
      valid: [],
      invalid: [
        {
          code: 'Number.toFixed(2);',
          errors: [{ messageId: 'unsupportedNumberStaticMethod', data: { method: 'toFixed' } }],
        },
      ],
    });
  });
});
