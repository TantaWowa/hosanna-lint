import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-callfunc-too-many-arguments';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-callfunc-too-many-arguments', () => {
  it('reports CallFunc with more than 6 arguments (HS-1120)', () => {
    ruleTester.run('no-callfunc-too-many-arguments', rule, {
      valid: [
        'o.CallFunc("fn");',
        'o.CallFunc("fn", 1);',
        'o.CallFunc("fn", 1, 2, 3, 4, 5);',
        'o.callFunc("fn", 1, 2, 3, 4, 5);',
        'other(1,2,3,4,5,6,7);',
      ],
      invalid: [
        {
          code: 'o.CallFunc("fn", 1, 2, 3, 4, 5, 6);',
          errors: [{ messageId: 'tooManyArgs' }],
        },
        {
          code: 'o.callFunc("fn", 1, 2, 3, 4, 5, 6);',
          errors: [{ messageId: 'tooManyArgs' }],
        },
        {
          code: 'o?.CallFunc("fn", 1, 2, 3, 4, 5, 6);',
          errors: [{ messageId: 'tooManyArgs' }],
        },
      ],
    });
  });

  it('suppresses with hs:disable-next-line HS-1120', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'no-callfunc-too-many-arguments');
    ruleTester.run('no-callfunc-too-many-arguments', wrapped, {
      valid: [
        `
          // hs:disable-next-line HS-1120
          o.CallFunc("fn", 1, 2, 3, 4, 5, 6);
        `,
      ],
      invalid: [],
    });
  });
});
