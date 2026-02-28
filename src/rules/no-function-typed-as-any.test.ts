import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-function-typed-as-any';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-function-typed-as-any', () => {
  it('should pass functions with typed parameters', () => {
    ruleTester.run('no-function-typed-as-any', rule, {
      valid: [
        'function foo(x: number) {}',
        'function foo(cb: () => void) {}',
        'const fn = (x: string) => x;',
        'function foo(x: unknown) {}',
      ],
      invalid: [],
    });
  });

  it('should report functions with any-typed parameters', () => {
    ruleTester.run('no-function-typed-as-any', rule, {
      valid: [],
      invalid: [
        {
          code: 'function foo(x: any) {}',
          errors: [{ messageId: 'functionTypedAsAny', data: { name: 'x' } }],
        },
        {
          code: 'const fn = (cb: any) => cb();',
          errors: [{ messageId: 'functionTypedAsAny', data: { name: 'cb' } }],
        },
        {
          code: 'function foo(a: string, b: any) {}',
          errors: [{ messageId: 'functionTypedAsAny', data: { name: 'b' } }],
        },
      ],
    });
  });
});
