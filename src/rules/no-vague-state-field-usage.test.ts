import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-vague-state-field-usage';
import { join } from 'path';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', parser },
});

const typeAwareRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: join(__dirname, '../..'),
    },
  },
});

describe('no-vague-state-field-usage', () => {
  it('without type info, no reports (needs checker for receiver interface)', () => {
    ruleTester.run('no-vague-state-field-usage', rule, {
      valid: [
        `
        interface I { id: string }
        class C implements I { id = ''; }
        declare const x: I;
        x.id;
        `,
      ],
      invalid: [],
    });
  });

  it('flags access via interface when same-file class implements with @state', () => {
    typeAwareRuleTester.run('no-vague-state-field-usage', rule, {
      valid: [
        `
        interface I { id: string }
        class C implements I { id = ''; }
        declare const c: C;
        c.id;
        `,
        `
        interface I { id: string }
        declare const x: I;
        x.id;
        `,
      ],
      invalid: [
        {
          code: `
        function state(_target: object, _key?: string | symbol) {}
        interface ICell { id: string }
        class Cell implements ICell {
          @state id: string = '';
        }
        function read(c: ICell): string {
          return c.id;
        }
        `,
          errors: [{ messageId: 'vagueStateFieldUsage', data: { field: 'id' } }],
        },
      ],
    });
  });
});
