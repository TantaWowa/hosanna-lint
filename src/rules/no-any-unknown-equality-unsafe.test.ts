import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-any-unknown-equality-unsafe';
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

describe('no-any-unknown-equality-unsafe', () => {
  it('should pass without type info (rule is a no-op)', () => {
    ruleTester.run('no-any-unknown-equality-unsafe', rule, {
      valid: ['1 === 2;', '"a" === "b";'],
      invalid: [],
    });
  });

  describe('type-aware (HS-1118)', () => {
    it('flags === when union includes unknown and other side is object (e.g. string | unknown)', () => {
      typeAwareRuleTester.run('no-any-unknown-equality-unsafe', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface PlainObject { value: number; }
              function f(o: PlainObject, x: string | unknown) {
                return x === o;
              }
            `,
            errors: [{ messageId: 'anyUnknownEqualityUsesHsEqual' }],
          },
        ],
      });
    });

    it('flags === / !== when any or unknown is involved with non-primitive other side', () => {
      typeAwareRuleTester.run('no-any-unknown-equality-unsafe', rule, {
        valid: [],
        invalid: [
          {
            code: `
              interface PlainObject { value: number; }
              function f(o: PlainObject, x: any) {
                return (x as any) === (o as PlainObject);
              }
            `,
            errors: [{ messageId: 'anyUnknownEqualityUsesHsEqual' }],
          },
          {
            code: `
              const a: any = { v: 1 };
              const b: any = { v: 1 };
              (a as any) === (b as any);
            `,
            errors: [{ messageId: 'anyUnknownEqualityUsesHsEqual' }],
          },
          {
            code: `
              interface PlainObject { value: number; }
              function f(o: PlainObject, u: unknown) {
                return (o as PlainObject) === (u as unknown);
              }
            `,
            errors: [{ messageId: 'anyUnknownEqualityUsesHsEqual' }],
          },
        ],
      });
    });

    it('does not flag when one side is any and the other is a primitive', () => {
      typeAwareRuleTester.run('no-any-unknown-equality-unsafe', rule, {
        valid: [
          `
            function f(x: any) {
              return (x as any) === 5;
            }
          `,
          `
            function f(x: any) {
              return 5 === (x as any);
            }
          `,
        ],
        invalid: [],
      });
    });

    it('does not flag comparison to null or undefined', () => {
      typeAwareRuleTester.run('no-any-unknown-equality-unsafe', rule, {
        valid: [
          `
            function f(x: any) {
              return (x as any) === undefined;
            }
          `,
          `
            function f(x: any) {
              return (x as any) === null;
            }
          `,
        ],
        invalid: [],
      });
    });

    it('does not flag two ISGROSGNode operands (HS-1114)', () => {
      typeAwareRuleTester.run('no-any-unknown-equality-unsafe', rule, {
        valid: [
          `
            interface ISGROSGNode { id: string; }
            declare function CreateObject(type: string, subtype?: string): any;
            const node1: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
            const node2: ISGROSGNode = CreateObject('roSGNode', 'Node') as any;
            node1 === node2;
          `,
        ],
        invalid: [],
      });
    });

    it('does not flag == or !=', () => {
      typeAwareRuleTester.run('no-any-unknown-equality-unsafe', rule, {
        valid: [
          `
            const a: any = {};
            const b: any = {};
            a == b;
          `,
        ],
        invalid: [],
      });
    });
  });
});
