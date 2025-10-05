import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-non-null-on-call-expression';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-non-null-on-call-expression', () => {
  it('should pass valid non-null usage', () => {
    ruleTester.run('no-non-null-on-call-expression', rule, {
      valid: [
        "const value = obj!.property;", // Non-null on property access - allowed
        "const result = func()?.value;", // Optional chaining - allowed
        "const arr = items!.filter(Boolean);", // Non-null on variable - allowed
        "const str = getString()!;", // Non-null on call result - allowed
        "const num = calculate()!;", // Non-null on call result - allowed
        "return process()!;", // Non-null on call result - allowed
      ],
      invalid: [],
    });
  });

  it('should report errors for non-null assertions before function calls', () => {
    ruleTester.run('no-non-null-on-call-expression', rule, {
      valid: [],
      invalid: [
        {
          code: "obj.method!();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "obj.method?.();",
        },
        {
          code: "api.fetchData!();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "api.fetchData?.();",
        },
        {
          code: "const result = calculate!();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const result = calculate?.();",
        },
      ],
    });
  });

  it('should handle complex expressions with non-null before calls', () => {
    ruleTester.run('no-non-null-on-call-expression', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = obj.method!.property();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const result = obj.method?.property();",
        },
        {
          code: "const value = getData!(arg1, arg2);",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const value = getData?.(arg1, arg2);",
        },
        {
          code: "const chained = func!().method();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const chained = func?.().method();",
        },
        {
          code: "callback!();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "callback?.();",
        },
      ],
    });
  });

  it('should handle member expressions and complex chains', () => {
    ruleTester.run('no-non-null-on-call-expression', rule, {
      valid: [],
      invalid: [
        {
          code: "utils.helper!.process(data);",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "utils.helper?.process(data);",
        },
        {
          code: "const result = this.method!();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const result = this.method?.();",
        },
        {
          code: "array[index]!.call();",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "array[index]?.call();",
        },
      ],
    });
  });
});
