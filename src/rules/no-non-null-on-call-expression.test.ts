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
        "const value = obj!.property;",
        "const result = func()?.value;",
        "const arr = items!.filter(Boolean);",
        "const str = getString()!;",
        "obj.method!();", // Method access with non-null, not call
      ],
      invalid: [],
    });
  });

  it('should report errors for non-null on call expressions', () => {
    ruleTester.run('no-non-null-on-call-expression', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = getValue()!;",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const result = getValue()?.",
        },
        {
          code: "const data = api.fetchData()!;",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const data = api.fetchData()?.",
        },
        {
          code: "return calculate()!;",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "return calculate()?.",
        },
      ],
    });
  });

  it('should handle complex call expressions', () => {
    ruleTester.run('no-non-null-on-call-expression', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = obj.method().property!;",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const result = obj.method().property?.",
        },
        {
          code: "const value = getData(arg1, arg2)!;",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const value = getData(arg1, arg2)?.",
        },
        {
          code: "const chained = func()().method()!;",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const chained = func()().method()?.",
        },
      ],
    });
  });

  it('should handle nested expressions', () => {
    ruleTester.run('no-non-null-on-call-expression', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = (calculate()!) + 1;",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "const result = (calculate()?. + 1;",
        },
        {
          code: "if (validate()!) { doSomething(); }",
          errors: [
            {
              messageId: 'nonNullOnCallNotSupported',
            },
          ],
          output: "if (validate()?. { doSomething(); }",
        },
      ],
    });
  });
});
