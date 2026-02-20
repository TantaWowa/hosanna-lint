import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-promise-methods';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-unsupported-promise-methods', () => {
  it('should pass for supported Promise static methods', () => {
    ruleTester.run('no-unsupported-promise-methods', rule, {
      valid: [
        'Promise.resolve(42);',
        'Promise.reject(err);',
        'Promise.all([p1, p2]);',
        'Promise.race([p1, p2]);',
        'Promise.allSettled([p1, p2]);',
        'Promise.any([p1, p2]);',
      ],
      invalid: [],
    });
  });

  it('should pass for supported Promise instance methods', () => {
    ruleTester.run('no-unsupported-promise-methods', rule, {
      valid: [
        'Promise.resolve(42).then((x) => x);',
        'Promise.reject(err).catch(() => {});',
        'Promise.resolve(42).finally(() => {});',
        'new Promise((r) => r()).then(() => {});',
      ],
      invalid: [],
    });
  });

  it('should report errors for unsupported Promise static methods', () => {
    ruleTester.run('no-unsupported-promise-methods', rule, {
      valid: [],
      invalid: [
        {
          code: 'const { promise, resolve, reject } = Promise.withResolvers();',
          errors: [
            {
              messageId: 'promiseStaticMethodNotSupported',
              data: { method: 'withResolvers' },
            },
          ],
        },
        {
          code: 'const result = Promise.try(() => fetch());',
          errors: [
            {
              messageId: 'promiseStaticMethodNotSupported',
              data: { method: 'try' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for unsupported Promise instance methods', () => {
    ruleTester.run('no-unsupported-promise-methods', rule, {
      valid: [],
      invalid: [
        {
          code: 'Promise.resolve(42).foo();',
          errors: [
            {
              messageId: 'promiseInstanceMethodNotSupported',
              data: { method: 'foo' },
            },
          ],
        },
        {
          code: 'new Promise((r) => r()).withResolvers();',
          errors: [
            {
              messageId: 'promiseInstanceMethodNotSupported',
              data: { method: 'withResolvers' },
            },
          ],
        },
      ],
    });
  });
});
