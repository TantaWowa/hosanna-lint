import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsigned-right-shift';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsigned-right-shift', () => {
  it('reports >>> with HS-1119 message', () => {
    ruleTester.run('no-unsigned-right-shift', rule, {
      valid: ['const x = 1 << 2;', 'const x = -1 >> 1;'],
      invalid: [
        {
          code: 'const u = n >>> 0;',
          errors: [{ messageId: 'unsignedRightShift' }],
        },
        {
          code: 'const x = a >>> b;',
          errors: [{ messageId: 'unsignedRightShift' }],
        },
      ],
    });
  });

  it('suppresses with hs:disable-next-line hs-1119', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'no-unsigned-right-shift');
    ruleTester.run('no-unsigned-right-shift', wrapped, {
      valid: [
        `
          // hs:disable-next-line hs-1119
          const u = n >>> 0;
        `,
      ],
      invalid: [],
    });
  });

  it('suppresses with hs:disable-next-line no-unsigned-right-shift', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'no-unsigned-right-shift');
    ruleTester.run('no-unsigned-right-shift', wrapped, {
      valid: [
        `
          // hs:disable-next-line no-unsigned-right-shift
          const u = n >>> 0;
        `,
      ],
      invalid: [],
    });
  });
});
