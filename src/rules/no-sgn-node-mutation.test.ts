import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-sgn-node-mutation';
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

describe('no-sgn-node-mutation', () => {
  it('should pass without type info (rule is a no-op)', () => {
    ruleTester.run('no-sgn-node-mutation', rule, {
      valid: [
        'node.translation[1] = 100;',
        'obj.myData["foo"] = "bar";',
      ],
      invalid: [],
    });
  });

  describe('type-aware: should WARN when mutating array/object on ISGNNode', () => {
    it('warns for node.translation[1] = 100', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface ISGNNode { translation: number[]; }
              function fn(node: ISGNNode) {
                node.translation[1] = 100;
              }
            `,
            errors: [{ messageId: 'sgnNodeMutation' }],
          },
        ],
      });
    });

    it('warns for node.myData["foo"] = "bar"', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface ISGNNode { myData: Record<string, string>; }
              function fn(node: ISGNNode) {
                node.myData['foo'] = 'bar';
              }
            `,
            errors: [{ messageId: 'sgnNodeMutation' }],
          },
        ],
      });
    });

    it('warns for node.arr[0] = x with array property', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface ISGNNode { arr: string[]; }
              function fn(node: ISGNNode) {
                node.arr[0] = 'x';
              }
            `,
            errors: [{ messageId: 'sgnNodeMutation' }],
          },
        ],
      });
    });
  });

  describe('type-aware: should NOT warn for non-array, non-object property types', () => {
    it('does NOT warn for node.id = 5 (primitive)', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [
          `
            interface ISGNNode { id: string; }
            function fn(node: ISGNNode) {
              node.id = '5';
            }
          `,
        ],
        invalid: [],
      });
    });

    it('does NOT warn for node.count = 10 (number)', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [
          `
            interface ISGNNode { count: number; }
            function fn(node: ISGNNode) {
              node.count = 10;
            }
          `,
        ],
        invalid: [],
      });
    });

    it('does NOT warn for node.visible = true (boolean)', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [
          `
            interface ISGNNode { visible: boolean; }
            function fn(node: ISGNNode) {
              node.visible = true;
            }
          `,
        ],
        invalid: [],
      });
    });
  });

  describe('type-aware: should NOT warn for non-ISGNNode types', () => {
    it('does NOT warn when mutating plain object', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [
          `
            interface PlainObj { data: Record<string, string>; }
            function fn(obj: PlainObj) {
              obj.data['foo'] = 'bar';
            }
          `,
        ],
        invalid: [],
      });
    });

    it('does NOT warn when mutating regular variable with array', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [
          `
            function fn() {
              const arr: number[] = [1, 2, 3];
              arr[1] = 100;
            }
          `,
        ],
        invalid: [],
      });
    });
  });

  describe('type-aware: should NOT warn for direct assignment to node property', () => {
    it('does NOT warn for node.translation = [1,2,3] (replace whole array)', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [
          `
            interface ISGNNode { translation: number[]; }
            function fn(node: ISGNNode) {
              node.translation = [1, 2, 3];
            }
          `,
        ],
        invalid: [],
      });
    });

    it('does NOT warn for node.myData = { foo: "bar" } (replace whole object)', () => {
      typeAwareRuleTester.run('no-sgn-node-mutation', rule, {
        valid: [
          `
            interface ISGNNode { myData: Record<string, string>; }
            function fn(node: ISGNNode) {
              node.myData = { foo: 'bar' };
            }
          `,
        ],
        invalid: [],
      });
    });
  });
});
