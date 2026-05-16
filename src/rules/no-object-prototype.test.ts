import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-object-prototype';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-object-prototype', () => {
  it('should pass valid code that avoids Object.prototype methods', () => {
    ruleTester.run('no-object-prototype', rule, {
      valid: [
        'Object.keys(obj);',
        'Object.values(obj);',
        'Object.keys(obj).includes("key");',
      ],
      invalid: [],
    });
  });

  it('should report Object.prototype usage (HS-1077)', () => {
    ruleTester.run('no-object-prototype', rule, {
      valid: [],
      invalid: [
        {
          code: 'const p = Object.prototype;',
          errors: [{ messageId: 'objectPrototypeNotSupported' }],
        },
        {
          code: '(Object.prototype as any).hasOwnProperty.call(obj, "a");',
          errors: [{ messageId: 'objectPrototypeNotSupported' }],
        },
        {
          code: 'Object.prototype.hasOwnProperty.call(obj, "key");',
          errors: [{ messageId: 'objectPrototypeNotSupported' }],
        },
        {
          code: 'Object.prototype.toString.call(obj);',
          errors: [{ messageId: 'objectPrototypeNotSupported' }],
        },
        {
          code: 'obj.hasOwnProperty("a");',
          errors: [{ messageId: 'hasOwnPropertyNotSupported' }],
        },
        {
          code: 'record.hasOwnProperty("key");',
          errors: [{ messageId: 'hasOwnPropertyNotSupported' }],
        },
      ],
    });
  });
});
