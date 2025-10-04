import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-array-methods';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-unsupported-array-methods', () => {
  it('should pass supported array methods', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [
        "const arr = [1, 2, 3];",
        "arr.push(4);",
        "arr.pop();",
        "arr.shift();",
        "arr.unshift(0);",
        "arr.splice(1, 1);",
        "arr.slice(0, 2);",
        "arr.join(',');",
        "arr.sort();",
        "arr.reverse();",
        "arr.concat([4, 5]);",
        "arr.indexOf(2);",
        "arr.lastIndexOf(3);",
        "arr.forEach(item => console.log(item));",
        "arr.map(item => item * 2);",
        "arr.filter(item => item > 2);",
        "arr.reduce((sum, item) => sum + item, 0);",
      ],
      invalid: [],
    });
  });

  it('should report errors for unsupported Array static methods', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [],
      invalid: [
        {
          code: "Array.from([1, 2, 3]);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'from' },
            },
          ],
        },
        {
          code: "Array.of(1, 2, 3);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'of' },
            },
          ],
        },
        {
          code: "Array.isArray(arr);", // This is actually supported, but let's test the detection
          errors: [], // Should not trigger since isArray is not in our unsupported list
        },
      ],
    });
  });

  it('should report errors for unsupported array instance methods', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [],
      invalid: [
        {
          code: "const arr = [1, 2, 3]; arr.find(item => item > 2);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'find' },
            },
          ],
        },
        {
          code: "const arr = [1, 2, 3]; arr.findIndex(item => item > 2);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'findIndex' },
            },
          ],
        },
        {
          code: "const arr = [1, 2, 3]; arr.includes(2);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'includes' },
            },
          ],
        },
        {
          code: "const arr = [1, 2, 3]; arr.flat();",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'flat' },
            },
          ],
        },
        {
          code: "const arr = [1, 2, 3]; arr.flatMap(item => [item]);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'flatMap' },
            },
          ],
        },
      ],
    });
  });

  it('should handle typed arrays', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [],
      invalid: [
        {
          code: `
            const arr: number[] = [1, 2, 3];
            arr.find(item => item > 2);
          `,
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'find' },
            },
          ],
        },
        {
          code: `
            const arr: Array<string> = ['a', 'b', 'c'];
            arr.some(item => item === 'a');
          `,
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'some' },
            },
          ],
        },
      ],
    });
  });

  it('should handle array literals directly', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [],
      invalid: [
        {
          code: "[1, 2, 3].find(item => item > 2);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'find' },
            },
          ],
        },
        {
          code: "[1, 2, 3].every(item => item > 0);",
          errors: [
            {
              messageId: 'unsupportedArrayMethod',
              data: { method: 'every' },
            },
          ],
        },
      ],
    });
  });
});
