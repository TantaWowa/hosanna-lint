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
  it('should pass supported string instance methods (HS-1048/1109)', () => {
    ruleTester.run('no-unsupported-string-methods', rule, {
      valid: [
        'const str = "hello"; str.toUpperCase();',
        'const str = "hello"; str.toLowerCase();',
        'const str = "hello"; str.trim();',
        'const str = "hello"; str.charAt(0);',
        'const str = "hello"; str.indexOf("l");',
        'const str = "hello"; str.split(",");',
        'const str = "hello"; str.startsWith("h");',
        'const str = "hello"; str.endsWith("o");',
        'const str = "hello"; str.includes("ell");',
        'const str = "hello"; str.substring(0, 3);',
        'const str = "hello"; str.slice(0, 3);',
        '"hello".toUpperCase();',
        '`template`.indexOf("t");',
      ],
      invalid: [],
    });
  });

  it('should pass supported String static usage', () => {
    ruleTester.run('no-unsupported-string-methods', rule, {
      valid: [
        "String('hello');",
        "new String('hello');",
      ],
      invalid: [],
    });
  });

  it('should report unsupported String static methods (HS-1048)', () => {
    ruleTester.run('no-unsupported-string-methods', rule, {
      valid: [],
      invalid: [
        {
          code: 'String.fromCharCode(65);',
          errors: [{ messageId: 'unsupportedStringMethod', data: { method: 'fromCharCode' } }],
        },
        {
          code: 'String.fromCodePoint(65);',
          errors: [{ messageId: 'unsupportedStringMethod', data: { method: 'fromCodePoint' } }],
        },
        {
          code: 'String.raw`template`;',
          errors: [{ messageId: 'unsupportedStringMethod', data: { method: 'raw' } }],
        },
      ],
    });
  });

  it('should report unsupported string instance methods (HS-1109)', () => {
    ruleTester.run('no-unsupported-string-methods', rule, {
      valid: [],
      invalid: [
        {
          code: 'const str = "hello"; str.localeCompare("world");',
          errors: [{ messageId: 'unsupportedStringInstanceMethod', data: { method: 'localeCompare' } }],
        },
        {
          code: '"hello".localeCompare("world");',
          errors: [{ messageId: 'unsupportedStringInstanceMethod', data: { method: 'localeCompare' } }],
        },
      ],
    });
  });
});
