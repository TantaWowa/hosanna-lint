import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-rest-operator';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-rest-operator', () => {
  it('should pass valid function parameters and destructuring without rest', () => {
    ruleTester.run('no-rest-operator', rule, {
      valid: [
        "function regular(a, b, c) {}",
        "const [a, b, c] = arr;",
        "const { x, y, z } = obj;",
        "const func = (a, b) => a + b;",
      ],
      invalid: [],
    });
  });

  it('should report errors for rest parameters in functions', () => {
    ruleTester.run('no-rest-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "function test(...args) {}",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
        {
          code: "const arrow = (...params) => params.length;",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
        {
          code: "const func = function(...rest) { return rest; };",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for rest in array destructuring', () => {
    ruleTester.run('no-rest-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "const [a, b, ...rest] = arr;",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
        {
          code: "const [first, ...others] = array;",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for rest in object destructuring', () => {
    ruleTester.run('no-rest-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "const { a, b, ...rest } = obj;",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
        {
          code: "const { x, ...others } = object;",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should handle complex parameter patterns', () => {
    ruleTester.run('no-rest-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "function complex(a, b, ...rest) { return [a, b, ...rest]; }",
          errors: [
            {
              messageId: 'restOperatorNotSupported',
            },
            {
              messageId: 'restOperatorNotSupported',
            },
          ],
        },
      ],
    });
  });
});
