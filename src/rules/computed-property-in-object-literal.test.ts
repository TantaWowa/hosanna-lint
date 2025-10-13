import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './computed-property-in-object-literal';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('computed-property-in-object-literal', () => {
  it('should pass valid computed properties (literals and enum references)', () => {
    ruleTester.run('computed-property-in-object-literal', rule, {
      valid: [
        // Regular properties (not computed)
        "const obj = { key: 'value' };",

        // Literal keys (allowed)
        "const obj = { ['literal']: 'value' };",
        "const obj = { [`template`]: 'value' };",
        "const obj = { [123]: 'value' };",
        "const obj = { ['string']: 'value' };",
        "const obj = { [true]: 'value' };",
        "const obj = { [null]: 'value' };",

        // Enum references (allowed)
        "const obj = { [MyEnum.Value]: 'allowed' };",
        "const obj = { [SomeEnum.KEY]: 'allowed' };",
        "const obj = { [Status.ACTIVE]: 'allowed' };",

        // Complex objects with allowed computed properties
        `
          const obj = {
            normal: 'prop',
            ['literal']: 'allowed',
            [MyEnum.VALUE]: 'enum allowed',
            nested: {
              inner: 'value'
            }
          };
        `,
      ],
      invalid: [],
    });
  });

  it('should report errors for invalid computed properties (variables and expressions)', () => {
    ruleTester.run('computed-property-in-object-literal', rule, {
      valid: [],
      invalid: [
        {
          code: "const obj = { [variable]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
        {
          code: "const obj = { [someFunction()]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
        {
          code: "const obj = { [a + b]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
        {
          code: "const obj = { [this.property]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
        {
          code: `
            const obj = {
              normal: 'prop',
              [computed]: 'not allowed',
              ['literal']: 'allowed'
            };
          `,
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
        {
          code: "const obj = { [index]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
        {
          code: "const obj = { [obj.nested.prop]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
        {
          code: "const b = MyEnum.Value; const a = { [b]: 'c' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
            },
          ],
        },
      ],
    });
  });
});
