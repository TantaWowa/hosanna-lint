import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-isnan-unreliable';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-isnan-unreliable', () => {
  it('should pass valid number operations', () => {
    ruleTester.run('no-isnan-unreliable', rule, {
      valid: [
        "const result = Number.isNaN(value);",
        "const max = Number.MAX_VALUE;",
        "const min = Number.MIN_VALUE;",
        "Number.parseInt('123');",
        "Number.parseFloat('1.23');",
      ],
      invalid: [],
    });
  });

  it('should report errors for isNaN() usage', () => {
    ruleTester.run('no-isnan-unreliable', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = isNaN(value);",
          errors: [
            {
              messageId: 'isNaNUnreliable',
            },
          ],
        },
        {
          code: "if (isNaN(input)) { return false; }",
          errors: [
            {
              messageId: 'isNaNUnreliable',
            },
          ],
        },
        {
          code: "const valid = !isNaN(num);",
          errors: [
            {
              messageId: 'isNaNUnreliable',
            },
          ],
        },
        {
          code: "const check = someArray.some(item => isNaN(item));",
          errors: [
            {
              messageId: 'isNaNUnreliable',
            },
          ],
        },
      ],
    });
  });
});
