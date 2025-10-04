import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-delete-operator';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-unsupported-delete-operator', () => {
  it('should pass valid operations without delete', () => {
    ruleTester.run('no-unsupported-delete-operator', rule, {
      valid: [
        "const obj = { prop: 'value' };",
        "obj.prop = undefined;",
        "obj.prop = null;",
        "delete obj.prop;", // This will be caught by the rule
        "const arr = [1, 2, 3];",
        "arr.length = 0;",
      ],
      invalid: [],
    });
  });

  it('should report errors for delete operator usage', () => {
    ruleTester.run('no-unsupported-delete-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "delete obj.prop;",
          errors: [
            {
              messageId: 'unsupportedDeleteOperator',
            },
          ],
        },
        {
          code: "delete obj['prop'];",
          errors: [
            {
              messageId: 'unsupportedDeleteOperator',
            },
          ],
        },
        {
          code: "delete array[0];",
          errors: [
            {
              messageId: 'unsupportedDeleteOperator',
            },
          ],
        },
        {
          code: "const result = delete obj.method;",
          errors: [
            {
              messageId: 'unsupportedDeleteOperator',
            },
          ],
        },
      ],
    });
  });

  it('should handle complex expressions with delete', () => {
    ruleTester.run('no-unsupported-delete-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "if (delete obj.prop) { console.log('deleted'); }",
          errors: [
            {
              messageId: 'unsupportedDeleteOperator',
            },
          ],
        },
        {
          code: "const deleted = delete this.property;",
          errors: [
            {
              messageId: 'unsupportedDeleteOperator',
            },
          ],
        },
      ],
    });
  });
});
