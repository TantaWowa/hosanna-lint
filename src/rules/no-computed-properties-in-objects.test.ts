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
  it('should pass all object literals as placeholder rule', () => {
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
        "const obj = { [variable]: 'value' };",
        "const obj = { [someFunction()]: 'value' };",
        "const obj = { [a + b]: 'value' };",
        "const obj = { [this.property]: 'value' };",
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
        `
          const obj = {
            normal: 'prop',
            [computed]: 'not allowed',
            ['literal']: 'allowed'
          };
        `,
      ],
      invalid: [],
    });
  });
});
