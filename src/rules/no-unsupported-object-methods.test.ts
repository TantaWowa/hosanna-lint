import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-object-methods';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsupported-object-methods', () => {
  it('should pass supported Object methods (HS-1051)', () => {
    ruleTester.run('no-unsupported-object-methods', rule, {
      valid: [
        'Object.keys(obj);',
        'Object.values(obj);',
        'Object.entries(obj);',
        'Object.assign({}, obj);',
        'Object.defineProperty(obj, "key", {});',
        'Object.defineProperties(obj, {});',
        'Object.getOwnPropertyNames(obj);',
      ],
      invalid: [],
    });
  });

  it('should report unsupported Object methods (HS-1051)', () => {
    ruleTester.run('no-unsupported-object-methods', rule, {
      valid: [],
      invalid: [
        {
          code: 'Object.is(obj1, obj2);',
          errors: [{ messageId: 'unsupportedObjectMethod', data: { method: 'is' } }],
        },
        {
          code: 'Object.create(null);',
          errors: [{ messageId: 'unsupportedObjectMethod', data: { method: 'create' } }],
        },
        {
          code: 'Object.freeze(obj);',
          errors: [{ messageId: 'unsupportedObjectMethod', data: { method: 'freeze' } }],
        },
      ],
    });
  });
});
