import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-function-reference-outside-module';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-function-reference-outside-module', () => {
  it('should pass valid function references inside modules and classes', () => {
    ruleTester.run('no-function-reference-outside-module', rule, {
      valid: [
        "class MyClass { method = () => {}; }",
        "class MyClass { constructor() { this.func = () => {}; } }",
        "function outer() { const inner = () => {}; }",
        "const obj = { method: () => {} };",
        "export const exportedFunc = function() {};",
        "const moduleVar = 42;", // Non-function assignment is fine
        "let nonFuncVar; nonFuncVar = 'string';", // Non-function assignment is fine
      ],
      invalid: [],
    });
  });

  it('should report errors for top-level function references in non-module files', () => {
    ruleTester.run('no-function-reference-outside-module', rule, {
      valid: [],
      invalid: [
        {
          code: "// hs:no-module\nconst myFunc = function() { return 42; };",
          errors: [
            {
              messageId: 'functionReferenceOutsideModule',
            },
          ],
        },
        {
          code: "// hs:no-module\nconst arrowFunc = () => { console.log('hello'); };",
          errors: [
            {
              messageId: 'functionReferenceOutsideModule',
            },
          ],
        },
        {
          code: "// hs:no-module\nlet funcVar; funcVar = function(x) { return x * 2; };",
          errors: [
            {
              messageId: 'functionReferenceOutsideModule',
            },
          ],
        },
      ],
    });
  });

  it('should allow function references inside functions', () => {
    ruleTester.run('no-function-reference-outside-module', rule, {
      valid: [
        "function outer() { const inner = () => 42; return inner; }",
        "const arrow = () => { const nested = function() {}; return nested; };",
        "const obj = { method: function() { const helper = () => {}; return helper; } };",
      ],
      invalid: [],
    });
  });

  it('should allow function references inside classes', () => {
    ruleTester.run('no-function-reference-outside-module', rule, {
      valid: [
        "class MyClass { func = () => {}; }",
        "class MyClass { method() { const helper = function() {}; } }",
        "class MyClass { constructor() { this.callback = () => {}; } }",
      ],
      invalid: [],
    });
  });

  it('should allow top-level function references in module files', () => {
    ruleTester.run('no-function-reference-outside-module', rule, {
      valid: [
        "const myFunc = function() { return 42; };",
        "const arrowFunc = () => { console.log('hello'); };",
        "let funcVar; funcVar = function(x) { return x * 2; };",
        "export const exportedFunc = function() {};",
        {
          code: `
            const asyncFunc = async function() {
              return await Promise.resolve(42);
            };
          `,
        },
        {
          code: `
            const generatorFunc = function* () {
              yield 1;
              yield 2;
            };
          `,
        },
      ],
      invalid: [],
    });
  });

  it('should handle complex expressions in non-module files', () => {
    ruleTester.run('no-function-reference-outside-module', rule, {
      valid: [],
      invalid: [
        {
          code: `// hs:no-module
            const asyncFunc = async function() {
              return await Promise.resolve(42);
            };
          `,
          errors: [
            {
              messageId: 'functionReferenceOutsideModule',
            },
          ],
        },
        {
          code: `// hs:no-module
            const generatorFunc = function* () {
              yield 1;
              yield 2;
            };
          `,
          errors: [
            {
              messageId: 'functionReferenceOutsideModule',
            },
          ],
        },
      ],
    });
  });
});
