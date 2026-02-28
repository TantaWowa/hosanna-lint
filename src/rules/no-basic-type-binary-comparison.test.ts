import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-basic-type-binary-comparison';
import { join } from 'path';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

const typeAwareRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: join(__dirname, '../..'),
    },
  },
});

describe('no-basic-type-binary-comparison', () => {
  it('without type info, rule is a no-op (all comparisons pass)', () => {
    ruleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [
        'const a: {id: string} = {id: "a"}; const b = "b"; a === b;',
        'const a: {id: string} = {id: "a"}; const b = null; a === b;',
        '"a" === "b";',
        '1 === 2;',
        'true === false;',
      ],
      invalid: [],
    });
  });

  it('flags comparing object/interface to primitive (HS-1019)', () => {
    typeAwareRuleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [],
      invalid: [
        {
          code: 'const a: {id: string} = {id: "a"}; const b = "b"; a === b;',
          errors: [{ messageId: 'nonBasicTypeComparison' }],
        },
        {
          code: 'const a: {id: string} = {id: "a"}; const b = 1; a === b;',
          errors: [{ messageId: 'nonBasicTypeComparison' }],
        },
        {
          code: 'const a: {id: string} = {id: "a"}; const b = true; a === b;',
          errors: [{ messageId: 'nonBasicTypeComparison' }],
        },
      ],
    });
  });

  it('does NOT flag comparing object to null/undefined', () => {
    typeAwareRuleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [
        'const a: {id: string} = {id: "a"}; const b = null; a === b;',
        'const a: {id: string} = {id: "a"}; const b = undefined; a === b;',
      ],
      invalid: [],
    });
  });

  it('does NOT flag comparing two objects (transpiler uses _hid)', () => {
    typeAwareRuleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [
        'const a: {id: string} = {id: "a"}; const b: {id: string} = {id: "b"}; a === b;',
      ],
      invalid: [],
    });
  });

  it('does NOT flag both sides are primitives', () => {
    typeAwareRuleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [
        '"a" === "b";',
        '1 === 2;',
        'true === false;',
      ],
      invalid: [],
    });
  });
});
