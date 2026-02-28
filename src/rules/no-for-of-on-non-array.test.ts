import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-for-of-on-non-array';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-for-of-on-non-array', () => {
  it('should pass for-of on arrays and strings (without type info, rule is a no-op)', () => {
    ruleTester.run('no-for-of-on-non-array', rule, {
      valid: [
        'for (const item of [1, 2, 3]) {}',
        'for (const item of arr) {}',
        'const arr = [1, 2]; for (const v of arr) {}',
        'for (const c of "hello") {}',
        // Generic with array constraint: T extends readonly unknown[]
        `function race<T extends readonly unknown[]>(values: T) {
          for (const value of values) {}
        }`,
      ],
      invalid: [],
    });
  });
});
