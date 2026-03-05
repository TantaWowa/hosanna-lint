import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-ternary-iife-slow-path';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-ternary-iife-slow-path', () => {
  it('flags ternary when consequent references test variable (HS-1112)', () => {
    ruleTester.run('no-ternary-iife-slow-path', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = s.logoImage ? path + s.logoImage : "";',
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
        {
          code: 'const x = duration > 0 ? progress / duration : 0;',
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
        {
          code: 'const x = a ? a + 1 : 0;',
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
      ],
    });
  });

  it('flags ternary when alternate references test variable', () => {
    ruleTester.run('no-ternary-iife-slow-path', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = a ? 0 : a + 1;',
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
      ],
    });
  });

  it('flags ternary when consequent or alternate has function calls', () => {
    ruleTester.run('no-ternary-iife-slow-path', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = a ? getDefault() : b;',
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
        {
          code: 'const x = a ? b : getDefault();',
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
      ],
    });
  });

  it('does NOT flag safe ternaries', () => {
    ruleTester.run('no-ternary-iife-slow-path', rule, {
      valid: [
        'const x = a ? b : c;',
        'const x = flag ? 1 : 0;',
        'const x = x > 0 ? "yes" : "no";',
      ],
      invalid: [],
    });
  });
});
