import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-number-isnan';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-number-isnan', () => {
  it('should pass valid number operations', () => {
    ruleTester.run('no-number-isnan', rule, {
      valid: [
        "const result = isNaN(value);",
        "const max = Number.MAX_VALUE;",
        "const min = Number.MIN_VALUE;",
        "Number.parseInt('123');",
        "Number.parseFloat('1.23');",
      ],
      invalid: [],
    });
  });

  it('should report errors for Number.isNaN() usage', () => {
    ruleTester.run('no-number-isnan', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = Number.isNaN(value);",
          errors: [
            {
              messageId: 'numberIsNaNNotSupported',
            },
          ],
          output: "const result = isNaN(value);",
        },
        {
          code: "if (Number.isNaN(input)) { return false; }",
          errors: [
            {
              messageId: 'numberIsNaNNotSupported',
            },
          ],
          output: "if (isNaN(input)) { return false; }",
        },
        {
          code: "const valid = !Number.isNaN(num);",
          errors: [
            {
              messageId: 'numberIsNaNNotSupported',
            },
          ],
          output: "const valid = !isNaN(num);",
        },
      ],
    });
  });

  it('should handle complex expressions', () => {
    ruleTester.run('no-number-isnan', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = Number.isNaN(calculateValue());",
          errors: [
            {
              messageId: 'numberIsNaNNotSupported',
            },
          ],
          output: "const result = isNaN(calculateValue());",
        },
        {
          code: "const check = someArray.some(item => Number.isNaN(item));",
          errors: [
            {
              messageId: 'numberIsNaNNotSupported',
            },
          ],
          output: "const check = someArray.some(item => isNaN(item));",
        },
      ],
    });
  });
});
