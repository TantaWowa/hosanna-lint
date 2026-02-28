import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-argument-binding';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-argument-binding', () => {
  it('should pass .bind() with only thisArg', () => {
    ruleTester.run('no-argument-binding', rule, {
      valid: [
        'fn.bind(this);',
        'fn.bind(obj);',
        'fn.bind(null);',
        'fn.bind(undefined);',
      ],
      invalid: [],
    });
  });

  it('should report .bind() with argument binding', () => {
    ruleTester.run('no-argument-binding', rule, {
      valid: [],
      invalid: [
        {
          code: 'fn.bind(this, 1, 2);',
          errors: [{ messageId: 'argumentBindingNotSupported' }],
        },
        {
          code: 'fn.bind(null, "arg1");',
          errors: [{ messageId: 'argumentBindingNotSupported' }],
        },
        {
          code: 'obj.method.bind(obj, firstArg);',
          errors: [{ messageId: 'argumentBindingNotSupported' }],
        },
      ],
    });
  });
});
