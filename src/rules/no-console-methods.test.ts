import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-console-methods';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-console-methods', () => {
  it('should pass valid code without console calls', () => {
    ruleTester.run('no-console-methods', rule, {
      valid: [
        "const log = (message) => { /* custom logging */ };",
        "log('message');",
        "myLogger.info('message');",
        "const obj = { console: 'not the global' };",
        "obj.console.log('this is fine');",
      ],
      invalid: [],
    });
  });

  it('should report errors for console method calls', () => {
    ruleTester.run('no-console-methods', rule, {
      valid: [],
      invalid: [
        {
          code: "console.log('message');",
          errors: [
            {
              messageId: 'consoleMethodNotSupported',
              data: { method: 'log' },
            },
          ],
          output: "",
        },
        {
          code: "console.error('error message');",
          errors: [
            {
              messageId: 'consoleMethodNotSupported',
              data: { method: 'error' },
            },
          ],
          output: "",
        },
        {
          code: "console.warn('warning');",
          errors: [
            {
              messageId: 'consoleMethodNotSupported',
              data: { method: 'warn' },
            },
          ],
          output: "",
        },
        {
          code: "console.info('info');",
          errors: [
            {
              messageId: 'consoleMethodNotSupported',
              data: { method: 'info' },
            },
          ],
          output: "",
        },
      ],
    });
  });

  it('should handle console calls in various contexts', () => {
    ruleTester.run('no-console-methods', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function test() {
              console.log('inside function');
              return 42;
            }
          `,
          errors: [
            {
              messageId: 'consoleMethodNotSupported',
              data: { method: 'log' },
            },
          ],
          output: `
            function test() {
              return 42;
            }
          `,
        },
        {
          code: `
            if (condition) {
              console.debug('debug message');
            }
          `,
          errors: [
            {
              messageId: 'consoleMethodNotSupported',
              data: { method: 'debug' },
            },
          ],
          output: `
            if (condition) {
            }
          `,
        },
        {
          code: "console.table(data);",
          errors: [
            {
              messageId: 'consoleMethodNotSupported',
              data: { method: 'table' },
            },
          ],
          output: "",
        },
      ],
    });
  });
});
