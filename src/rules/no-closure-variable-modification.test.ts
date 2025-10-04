import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-closure-variable-modification';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-closure-variable-modification', () => {
  it('should pass valid code without closure variable modification', () => {
    ruleTester.run('no-closure-variable-modification', rule, {
      valid: [
        "let x = 1; x = 2;", // Top level modification is fine
        "function outer() { let local = 1; local = 2; }", // Local variable modification is fine
        "function outer() { const inner = () => { let local = 1; local = 2; }; }", // Inner local is fine
        "const obj = { prop: 1 }; function outer() { obj.prop = 2; }", // Object property modification is fine
      ],
      invalid: [],
    });
  });

  it('should report errors for closure variable modification in nested functions', () => {
    ruleTester.run('no-closure-variable-modification', rule, {
      valid: [],
      invalid: [
        {
          code: `
            let counter = 0;
            function increment() {
              counter = counter + 1; // Modifying closure variable
            }
          `,
          errors: [
            {
              messageId: 'closureVariableModification',
            },
          ],
        },
        {
          code: `
            let value = 42;
            const func = () => {
              value = value * 2; // Modifying closure variable
            };
          `,
          errors: [
            {
              messageId: 'closureVariableModification',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for update expressions on closure variables', () => {
    ruleTester.run('no-closure-variable-modification', rule, {
      valid: [],
      invalid: [
        {
          code: `
            let count = 0;
            function increment() {
              count++; // Modifying closure variable
            }
          `,
          errors: [
            {
              messageId: 'closureVariableModification',
            },
          ],
        },
        {
          code: `
            let index = 0;
            const next = () => {
              index--; // Modifying closure variable
            };
          `,
          errors: [
            {
              messageId: 'closureVariableModification',
            },
          ],
        },
      ],
    });
  });

  it('should allow reading closure variables without modification', () => {
    ruleTester.run('no-closure-variable-modification', rule, {
      valid: [
        "let value = 42; function read() { return value; }", // Reading is fine
        "const config = { enabled: true }; function check() { return config.enabled; }", // Reading object properties is fine
      ],
      invalid: [],
    });
  });

  it('should handle deeply nested functions', () => {
    ruleTester.run('no-closure-variable-modification', rule, {
      valid: [],
      invalid: [
        {
          code: `
            let globalVar = 1;
            function outer() {
              function inner() {
                function deeplyNested() {
                  globalVar = 2; // Modifying deeply captured variable
                }
              }
            }
          `,
          errors: [
            {
              messageId: 'closureVariableModification',
            },
          ],
        },
      ],
    });
  });

  it('should not flag modifications to locally declared variables', () => {
    ruleTester.run('no-closure-variable-modification', rule, {
      valid: [
        `
          function outer() {
            let localVar = 1;
            function inner() {
              localVar = 2; // This is modifying a locally declared variable, not a closure variable
            }
          }
        `,
      ],
      invalid: [],
    });
  });
});
