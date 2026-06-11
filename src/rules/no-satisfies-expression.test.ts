import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-satisfies-expression';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-satisfies-expression', () => {
  it('reports satisfies expressions with HS-1132 message', () => {
    ruleTester.run('no-satisfies-expression', rule, {
      valid: [
        'const obj = { value: 1 } as Shape;',
        'const obj: Shape = { value: 1 };',
      ],
      invalid: [
        {
          code: 'const obj = { value: 1 } satisfies Shape;',
          errors: [{ messageId: 'satisfiesExpressionErased' }],
        },
      ],
    });
  });

  it('suppresses with hs:disable-next-line hs-1132', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'no-satisfies-expression');
    ruleTester.run('no-satisfies-expression', wrapped, {
      valid: [
        `
          // hs:disable-next-line hs-1132
          const obj = { value: 1 } satisfies Shape;
        `,
      ],
      invalid: [],
    });
  });
});
