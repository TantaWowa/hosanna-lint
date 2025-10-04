import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-function-expression-on-anonymous-object';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-function-expression-on-anonymous-object', () => {
  it('should pass valid object literals and arrow functions', () => {
    ruleTester.run('no-function-expression-on-anonymous-object', rule, {
      valid: [
        "const obj = { method: () => {} };",
        "const obj = { method() {} };",
        "const func = function() {}; const obj = { method: func };",
        "class MyClass { method = function() {}; }",
        "function regularFunction() {}",
      ],
      invalid: [],
    });
  });

  it('should report errors for function expressions in object literals', () => {
    ruleTester.run('no-function-expression-on-anonymous-object', rule, {
      valid: [],
      invalid: [
        {
          code: "const obj = { method: function() {} };",
          errors: [
            {
              messageId: 'functionExpressionOnAnonymousObject',
            },
          ],
        },
        {
          code: "const obj = { handler: function(event) { return event; } };",
          errors: [
            {
              messageId: 'functionExpressionOnAnonymousObject',
            },
          ],
        },
        {
          code: `
            const config = {
              onClick: function() { console.log('clicked'); },
              onHover: function() { console.log('hovered'); }
            };
          `,
          errors: [
            {
              messageId: 'functionExpressionOnAnonymousObject',
            },
            {
              messageId: 'functionExpressionOnAnonymousObject',
            },
          ],
        },
      ],
    });
  });

  it('should handle nested objects', () => {
    ruleTester.run('no-function-expression-on-anonymous-object', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const obj = {
              nested: {
                method: function() { return 42; }
              }
            };
          `,
          errors: [
            {
              messageId: 'functionExpressionOnAnonymousObject',
            },
          ],
        },
      ],
    });
  });

  it('should allow arrow functions and method definitions', () => {
    ruleTester.run('no-function-expression-on-anonymous-object', rule, {
      valid: [
        "const obj = { arrow: () => 42 };",
        "const obj = { method() { return 42; } };",
        "const obj = { arrow: (param) => param * 2 };",
      ],
      invalid: [],
    });
  });
});
