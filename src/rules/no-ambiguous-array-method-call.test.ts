import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import { join } from 'path';
import rule from './no-ambiguous-array-method-call';

const ruleTester = new RuleTester({
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

describe('no-ambiguous-array-method-call', () => {
  it('flags array methods on any receiver (HS-1069)', () => {
    ruleTester.run('no-ambiguous-array-method-call', rule, {
      valid: [],
      invalid: [
        {
          code: `
          const obj = { not: 'an array' };
          (obj as any).find((x: number) => x > 2);
          `,
          errors: [{ messageId: 'ambiguousArrayMethod' }],
        },
      ],
    });
  });
});
