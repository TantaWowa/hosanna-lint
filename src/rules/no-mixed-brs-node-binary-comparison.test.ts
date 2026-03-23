import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-mixed-brs-node-binary-comparison';
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

describe('no-mixed-brs-node-binary-comparison', () => {
  it('without type info, rule is a no-op', () => {
    ruleTester.run('no-mixed-brs-node-binary-comparison', rule, {
      valid: ['const a = 1; const b = 2; a === b;'],
      invalid: [],
    });
  });

  it('flags comparing ISGROSGNode to non-node (HS-1019 error path)', () => {
    typeAwareRuleTester.run('no-mixed-brs-node-binary-comparison', rule, {
      valid: [],
      invalid: [
        {
          code: `
            interface ISGROSGNode { id: string }
            declare const n: ISGROSGNode;
            declare const o: { x: number };
            n === o;
          `,
          errors: [{ messageId: 'mixedBrsNodeComparison' }],
        },
      ],
    });
  });

  it('does not flag two ISGROSGNode operands', () => {
    typeAwareRuleTester.run('no-mixed-brs-node-binary-comparison', rule, {
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

  it('does not flag SG node vs null (transpiler nullish short-circuit)', () => {
    typeAwareRuleTester.run('no-mixed-brs-node-binary-comparison', rule, {
      valid: [
        `
          interface ISGROSGNode { id: string }
          declare const n: ISGROSGNode;
          n === null;
        `,
      ],
      invalid: [],
    });
  });
});
