import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-epsilon-usage';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-epsilon-usage', () => {
  it('should pass valid number operations', () => {
    ruleTester.run('no-epsilon-usage', rule, {
      valid: [
        "const epsilon = 0.0000001;",
        "const small = 1e-7;",
        "Number.MAX_VALUE;",
        "Number.MIN_VALUE;",
        "Number.NaN;",
        "Number.POSITIVE_INFINITY;",
        "Number.NEGATIVE_INFINITY;",
        "Math.E;",
        "Math.PI;",
      ],
      invalid: [],
    });
  });

  it('should report errors for Number.EPSILON usage', () => {
    ruleTester.run('no-epsilon-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "const epsilon = Number.EPSILON;",
          errors: [
            {
              messageId: 'epsilonNotSupported',
            },
          ],
          output: "const epsilon = 0.0000001;",
        },
        {
          code: "if (Math.abs(a - b) < Number.EPSILON) { return true; }",
          errors: [
            {
              messageId: 'epsilonNotSupported',
            },
          ],
          output: "if (Math.abs(a - b) < 0.0000001) { return true; }",
        },
        {
          code: "const threshold = Number.EPSILON * 2;",
          errors: [
            {
              messageId: 'epsilonNotSupported',
            },
          ],
          output: "const threshold = 0.0000001 * 2;",
        },
      ],
    });
  });

  it('should handle complex expressions with EPSILON', () => {
    ruleTester.run('no-epsilon-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = calculate(Number.EPSILON);",
          errors: [
            {
              messageId: 'epsilonNotSupported',
            },
          ],
          output: "const result = calculate(0.0000001);",
        },
        {
          code: "const config = { epsilon: Number.EPSILON };",
          errors: [
            {
              messageId: 'epsilonNotSupported',
            },
          ],
          output: "const config = { epsilon: 0.0000001 };",
        },
      ],
    });
  });
});
