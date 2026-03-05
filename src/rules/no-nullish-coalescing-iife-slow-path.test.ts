import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-nullish-coalescing-iife-slow-path';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-nullish-coalescing-iife-slow-path', () => {
  it('flags ?? when right references left (HS-1113)', () => {
    ruleTester.run('no-nullish-coalescing-iife-slow-path', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = a ?? a + 1;',
          errors: [{ messageId: 'nullishCoalescingIifeSlowPath' }],
        },
        {
          code: 'const x = obj.a ?? obj.a + 1;',
          errors: [{ messageId: 'nullishCoalescingIifeSlowPath' }],
        },
      ],
    });
  });

  it('flags ?? when left or right has function calls', () => {
    ruleTester.run('no-nullish-coalescing-iife-slow-path', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = a ?? getDefault();',
          errors: [{ messageId: 'nullishCoalescingIifeSlowPath' }],
        },
        {
          code: 'const x = getValue() ?? b;',
          errors: [{ messageId: 'nullishCoalescingIifeSlowPath' }],
        },
      ],
    });
  });

  it('does NOT flag safe nullish coalescing', () => {
    ruleTester.run('no-nullish-coalescing-iife-slow-path', rule, {
      valid: [
        'const x = a ?? b;',
        'const x = a ?? 0;',
        'const x = x ?? "default";',
      ],
      invalid: [],
    });
  });
});
