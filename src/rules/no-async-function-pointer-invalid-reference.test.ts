import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-async-function-pointer-invalid-reference';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-async-function-pointer-invalid-reference', () => {
  it('should pass valid exported function declarations', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [
        // Exported function declaration
        `
          export function myFunction() {}
          const fn: AsyncFunctionPointer = myFunction;
        `,
        // Exported default function
        `
          export default function myFunction() {}
          const fn: AsyncFunctionPointer = myFunction;
        `,
        // Named export of function
        `
          function myFunction() {}
          export { myFunction };
          const fn: AsyncFunctionPointer = myFunction;
        `,
        // Variable with exported function
        `
          export function handler() {}
          const callback: AsyncFunctionPointer = handler;
        `,
        // Function parameter with exported function
        `
          export function handler() {}
          function callHandler(fn: AsyncFunctionPointer) {
            fn();
          }
          callHandler(handler);
        `,
        // Assignment to variable with exported function
        `
          export function handler() {}
          let fn: AsyncFunctionPointer;
          fn = handler;
        `,
      ],
      invalid: [],
    });
  });

  it('should report errors for arrow functions', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const fn: AsyncFunctionPointer = () => {};
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            const fn: AsyncFunctionPointer = (x: number) => x * 2;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            let fn: AsyncFunctionPointer;
            fn = () => {};
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            function callHandler(fn: AsyncFunctionPointer) {}
            callHandler(() => {});
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for function expressions', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const fn: AsyncFunctionPointer = function() {};
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            const fn: AsyncFunctionPointer = function named() {};
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            let fn: AsyncFunctionPointer;
            fn = function() {};
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            function callHandler(fn: AsyncFunctionPointer) {}
            callHandler(function() {});
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for class methods', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [],
      invalid: [
        {
          code: `
            class MyClass {
              method() {}
            }
            const instance = new MyClass();
            const fn: AsyncFunctionPointer = instance.method;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            class MyClass {
              method() {}
            }
            class AnotherClass {
              test() {
                const instance = new MyClass();
                const fn: AsyncFunctionPointer = instance.method;
              }
            }
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            class MyClass {
              method() {}
              test() {
                const fn: AsyncFunctionPointer = this.method;
              }
            }
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for non-exported function declarations', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function myFunction() {}
            const fn: AsyncFunctionPointer = myFunction;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            function handler() {}
            function callHandler(fn: AsyncFunctionPointer) {}
            callHandler(handler);
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            function handler() {}
            let fn: AsyncFunctionPointer;
            fn = handler;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for variables initialized with functions', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const myFunc = () => {};
            const fn: AsyncFunctionPointer = myFunc;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            const myFunc = function() {};
            const fn: AsyncFunctionPointer = myFunc;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            let myFunc;
            myFunc = () => {};
            const fn: AsyncFunctionPointer = myFunc;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for function parameter default values', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [],
      invalid: [
        {
          code: `
            function test(fn: AsyncFunctionPointer = () => {}) {}
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            function test(fn: AsyncFunctionPointer = function() {}) {}
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            const test = (fn: AsyncFunctionPointer = () => {}) => {};
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
      ],
    });
  });

  it('should handle complex scenarios', () => {
    ruleTester.run('no-async-function-pointer-invalid-reference', rule, {
      valid: [
        // Multiple exported functions
        `
          export function handler1() {}
          export function handler2() {}
          const fn1: AsyncFunctionPointer = handler1;
          const fn2: AsyncFunctionPointer = handler2;
        `,
        // Exported function from another module (we can't verify cross-module, so we allow)
        `
          import { handler } from './other';
          const fn: AsyncFunctionPointer = handler;
        `,
      ],
      invalid: [
        {
          code: `
            class MyClass {
              static staticMethod() {}
            }
            const fn: AsyncFunctionPointer = MyClass.staticMethod;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
        {
          code: `
            const obj = {
              method: function() {}
            };
            const fn: AsyncFunctionPointer = obj.method;
          `,
          errors: [
            {
              messageId: 'invalidAsyncFunctionPointer',
            },
          ],
        },
      ],
    });
  });
});

