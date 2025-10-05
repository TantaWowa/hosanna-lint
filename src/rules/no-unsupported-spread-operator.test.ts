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
  it('should pass all spread operator usage (rule disabled as placeholder)', () => {
    ruleTester.run('no-unsupported-spread-operator', rule, {
      valid: [
        // Destructuring (always supported)
        "const [a, b, ...rest] = arr;",
        "const { x, y, ...others } = obj;",
        "function test([a, b, ...rest]) { return rest; }",
        "function test({ x, y, ...others }) { return others; }",

        // Spread in function calls (currently allowed)
        "Math.max(...numbers);",
        "console.log('Values:', ...args);",
        "myFunction(a, b, ...rest);",

        // Spread in array literals (currently allowed)
        "const combined = [1, 2, ...arr];",
        "const merged = [...arr1, ...arr2];",
        "const withValues = [0, ...numbers, 100];",

        // Spread in object literals (currently allowed)
        "const mergedObj = { ...obj1, ...obj2 };",
        "const extended = { a: 1, ...defaults };",

        // Complex expressions (currently allowed)
        "const result = func(1, 2, ...getArgs());",
        "const arr = [startValue, ...middleValues.map(x => x * 2), endValue];",
      ],
      invalid: [], // Rule is disabled - no errors reported
    });
  });
});
