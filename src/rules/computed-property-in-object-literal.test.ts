import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './computed-property-in-object-literal';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const wrappedRule = wrapRuleWithHsDisable(rule, 'computed-property-in-object-literal');

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

  it('should report warnings for computed properties that emit slower code (variables and expressions)', () => {
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

  it('should use message matching transpiler diagnostic (HS-1031)', () => {
    ruleTester.run('computed-property-in-object-literal', rule, {
      valid: [],
      invalid: [
        {
          code: "const obj = { [dynamicKey]: 'value' };",
          errors: [
            {
              messageId: 'computedPropertyInObjectLiteral',
              message: /emit slower code on Roku/,
            },
          ],
        },
      ],
    });
  });

  it('should be suppressed by //hs: disable-next-line', () => {
    ruleTester.run('computed-property-in-object-literal', wrappedRule, {
      valid: [
        "// hs: disable-next-line computed-property-in-object-literal\nconst obj = { [variable]: 'value' };",
        "// hs: disable-next-line hs-1031\nconst obj = { [variable]: 'value' };",
      ],
      invalid: [],
    });
  });

  it('should have rule meta.type suggestion (warning-style)', () => {
    expect(rule.meta?.type).toBe('suggestion');
  });
});
