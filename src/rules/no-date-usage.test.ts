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

  it('should report errors for Date constructor calls', () => {
    ruleTester.run('no-date-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "const date = new Date();",
          errors: [
            {
              messageId: 'dateConstructorNotSupported',
            },
          ],
        },
        {
          code: "const specificDate = new Date('2023-10-04');",
          errors: [
            {
              messageId: 'dateConstructorNotSupported',
            },
          ],
        },
        {
          code: "const timestamp = new Date(1696377600000);",
          errors: [
            {
              messageId: 'dateConstructorNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for Date static method calls', () => {
    ruleTester.run('no-date-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "const now = Date.now();",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'now' },
            },
          ],
        },
        {
          code: "const parsed = Date.parse('2023-10-04');",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'parse' },
            },
          ],
        },
        {
          code: "const utc = Date.UTC(2023, 9, 4);",
          errors: [
            {
              messageId: 'dateStaticMethodNotSupported',
              data: { method: 'UTC' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for Date type usage', () => {
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
      ],
    });
  });
});
