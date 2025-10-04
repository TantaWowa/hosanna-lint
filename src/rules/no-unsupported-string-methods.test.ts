import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-string-methods';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-unsupported-string-methods', () => {
  it('should pass supported string operations', () => {
    ruleTester.run('no-unsupported-string-methods', rule, {
      valid: [
        "const str = 'hello';",
        "str.length;",
        "str.charAt(0);",
        "str.charCodeAt(0);",
        "str.substring(0, 5);",
        "str.substr(0, 5);",
        "str.slice(0, 5);",
        "str.indexOf('l');",
        "str.lastIndexOf('l');",
        "str.toLowerCase();",
        "str.toUpperCase();",
        "str.trim();",
        "str.split(',');",
        "str.replace('old', 'new');",
        "str.concat(' world');",
      ],
      invalid: [],
    });
  });

  it('should report errors for unsupported String static methods', () => {
    ruleTester.run('no-unsupported-string-methods', rule, {
      valid: [],
      invalid: [
        {
          code: "String.fromCharCode(65);",
          errors: [
            {
              messageId: 'unsupportedStringMethod',
              data: { method: 'fromCharCode' },
            },
          ],
        },
        {
          code: "String.fromCodePoint(65);",
          errors: [
            {
              messageId: 'unsupportedStringMethod',
              data: { method: 'fromCodePoint' },
            },
          ],
        },
        {
          code: "String.raw`template`;",
          errors: [
            {
              messageId: 'unsupportedStringMethod',
              data: { method: 'raw' },
            },
          ],
        },
      ],
    });
  });

  it('should allow supported String methods', () => {
    ruleTester.run('no-unsupported-string-methods', rule, {
      valid: [
        "String('hello');", // Constructor call
        "new String('hello');", // Constructor with new
        "str.toString();", // Instance method
      ],
      invalid: [],
    });
  });
});
