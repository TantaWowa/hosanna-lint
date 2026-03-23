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

  it('does NOT flag comparing two objects when IHsIdentifiable is not in the program (false negative ok)', () => {
    typeAwareRuleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [
        'const a: {id: string} = {id: "a"}; const b: {id: string} = {id: "b"}; a === b;',
      ],
      invalid: [],
    });
  });

  it('flags === on two object types when IHsIdentifiable exists and neither side is assignable (HS-1019)', () => {
    typeAwareRuleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [
        `
        interface IHsIdentifiable { _hid: string }
        interface Box extends IHsIdentifiable {}
        declare const x: Box;
        declare const y: Box;
        x === y;
        `,
      ],
      invalid: [
        {
          code: `
        interface IHsIdentifiable { _hid: string }
        interface Plain { n: number }
        declare const a: Plain;
        declare const b: Plain;
        a === b;
        `,
          errors: [{ messageId: 'objectEqualityHsEqualFallback' }],
        },
      ],
    });
  });

  it('does NOT flag two BRS/SG node types (HS-1114 rule covers)', () => {
    typeAwareRuleTester.run('no-basic-type-binary-comparison', rule, {
      valid: [
        `
        interface ISGROSGNode { id: string }
        declare const a: ISGROSGNode;
        declare const b: ISGROSGNode;
        a === b;
        `,
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
