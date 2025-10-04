import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-computed-properties-in-objects';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-computed-properties-in-objects', () => {
  it('should pass valid object literals with allowed computed properties', () => {
    ruleTester.run('no-computed-properties-in-objects', rule, {
      valid: [
        "const obj = { key: 'value' };",
        "const obj = { ['literal']: 'value' };",
        "const obj = { [`template`]: 'value' };",
        "const obj = { [123]: 'value' };",
        "const obj = { ['string']: 'value' };",
        "const obj = { [MyEnum.Value]: 'allowed' };",
        "const obj = { [SomeEnum.KEY]: 'allowed' };",
        `
          enum MyEnum {
            VALUE = 'value'
          }
          const obj = { [MyEnum.VALUE]: 'allowed' };
        `,
      ],
      invalid: [],
    });
  });

  it('should report errors for disallowed computed properties', () => {
    ruleTester.run('no-computed-properties-in-objects', rule, {
      valid: [],
      invalid: [
        {
          code: "const obj = { [variable]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyRestricted',
            },
          ],
        },
        {
          code: "const obj = { [someFunction()]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyRestricted',
            },
          ],
        },
        {
          code: "const obj = { [a + b]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyRestricted',
            },
          ],
        },
        {
          code: "const obj = { [this.property]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyRestricted',
            },
          ],
        },
      ],
    });
  });

  it('should handle complex object patterns', () => {
    ruleTester.run('no-computed-properties-in-objects', rule, {
      valid: [
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
      invalid: [
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
              messageId: 'computedPropertyRestricted',
            },
          ],
        },
      ],
    });
  });
});
