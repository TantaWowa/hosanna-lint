import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './promise-static-polyfilled';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('promise-static-polyfilled', () => {
  it('should pass for non-Promise code', () => {
    ruleTester.run('promise-static-polyfilled', rule, {
      valid: [
        'const p = new HsPromise((r) => r());',
        'HsPromise.resolve(42);',
        'const x = someOtherThing.all();',
      ],
      invalid: [],
    });
  });

  it('should warn for Promise static methods (polyfilled by HsPromise)', () => {
    ruleTester.run('promise-static-polyfilled', rule, {
      valid: [],
      invalid: [
        {
          code: 'const p = Promise.resolve(42);',
          errors: [{ messageId: 'promiseStaticPolyfilled', data: { method: 'resolve' } }],
        },
        {
          code: 'const p = Promise.reject(new Error());',
          errors: [{ messageId: 'promiseStaticPolyfilled', data: { method: 'reject' } }],
        },
        {
          code: 'const result = Promise.all([p1, p2]);',
          errors: [{ messageId: 'promiseStaticPolyfilled', data: { method: 'all' } }],
        },
        {
          code: 'const first = Promise.race([p1, p2]);',
          errors: [{ messageId: 'promiseStaticPolyfilled', data: { method: 'race' } }],
        },
        {
          code: 'const settled = Promise.allSettled([p1, p2]);',
          errors: [{ messageId: 'promiseStaticPolyfilled', data: { method: 'allSettled' } }],
        },
        {
          code: 'const anyResult = Promise.any([p1, p2]);',
          errors: [{ messageId: 'promiseStaticPolyfilled', data: { method: 'any' } }],
        },
      ],
    });
  });

  it('should warn for new Promise() constructor', () => {
    ruleTester.run('promise-static-polyfilled', rule, {
      valid: [],
      invalid: [
        {
          code: 'const p = new Promise((resolve, reject) => {});',
          errors: [{ messageId: 'promiseConstructorPolyfilled' }],
        },
      ],
    });
  });
});
