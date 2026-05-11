import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './statement-void-expression-erased';
import { wrapRuleWithHsDisable } from '../utils/hs-disable';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('statement-void-expression-erased', () => {
  it('reports statement-position void expressions', () => {
    ruleTester.run('statement-void-expression-erased', rule, {
      valid: [
        'const value = void getValue();',
        'getValue();',
        'return void getValue();',
      ],
      invalid: [
        {
          code: 'void getValue();',
          errors: [{ messageId: 'statementVoidExpressionErased' }],
        },
        {
          code: 'void this.videoPlayerState.openCastPicker();',
          errors: [{ messageId: 'statementVoidExpressionErased' }],
        },
      ],
    });
  });

  it('suppresses with hs:disable-next-line HS-1125', () => {
    const wrapped = wrapRuleWithHsDisable(rule, 'statement-void-expression-erased');
    ruleTester.run('statement-void-expression-erased', wrapped, {
      valid: [
        `
          // hs:disable-next-line HS-1125
          void getValue();
        `,
      ],
      invalid: [],
    });
  });
});
