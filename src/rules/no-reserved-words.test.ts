import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-reserved-words';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-reserved-words', () => {
  it('should pass valid variable names', () => {
    ruleTester.run('no-reserved-words', rule, {
      valid: [
        "const myVariable = 42;",
        "let userName = 'john';",
        "function calculateTotal() { return 42; }",
        "const isValid = true;",
        "class MyComponent { method() {} }",
      ],
      invalid: [],
    });
  });

  it('should report errors for reserved words as variables', () => {
    ruleTester.run('no-reserved-words', rule, {
      valid: [],
      invalid: [
        {
          code: "const if = 42;",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'if' },
            },
          ],
        },
        {
          code: "let then = 'value';",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'then' },
            },
          ],
        },
        {
          code: "var function = 'test';",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'function' },
            },
          ],
        },
        {
          code: "const invalid = null;",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'invalid' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for reserved words as function names', () => {
    ruleTester.run('no-reserved-words', rule, {
      valid: [],
      invalid: [
        {
          code: "function if() { return 42; }",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'if' },
            },
          ],
        },
        {
          code: "function end() { return 'done'; }",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'end' },
            },
          ],
        },
        {
          code: "function sub() { return 1; }",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'sub' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for reserved words as parameters', () => {
    ruleTester.run('no-reserved-words', rule, {
      valid: [],
      invalid: [
        {
          code: "function test(if) { return if; }",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'if' },
            },
          ],
        },
        {
          code: "const arrow = (then) => then + 1;",
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'then' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for reserved words as class members', () => {
    ruleTester.run('no-reserved-words', rule, {
      valid: [],
      invalid: [
        {
          code: `
            class MyClass {
              if = 42;
            }
          `,
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'if' },
            },
          ],
        },
        {
          code: `
            class MyClass {
              then() { return 42; }
            }
          `,
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'then' },
            },
          ],
        },
      ],
    });
  });

  it('should handle case-insensitive matching', () => {
    ruleTester.run('no-reserved-words', rule, {
      valid: [],
      invalid: [
        {
          code: "const IF = 42;", // uppercase
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'IF' },
            },
          ],
        },
        {
          code: "const If = 42;", // mixed case
          errors: [
            {
              messageId: 'reservedWordUsed',
              data: { word: 'If' },
            },
          ],
        },
      ],
    });
  });
});
