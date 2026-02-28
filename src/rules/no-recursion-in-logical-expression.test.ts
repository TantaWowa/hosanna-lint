import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-recursion-in-logical-expression';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-recursion-in-logical-expression', () => {
  it('flags function calls in short-circuit logical assignment fallback (HS-1037)', () => {
    ruleTester.run('no-recursion-in-logical-expression', rule, {
      valid: [],
      invalid: [
        {
          code: 'result = v1?.a || getDefaultView();',
          errors: [{ messageId: 'recursionInLogicalExpression' }],
        },
        {
          code: 'x = x || getValue();',
          errors: [{ messageId: 'recursionInLogicalExpression' }],
        },
        {
          code: 'x = x ?? computeDefault();',
          errors: [{ messageId: 'recursionInLogicalExpression' }],
        },
      ],
    });
  });

  it('does NOT flag simple variable references in logical chains', () => {
    ruleTester.run('no-recursion-in-logical-expression', rule, {
      valid: [
        'x = a || b;',
        'x = a ?? b;',
        'x = a || 0;',
        'x = a ?? "default";',
        'x = v1?.a || fallbackVar;',
      ],
      invalid: [],
    });
  });
});
