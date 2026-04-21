import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-for-in-over-scenegraph-node';
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

describe('no-for-in-over-scenegraph-node', () => {
  it('should no-op without type info', () => {
    ruleTester.run('no-for-in-over-scenegraph-node', rule, {
      valid: [
        'for (const k in obj) {}',
        'for (const k in unknownVar) {}',
      ],
      invalid: [],
    });
  });

  describe('type-aware (HS-1122)', () => {
    it('should warn for-in over ISGROSGNode', () => {
      typeAwareRuleTester.run('no-for-in-over-scenegraph-node', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface ISGROSGNode { id: string; }
              declare const node: ISGROSGNode;
              for (const k in node) {}
            `,
            errors: [{ messageId: 'forInOverSceneGraphNode' }],
          },
        ],
      });
    });

    it('should not warn for-in over a plain record', () => {
      typeAwareRuleTester.run('no-for-in-over-scenegraph-node', rule, {
        valid: [
          `
            declare const o: Record<string, unknown>;
            for (const k in o) {}
          `,
        ],
        invalid: [],
      });
    });
  });
});
