import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-comparison-brs-node-method';
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

describe('no-comparison-brs-node-method', () => {
  it('should pass without type info (HS-1104: rule is a no-op)', () => {
    ruleTester.run('no-comparison-brs-node-method', rule, {
      valid: [
        'x === undefined;',
        'obj.method === null;',
        '"a" === "b";',
      ],
      invalid: [],
    });
  });

  describe('type-aware (HS-1104: only flags METHODS, not properties)', () => {
    it('should NOT flag comparing ISGROSGNode property like .id (not a method)', () => {
      typeAwareRuleTester.run('no-comparison-brs-node-method', rule, {
        valid: [
          `
            interface ISGROSGNode { id: string; }
            const node: ISGROSGNode = { id: 'abc' };
            node.id === 'x';
          `,
        ],
        invalid: [],
      });
    });
  });
});
