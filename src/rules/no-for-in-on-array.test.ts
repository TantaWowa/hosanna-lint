import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-for-in-on-array';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-for-in-on-array', () => {
  it('should allow for...in on objects (non-array)', () => {
    ruleTester.run('no-for-in-on-array', rule, {
      valid: [
        'for (const item of arr) {}',
        'for (let i = 0; i < arr.length; i++) {}',
        'arr.forEach(item => {});',
        'for (const key in someObj) {}',
        'for (const key in unknownVar) {}',
      ],
      invalid: [],
    });
  });

  it('should report for...in on array literals', () => {
    ruleTester.run('no-for-in-on-array', rule, {
      valid: [],
      invalid: [
        {
          code: 'for (const idx in [1, 2, 3]) {}',
          errors: [{ messageId: 'forInOnArray' }],
        },
      ],
    });
  });

  it('should report for...in on variables initialized as arrays', () => {
    ruleTester.run('no-for-in-on-array', rule, {
      valid: [],
      invalid: [
        {
          code: 'const arr = [1, 2]; for (const idx in arr) {}',
          errors: [{ messageId: 'forInOnArray' }],
        },
      ],
    });
  });
});
