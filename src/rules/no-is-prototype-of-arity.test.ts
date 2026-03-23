import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-is-prototype-of-arity';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-is-prototype-of-arity', () => {
  it('enforces single argument', () => {
    ruleTester.run('no-is-prototype-of-arity', rule, {
      valid: ['Object.prototype.isPrototypeOf({});', 'parent.isPrototypeOf(child);'],
      invalid: [
        {
          code: 'Object.prototype.isPrototypeOf({}, 1);',
          errors: [{ messageId: 'wrongArity', data: { count: '2' } }],
        },
        {
          code: 'proto.isPrototypeOf();',
          errors: [{ messageId: 'wrongArity', data: { count: '0' } }],
        },
      ],
    });
  });
});
