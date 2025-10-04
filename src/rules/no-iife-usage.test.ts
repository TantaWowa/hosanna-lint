import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-iife-usage';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-iife-usage', () => {
  it('should pass valid function calls and declarations', () => {
    ruleTester.run('no-iife-usage', rule, {
      valid: [
        "function regularFunction() { return 42; }",
        "const arrow = () => 42;",
        "regularFunction();",
        "const result = regularFunction();",
        "const obj = { method: function() {} };",
        "obj.method();",
      ],
      invalid: [],
    });
  });

  it('should report errors for classic IIFE patterns', () => {
    ruleTester.run('no-iife-usage', rule, {
      valid: [],
      invalid: [
        {
          code: "(function() { console.log('IIFE'); })();",
          errors: [
            {
              messageId: 'iifeNotSupported',
            },
          ],
        },
        {
          code: "(function(x) { return x * 2; })(5);",
          errors: [
            {
              messageId: 'iifeNotSupported',
            },
          ],
        },
        {
          code: "(() => { console.log('arrow IIFE'); })();",
          errors: [
            {
              messageId: 'iifeNotSupported',
            },
          ],
        },
        {
          code: "((x) => x * 2)(5);",
          errors: [
            {
              messageId: 'iifeNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should handle complex IIFE expressions', () => {
    ruleTester.run('no-iife-usage', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const result = (function(a, b) {
              return a + b;
            })(1, 2);
          `,
          errors: [
            {
              messageId: 'iifeNotSupported',
            },
          ],
        },
        {
          code: `
            (async function() {
              await someAsyncOperation();
            })();
          `,
          errors: [
            {
              messageId: 'iifeNotSupported',
            },
          ],
        },
      ],
    });
  });
});
