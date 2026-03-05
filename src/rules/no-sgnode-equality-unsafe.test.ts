import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-sgnode-equality-unsafe';
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

describe('no-sgnode-equality-unsafe', () => {
  it('should pass without type info (rule is a no-op)', () => {
    ruleTester.run('no-sgnode-equality-unsafe', rule, {
      valid: [
        'const a: any = {}; const b: any = {}; a === b;',
        '"a" === "b";',
        '1 === 2;',
      ],
      invalid: [],
    });
  });

  describe('type-aware (HS-1114: flags SGNode === SGNode)', () => {
    it('should flag comparing two ISGROSGNode instances', () => {
      typeAwareRuleTester.run('no-sgnode-equality-unsafe', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface ISGROSGNode { id: string; }
              declare function CreateObject(type: string, subtype?: string): any;
              const node1: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
              const node2: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
              node1 === node2;
            `,
            errors: [{ messageId: 'sgnodeEqualityUsesHsEqual' }],
          },
          {
            code: `
              interface ISGROSGNode { id: string; }
              declare function CreateObject(type: string, subtype?: string): any;
              const node1: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
              const node2: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
              node1 !== node2;
            `,
            errors: [{ messageId: 'sgnodeEqualityUsesHsEqual' }],
          },
        ],
      });
    });

    it('should flag comparing ISGNContentNode (extends ISGROSGNode) instances', () => {
      typeAwareRuleTester.run('no-sgnode-equality-unsafe', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface ISGROSGNode { id: string; }
              interface ISGNContentNode extends ISGROSGNode { content: string; }
              declare function CreateObject(type: string, subtype?: string): any;
              const node1: ISGNContentNode = CreateObject('roSGNode', 'Node') as any;
              const node2: ISGNContentNode = CreateObject('roSGNode', 'Node') as any;
              node1 === node2;
            `,
            errors: [{ messageId: 'sgnodeEqualityUsesHsEqual' }],
          },
        ],
      });
    });

    it('should NOT flag comparing SGNode to null/undefined', () => {
      typeAwareRuleTester.run('no-sgnode-equality-unsafe', rule, {
        valid: [
          `
            interface ISGROSGNode { id: string; }
            declare function CreateObject(type: string, subtype?: string): any;
            const node: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
            node === null;
          `,
          `
            interface ISGROSGNode { id: string; }
            declare function CreateObject(type: string, subtype?: string): any;
            const node: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
            node === undefined;
          `,
        ],
        invalid: [],
      });
    });

    it('should NOT flag comparing plain objects', () => {
      typeAwareRuleTester.run('no-sgnode-equality-unsafe', rule, {
        valid: [
          `
            interface PlainObject { id: string; }
            const a: PlainObject = { id: 'a' };
            const b: PlainObject = { id: 'b' };
            a === b;
          `,
        ],
        invalid: [],
      });
    });

    it('should NOT flag comparing SGNode property (not instance)', () => {
      typeAwareRuleTester.run('no-sgnode-equality-unsafe', rule, {
        valid: [
          `
            interface ISGROSGNode { id: string; }
            const node: ISGROSGNode = { id: 'abc' } as any;
            node.id === 'x';
          `,
        ],
        invalid: [],
      });
    });
  });
});
