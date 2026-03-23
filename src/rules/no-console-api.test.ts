import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-console-api';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-console-api', () => {
  it('reports console calls', () => {
    ruleTester.run('no-console-api', rule, {
      valid: ['const log = (x: unknown) => {}; log(1);'],
      invalid: [
        {
          code: 'console.log("x");',
          errors: [{ messageId: 'consoleNotSupported', data: { method: 'log' } }],
        },
        {
          code: "console['warn']('y');",
          errors: [{ messageId: 'consoleNotSupported', data: { method: 'warn' } }],
        },
      ],
    });
  });
});
