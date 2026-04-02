import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import { join } from 'path';
import rule from './no-member-assignment-on-callable-reference';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

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

describe('no-member-assignment-on-callable-reference', () => {
  it('reports HS-1121 for undeclared member assignment on constructor reference', () => {
    typeAwareRuleTester.run('no-member-assignment-on-callable-reference', rule, {
      valid: [
        {
          code: `
            interface I { id: string }
            function ok(o: { x: number }): void { o.x = 1; }
          `,
          filename: 'test.ts',
        },
      ],
      invalid: [
        {
          code: `
            interface I { id: string }
            function bad(clazz: new () => I): void {
              clazz.__meta = {};
            }
          `,
          filename: 'test.ts',
          errors: [{ messageId: 'noMemberOnCallable' }],
        },
      ],
    });
  });

  it('suppresses with hs:disable-next-line HS-1121', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'no-member-assignment-on-callable-reference');
    typeAwareRuleTester.run('no-member-assignment-on-callable-reference', wrapped, {
      valid: [
        {
          code: `
            interface I { id: string }
            function bad(clazz: new () => I): void {
              // hs:disable-next-line HS-1121
              clazz.__meta = {};
            }
          `,
          filename: 'test.ts',
        },
      ],
      invalid: [],
    });
  });
});
