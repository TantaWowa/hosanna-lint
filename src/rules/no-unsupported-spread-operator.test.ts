import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-spread-operator';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-unsupported-spread-operator', () => {
  it('should pass destructuring assignments (supported)', () => {
    ruleTester.run('no-unsupported-spread-operator', rule, {
      valid: [
        "const [a, b, ...rest] = arr;",
        "const { x, y, ...others } = obj;",
        "function test([a, b, ...rest]) { return rest; }",
        "function test({ x, y, ...others }) { return others; }",
      ],
      invalid: [],
    });
  });

  it('should report errors for spread in function calls', () => {
    ruleTester.run('no-unsupported-spread-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "Math.max(...numbers);",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
        {
          code: "console.log('Values:', ...args);",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
        {
          code: "myFunction(a, b, ...rest);",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for spread in array literals', () => {
    ruleTester.run('no-unsupported-spread-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "const combined = [1, 2, ...arr];",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
        {
          code: "const merged = [...arr1, ...arr2];",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
        {
          code: "const withValues = [0, ...numbers, 100];",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for spread in object literals', () => {
    ruleTester.run('no-unsupported-spread-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "const merged = { ...obj1, ...obj2 };",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
        {
          code: "const extended = { a: 1, ...defaults };",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
      ],
    });
  });

  it('should handle complex expressions', () => {
    ruleTester.run('no-unsupported-spread-operator', rule, {
      valid: [],
      invalid: [
        {
          code: "const result = func(1, 2, ...getArgs());",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
        {
          code: "const arr = [startValue, ...middleValues.map(x => x * 2), endValue];",
          errors: [
            {
              messageId: 'spreadInUnsupportedContext',
            },
          ],
        },
      ],
    });
  });
});
