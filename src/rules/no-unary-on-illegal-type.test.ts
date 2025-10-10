import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unary-on-illegal-type';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-unary-on-illegal-type', () => {
  it('should pass valid code with unary operators on numeric types', () => {
    ruleTester.run('no-unary-on-illegal-type', rule, {
      valid: [
        // Numeric literals
        "const num = +42;",
        "const neg = -42;",
        "const bitwise = ~42;",

        // Variables (we can't type-check these)
        "const result = +someVar;",
        "const negResult = -someVar;",
        "const bitwiseResult = ~someVar;",

        // Function calls
        "const num = +getNumber();",
        "const neg = -getNumber();",
        "const bitwise = ~getNumber();",

        // Logical NOT (should be allowed on any type)
        "const inverted = !someVar;",
        "const invertedBool = !true;",
        "const invertedString = !'hello';",

        // Typeof and void (should be allowed on any type)
        "const type = typeof someVar;",
        "const undef = void someVar;",

        // Delete operator (should be allowed)
        "delete obj.prop;",
      ],
      invalid: [],
    });
  });

  it('should report errors for unary + on illegal types', () => {
    ruleTester.run('no-unary-on-illegal-type', rule, {
      valid: [],
      invalid: [
        {
          code: "const num = +'hello';",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '+', type: 'string literals' },
            },
          ],
        },
        {
          code: "const num = +true;",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '+', type: 'boolean literals' },
            },
          ],
        },
        {
          code: "const num = +false;",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '+', type: 'boolean literals' },
            },
          ],
        },
        {
          code: "const num = +{};",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '+', type: 'object literals' },
            },
          ],
        },
        {
          code: "const num = +[];",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '+', type: 'array literals' },
            },
          ],
        },
        {
          code: "const num = +null;",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '+', type: 'null' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for unary - on illegal types', () => {
    ruleTester.run('no-unary-on-illegal-type', rule, {
      valid: [],
      invalid: [
        {
          code: "const num = -'hello';",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '-', type: 'string literals' },
            },
          ],
        },
        {
          code: "const num = -true;",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '-', type: 'boolean literals' },
            },
          ],
        },
        {
          code: "const num = -{};",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '-', type: 'object literals' },
            },
          ],
        },
        {
          code: "const num = -[];",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '-', type: 'array literals' },
            },
          ],
        },
        {
          code: "const num = -null;",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '-', type: 'null' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for bitwise NOT (~) on illegal types', () => {
    ruleTester.run('no-unary-on-illegal-type', rule, {
      valid: [],
      invalid: [
        {
          code: "const num = ~'hello';",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '~', type: 'string literals' },
            },
          ],
        },
        {
          code: "const num = ~true;",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '~', type: 'boolean literals' },
            },
          ],
        },
        {
          code: "const num = ~{};",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '~', type: 'object literals' },
            },
          ],
        },
        {
          code: "const num = ~[];",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '~', type: 'array literals' },
            },
          ],
        },
        {
          code: "const num = ~null;",
          errors: [
            {
              messageId: 'unaryOnIllegalType',
              data: { operator: '~', type: 'null' },
            },
          ],
        },
      ],
    });
  });

  it('should not flag logical NOT, typeof, void, or delete operators', () => {
    ruleTester.run('no-unary-on-illegal-type', rule, {
      valid: [
        "const inverted = !'hello';",
        "const invertedBool = !true;",
        "const invertedObj = !{};",
        "const invertedNull = !null;",
        "const type = typeof 'hello';",
        "const typeBool = typeof true;",
        "const typeObj = typeof {};",
        "const typeNull = typeof null;",
        "const undef = void 'hello';",
        "const undefBool = void true;",
        "const undefObj = void {};",
        "const undefNull = void null;",
      ],
      invalid: [],
    });
  });
});
