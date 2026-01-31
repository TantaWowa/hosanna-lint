import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-date-usage';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-date-usage', () => {
  it('should pass valid code without Date usage', () => {
    ruleTester.run('no-date-usage', rule, {
      valid: [
        "const hsDate = new HsDate();",
        "HsDate.now();",
        "const time: HsDate = new HsDate();",
        "const customDate = { year: 2023, month: 10 };",
        "const dateString = '2023-10-04';",
      ],
      invalid: [],
    });
  });

  it('should allow new Date() constructor calls (transpiler converts them)', () => {
    ruleTester.run('no-date-usage', rule, {
      valid: [
        "const date = new Date();",
        "const specificDate = new Date('2023-10-04');",
        "const timestamp = new Date(1696377600000);",
        "const dateWithArgs = new Date(2023, 9, 4);",
      ],
      invalid: [],
    });
  });

  it('should allow supported Date static methods (transpiler converts them)', () => {
    ruleTester.run('no-date-usage', rule, {
      valid: [
        "const now = Date.now();",
        "const parsed = Date.parse('2023-10-04');",
        "const utc = Date.UTC(2023, 9, 4);",
        "const shared = Date.sharedDate();",
        "Date.SetLocale('en-US');",
        "const locale = Date.GetLocale();",
        "const iso = Date.fromISOString('2024-01-01');",
        "const ts = Date.fromTimestamp(1234567890);",
        // Computed property access with string literals
        "const nowComputed = Date['now']();",
        "const parseComputed = Date['parse']('2023-10-04');",
        "const utcComputed = Date['UTC'](2023, 9, 4);",
        // Computed property access with non-string literals - we can't determine method name at lint time
        // The transpiler will handle these at transpile time
        "const method = 'now'; const result = Date[method]();",
        "const result = Date[someVariable]();",
      ],
      invalid: [],
    });
  });

  it('should report errors for unsupported Date static methods', () => {
    ruleTester.run('no-date-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = Date.toISOString();",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'toISOString' },
            },
          ],
        },
        {
          code: "const result = Date.getTime();",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'getTime' },
            },
          ],
        },
        {
          code: "const result = Date.toString();",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'toString' },
            },
          ],
        },
        {
          code: "const result = Date.valueOf();",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'valueOf' },
            },
          ],
        },
        // Computed property access with unsupported methods
        {
          code: "const result = Date['toISOString']();",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'toISOString' },
            },
          ],
        },
        {
          code: "const result = Date['unsupportedMethod']();",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'unsupportedMethod' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for Date type usage (types are not transpiled)', () => {
    ruleTester.run('no-date-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "const date: Date = new HsDate();",
          errors: [
            {
              messageId: 'dateTypeNotSupported',
            },
          ],
        },
        {
          code: "function processDate(date: Date): void {}",
          errors: [
            {
              messageId: 'dateTypeNotSupported',
            },
          ],
        },
        {
          code: "interface WithDate { timestamp: Date; }",
          errors: [
            {
              messageId: 'dateTypeNotSupported',
            },
          ],
        },
        {
          code: "type DateAlias = Date;",
          errors: [
            {
              messageId: 'dateTypeNotSupported',
            },
          ],
        },
        {
          code: "function returnsDate(): Date { return new HsDate(); }",
          errors: [
            {
              messageId: 'dateTypeNotSupported',
            },
          ],
        },
        {
          code: "class MyClass { date: Date; }",
          errors: [
            {
              messageId: 'dateTypeNotSupported',
            },
          ],
        },
      ],
    });
  });
});
