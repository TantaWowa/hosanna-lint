import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-nested-functions';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-nested-functions', () => {
  it('should pass valid module-level functions and methods', () => {
    ruleTester.run('no-nested-functions', rule, {
      valid: [
        "function globalFunction() { return 42; }",
        "const arrowFunction = () => { return 42; };",
        "const functionExpression = function() { return 42; };",
        `
          class MyClass {
            method() { return 42; }
            arrowMethod = () => { return 42; };
          }
        `,
        `
          function outer() {
            const arrow = () => 42;
            const funcExpr = function() { return 42; };
          }
        `,
      ],
      invalid: [],
    });
  });

  it('should report errors for nested function declarations', () => {
    ruleTester.run('no-nested-functions', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function outer() {
              function inner() {
                return 42;
              }
              return inner();
            }
          `,
          errors: [
            {
              messageId: 'nestedFunctionNotSupported',
            },
          ],
        },
        {
          code: `
            const outer = () => {
              function nested() {
                return 'nested';
              }
              return nested();
            };
          `,
          errors: [
            {
              messageId: 'nestedFunctionNotSupported',
            },
          ],
        },
        {
          code: `
            class MyClass {
              method() {
                function helper() {
                  return this.value;
                }
                return helper();
              }
            }
          `,
          errors: [
            {
              messageId: 'nestedFunctionNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for nested function expressions', () => {
    ruleTester.run('no-nested-functions', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function outer() {
              const inner = function() {
                return 42;
              };
              return inner();
            }
          `,
          errors: [
            {
              messageId: 'nestedFunctionNotSupported',
            },
          ],
        },
        {
          code: `
            const outer = () => {
              const nested = function helper() {
                return 'nested';
              };
              return nested();
            };
          `,
          errors: [
            {
              messageId: 'nestedFunctionNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should allow nested arrow functions and method definitions', () => {
    ruleTester.run('no-nested-functions', rule, {
      valid: [
        `
          function outer() {
            const arrow = () => 42;
            return arrow();
          }
        `,
        `
          class MyClass {
            method() {
              const arrow = () => this.value;
              return arrow();
            }
          }
        `,
      ],
      invalid: [],
    });
  });
});
