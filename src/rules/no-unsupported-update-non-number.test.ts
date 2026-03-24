import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import { join } from 'path';
import rule from './no-unsupported-update-non-number';

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

describe('no-unsupported-update-non-number', () => {
  it('allows numeric ++/--', () => {
    ruleTester.run('no-unsupported-update-non-number', rule, {
      valid: [
        `
        let n = 0;
        n++;
        n--;
        `,
      ],
      invalid: [],
    });
  });

  it('reports string ++ (HS-1026)', () => {
    ruleTester.run('no-unsupported-update-non-number', rule, {
      valid: [],
      invalid: [
        {
          code: `
          let str = 'a';
          str++;
          `,
          errors: [{ messageId: 'unsupportedUpdate' }],
        },
      ],
    });
  });
});
