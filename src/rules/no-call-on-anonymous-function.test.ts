import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-call-on-anonymous-function';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-call-on-anonymous-function', () => {
  it('should pass valid code without calls on anonymous functions', () => {
    ruleTester.run('no-call-on-anonymous-function', rule, {
      valid: [
        // Named function calls
        "myFunction();",
        "const func = () => {}; func();",

        // Arrow function calls
        "const arrow = () => {}; arrow();",

        // Method calls
        "obj.method();",
        "this.doSomething();",

        // Function expressions assigned to variables first
        `
          const myFunc = function() { return 42; };
          myFunc();
        `,

        // Higher-order functions with typed parameters
        `
          function callFunc(func: () => void) {
            func();
          }
        `,
      ],
      invalid: [],
    });
  });

  it('should report errors for direct calls on anonymous function expressions', () => {
    ruleTester.run('no-call-on-anonymous-function', rule, {
      valid: [],
      invalid: [
        {
          code: "(function() { return 42; })();",
          errors: [
            {
              messageId: 'callOnAnonymousFunctionNotPermitted',
            },
          ],
        },
        {
          code: "(function(x) { return x * 2; })(5);",
          errors: [
            {
              messageId: 'callOnAnonymousFunctionNotPermitted',
            },
          ],
        },
        {
          code: `
            const result = (function() {
              return 'hello';
            })();
          `,
          errors: [
            {
              messageId: 'callOnAnonymousFunctionNotPermitted',
            },
          ],
        },
        {
          code: "(function named() { return true; })();",
          errors: [
            {
              messageId: 'callOnAnonymousFunctionNotPermitted',
            },
          ],
        },
      ],
    });
  });
});
