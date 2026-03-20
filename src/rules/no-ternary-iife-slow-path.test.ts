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
          code: "result.message = typeof parsed.message === 'string' ? parsed.message : '';",
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
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

  it('does NOT flag assignment context (a = a ? ... : a) - enables faster if/else emission', () => {
    ruleTester.run('no-ternary-iife-slow-path', rule, {
      valid: [
        'a = a ? 10 / a : a;',
        'x = x ? x + 1 : 0;',
      ],
      invalid: [],
    });
  });

  it('still flags this.prop when branches reference the tested property', () => {
    ruleTester.run('no-ternary-iife-slow-path', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = this.isChecked ? this.isChecked : ViewStatus.Normal;',
          errors: [{ messageId: 'ternaryIifeSlowPath' }],
        },
      ],
    });
  });

  it('does NOT flag this.prop when branches use this.otherProp (different property)', () => {
    ruleTester.run('no-ternary-iife-slow-path', rule, {
      valid: [
        `const viewStatus = this.isChecked
          ? this.activeViewStatus === ViewStatus.Focused
            ? ViewStatus.FocusSelected
            : ViewStatus.Selected
          : this.activeViewStatus === ViewStatus.Focused
            ? ViewStatus.Focused
            : ViewStatus.Normal;`,
      ],
      invalid: [],
    });
  });
});
