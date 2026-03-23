import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-ihs-identifiable-binary-comparison';
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

describe('no-ihs-identifiable-binary-comparison', () => {
  it('without type info, rule is a no-op', () => {
    ruleTester.run('no-ihs-identifiable-binary-comparison', rule, {
      valid: ['const a = 1; const b = 2; a === b;'],
      invalid: [],
    });
  });

  it('flags === when both sides are assignable to IHsIdentifiable (HS-1054)', () => {
    typeAwareRuleTester.run('no-ihs-identifiable-binary-comparison', rule, {
      valid: [],
      invalid: [
        {
          code: `
        interface IHsIdentifiable { _hid: string }
        interface Box extends IHsIdentifiable { n: number }
        declare const x: Box;
        declare const y: Box;
        x === y;
        `,
          errors: [{ messageId: 'ihsIdentifiableBinaryComparison' }],
        },
      ],
    });
  });

  it('does NOT flag when only one side is IHsIdentifiable', () => {
    typeAwareRuleTester.run('no-ihs-identifiable-binary-comparison', rule, {
      valid: [
        `
        interface IHsIdentifiable { _hid: string }
        interface Box extends IHsIdentifiable {}
        interface Plain { z: string }
        declare const x: Box;
        declare const y: Plain;
        x === y;
        `,
      ],
      invalid: [],
    });
  });

  it('does NOT flag two plain objects without IHsIdentifiable', () => {
    typeAwareRuleTester.run('no-ihs-identifiable-binary-comparison', rule, {
      valid: [
        `
        interface IHsIdentifiable { _hid: string }
        interface Plain { n: number }
        declare const a: Plain;
        declare const b: Plain;
        a === b;
        `,
      ],
      invalid: [],
    });
  });

  it('does NOT flag two BRS/SG node types', () => {
    typeAwareRuleTester.run('no-ihs-identifiable-binary-comparison', rule, {
      valid: [
        `
        interface IHsIdentifiable { _hid: string }
        interface ISGROSGNode { id: string }
        declare const a: ISGROSGNode;
        declare const b: ISGROSGNode;
        a === b;
        `,
      ],
      invalid: [],
    });
  });
});
