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
            constructor() { this.value = 42; }
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

  it('should report errors for nested named function expressions', () => {
    ruleTester.run('no-nested-functions', rule, {
      valid: [
        `
          function outer() {
            const inner = function() {
              return 42;
            };
            return inner();
          }
        `,
        `
          export function commandCategory(categoryName: string) {
            return function (target: any) { };
          }
        `,
      ],
      invalid: [
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
        `
          // Class methods should not be flagged as nested functions
          class MyClass {
            method1() { return 42; }
            method2(param: string) { return param; }
            async method3() { return await Promise.resolve(42); }
          }
        `,
        `
          // Arrow function expressions in classes should be allowed
          class MyClass {
            arrowMethod = () => { return this.value; };
            method() {
              const func = function() { return 42; };
              return func();
            }
          }
        `,
      ],
      invalid: [
        {
          code: `
            class MyClass {
              method() {
                function nested() {
                  return 42;
                }
                return nested();
              }
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
            function outer() {
              class MyClass {
                method() {
                  function nested() {
                    return 42;
                  }
                  return nested();
                }
              }
              return MyClass;
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
});
