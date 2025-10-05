import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-nan-usage';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-nan-usage', () => {
  it('should pass valid number operations', () => {
    ruleTester.run('no-nan-usage', rule, {
      valid: [
        "const result = isNaN(value);",
        "const max = Number.MAX_VALUE;",
        "const min = Number.MIN_VALUE;",
        "Number.parseInt('123');",
        "Number.parseFloat('1.23');",
        "const nan = NaN;", // Direct NaN literal should be allowed
      ],
      invalid: [],
    });
  });

  it('should report warnings for Number.NaN usage', () => {
    ruleTester.run('no-nan-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "const a = Number.NaN;",
          errors: [
            {
              messageId: 'nanApproximation',
              message: 'Number.NaN is not supported on Roku devices.',
            },
          ],
        },
        {
          code: "const result = Number.NaN;",
          errors: [
            {
              messageId: 'nanApproximation',
              message: 'Number.NaN is not supported on Roku devices.',
            },
          ],
        },
        {
          code: "if (value === Number.NaN) { return false; }",
          errors: [
            {
              messageId: 'nanApproximation',
              message: 'Number.NaN is not supported on Roku devices.',
            },
          ],
        },
        {
          code: "const config = { defaultValue: Number.NaN };",
          errors: [
            {
              messageId: 'nanApproximation',
              message: 'Number.NaN is not supported on Roku devices.',
            },
          ],
        },
        {
          code: "function getNaN() { return Number.NaN; }",
          errors: [
            {
              messageId: 'nanApproximation',
              message: 'Number.NaN is not supported on Roku devices.',
            },
          ],
        },
      ],
    });
  });
});
