import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-isnan-emulated';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-isnan-emulated', () => {
  it('should pass valid operations', () => {
    ruleTester.run('no-isnan-emulated', rule, {
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

  it('should report warnings for isNaN() usage', () => {
    ruleTester.run('no-isnan-emulated', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = isNaN(value);",
          errors: [
            {
              messageId: 'isNaNEmulated',
            },
          ],
        },
        {
          code: "if (isNaN(input)) { return false; }",
          errors: [
            {
              messageId: 'isNaNEmulated',
            },
          ],
        },
        {
          code: "const valid = !isNaN(num);",
          errors: [
            {
              messageId: 'isNaNEmulated',
            },
          ],
        },
        {
          code: "const check = someArray.some(item => isNaN(item));",
          errors: [
            {
              messageId: 'isNaNEmulated',
            },
          ],
        },
      ],
    });
  });
});
