import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-large-numeric-literals';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-large-numeric-literals', () => {
  it('should pass valid numeric literals within safe range', () => {
    ruleTester.run('no-large-numeric-literals', rule, {
      valid: [
        "const small = 42;",
        "const maxSafe = 2147483647;",
        "const negative = -100;",
        "const zero = 0;",
        "const float = 3.14;", // Floats are allowed
        "const scientific = 1e6;", // Scientific notation is allowed
      ],
      invalid: [],
    });
  });

  it('should report errors for numeric literals exceeding max safe integer', () => {
    ruleTester.run('no-large-numeric-literals', rule, {
      valid: [],
      invalid: [
        {
          code: "const large = 2147483648;",
          errors: [
            {
              messageId: 'numericLiteralExceedsMaxRokuSafeInt',
              data: { value: 2147483648 },
            },
          ],
        },
        {
          code: "const veryLarge = 9999999999;",
          errors: [
            {
              messageId: 'numericLiteralExceedsMaxRokuSafeInt',
              data: { value: 9999999999 },
            },
          ],
        },
        {
          code: "const timestamp = 1696377600000;",
          errors: [
            {
              messageId: 'numericLiteralExceedsMaxRokuSafeInt',
              data: { value: 1696377600000 },
            },
          ],
        },
      ],
    });
  });

  it('should handle various numeric literal formats', () => {
    ruleTester.run('no-large-numeric-literals', rule, {
      valid: [
        "const hex = 0x7FFFFFFF;", // Max safe int in hex
        "const binary = 0b1111111111111111111111111111111;", // Max safe int in binary
      ],
      invalid: [
        {
          code: "const hexTooBig = 0x80000000;", // One more than max
          errors: [
            {
              messageId: 'numericLiteralExceedsMaxRokuSafeInt',
              data: { value: 2147483648 },
            },
          ],
        },
      ],
    });
  });
});
