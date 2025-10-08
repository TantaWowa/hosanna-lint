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
  it('should pass all array methods since they are now supported', () => {
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
        "Array.from([1, 2, 3]);",
        "Array.of(1, 2, 3);",
        "Array.isArray(arr);",
        "const arr2 = [1, 2, 3]; arr2.find(item => item > 2);",
        "const arr3 = [1, 2, 3]; arr3.findIndex(item => item > 2);",
        "const arr4 = [1, 2, 3]; arr4.includes(2);",
        "const arr5 = [1, 2, 3]; arr5.flat();",
        "const arr6 = [1, 2, 3]; arr6.flatMap(item => [item]);",
        "const arr7 = [1, 2, 3]; arr7.some(item => item > 2);",
        "const arr8 = [1, 2, 3]; arr8.every(item => item > 0);",
        `
          const arr: number[] = [1, 2, 3];
          arr.find(item => item > 2);
        `,
        `
          const arr: Array<string> = ['a', 'b', 'c'];
          arr.some(item => item === 'a');
        `,
        "[1, 2, 3].find(item => item > 2);",
        "[1, 2, 3].every(item => item > 0);",
      ],
      invalid: [],
    });
  });
});
