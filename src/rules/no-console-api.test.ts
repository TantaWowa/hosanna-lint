import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-console-api';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-console-api', () => {
  it('allows transpiler-supported console methods and reports the rest', () => {
    ruleTester.run('no-console-api', rule, {
      valid: [
        'const log = (x: unknown) => {}; log(1);',
        'console.log("x");',
        'console.info("x");',
        'console.debug("x");',
        'console.warn("x");',
        'console.error("x");',
        "console['info']('y');",
        'console.time("t"); console.timeEnd("t");',
        'console.trace(err);',
        'console.transpileError("a", "b");',
      ],
      invalid: [
        {
          code: 'console.clear();',
          errors: [{ messageId: 'consoleNotSupported', data: { method: 'clear' } }],
        },
        {
          code: "console['table']('y');",
          errors: [{ messageId: 'consoleNotSupported', data: { method: 'table' } }],
        },
      ],
    });
  });
});
