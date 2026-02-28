import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-number-method-on-non-number';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-number-method-on-non-number', () => {
  it('should pass without type info (rule is a no-op)', () => {
    ruleTester.run('no-number-method-on-non-number', rule, {
      valid: [
        'const x = (1.5).toFixed(2);',
        'num.toFixed(2);',
        'x.toPrecision(3);',
      ],
      invalid: [],
    });
  });
});
