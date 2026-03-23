import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-delete-operator';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsupported-delete-operator', () => {
  it('allows delete on member expressions', () => {
    ruleTester.run('no-unsupported-delete-operator', rule, {
      valid: ['delete obj.prop;', "delete obj['prop'];", 'delete arr[0];'],
      invalid: [],
    });
  });

  it('reports delete on non-member', () => {
    ruleTester.run('no-unsupported-delete-operator', rule, {
      valid: [],
      invalid: [
        {
          code: 'delete x;',
          errors: [{ messageId: 'unsupportedDelete' }],
        },
      ],
    });
  });
});
