import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-argument-binding';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-argument-binding', () => {
  it('should pass valid function usage', () => {
    ruleTester.run('no-argument-binding', rule, {
      valid: [
        "const bound = func.bind(obj);", // This will be caught by the rule
        "obj.method();",
        "const arrow = () => this.value;",
        "function regular() { return this; }",
        "const call = func.call(obj, arg);",
        "const apply = func.apply(obj, args);",
      ],
      invalid: [],
    });
  });

  it('should report errors for .bind() method calls', () => {
    ruleTester.run('no-argument-binding', rule, {
      valid: [],
      invalid: [
        {
          code: "const bound = func.bind(obj);",
          errors: [
            {
              messageId: 'argumentBindingNotSupported',
            },
          ],
        },
        {
          code: "const partial = add.bind(null, 5);",
          errors: [
            {
              messageId: 'argumentBindingNotSupported',
            },
          ],
        },
        {
          code: "setTimeout(callback.bind(this), 1000);",
          errors: [
            {
              messageId: 'argumentBindingNotSupported',
            },
          ],
        },
        {
          code: "const boundMethod = obj.method.bind(obj);",
          errors: [
            {
              messageId: 'argumentBindingNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should handle method chaining with bind', () => {
    ruleTester.run('no-argument-binding', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = array.map(func.bind(this)).filter(predicate);",
          errors: [
            {
              messageId: 'argumentBindingNotSupported',
            },
          ],
        },
        {
          code: "promise.then(callback.bind(context)).catch(errorHandler);",
          errors: [
            {
              messageId: 'argumentBindingNotSupported',
            },
          ],
        },
      ],
    });
  });
});
