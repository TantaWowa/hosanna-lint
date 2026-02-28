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
  it('should pass supported array instance methods', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [
        'const arr = [1, 2, 3]; arr.push(4);',
        'const arr = [1, 2, 3]; arr.pop();',
        'const arr = [1, 2, 3]; arr.shift();',
        'const arr = [1, 2, 3]; arr.unshift(0);',
        'const arr = [1, 2, 3]; arr.splice(1, 1);',
        'const arr = [1, 2, 3]; arr.slice(0, 2);',
        'const arr = [1, 2, 3]; arr.join(",");',
        'const arr = [1, 2, 3]; arr.sort();',
        'const arr = [1, 2, 3]; arr.reverse();',
        'const arr = [1, 2, 3]; arr.concat([4, 5]);',
        'const arr = [1, 2, 3]; arr.indexOf(2);',
        'const arr = [1, 2, 3]; arr.lastIndexOf(3);',
        'const arr = [1, 2, 3]; arr.forEach(item => item);',
        'const arr = [1, 2, 3]; arr.map(item => item * 2);',
        'const arr = [1, 2, 3]; arr.filter(item => item > 2);',
        'const arr = [1, 2, 3]; arr.reduce((sum, item) => sum + item, 0);',
        'const arr = [1, 2, 3]; arr.find(item => item > 2);',
        'const arr = [1, 2, 3]; arr.findIndex(item => item > 2);',
        'const arr = [1, 2, 3]; arr.includes(2);',
        'const arr = [1, 2, 3]; arr.flat();',
        'const arr = [1, 2, 3]; arr.flatMap(item => [item]);',
        'const arr = [1, 2, 3]; arr.some(item => item > 2);',
        'const arr = [1, 2, 3]; arr.every(item => item > 0);',
        'const arr = [1, 2, 3]; arr.keys();',
        'const arr = [1, 2, 3]; arr.values();',
        'const arr = [1, 2, 3]; arr.entries();',
        '[1, 2, 3].find(item => item > 2);',
        '[1, 2, 3].every(item => item > 0);',
      ],
      invalid: [],
    });
  });

  it('should pass supported Array static methods', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [
        'Array.from([1, 2, 3]);',
        'Array.of(1, 2, 3);',
        'Array.isArray([]);',
      ],
      invalid: [],
    });
  });

  it('should pass supported typed array methods', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [
        'const arr: number[] = [1, 2, 3]; arr.find(item => item > 2);',
        'const arr: Array<string> = ["a", "b"]; arr.some(item => item === "a");',
      ],
      invalid: [],
    });
  });

  it('should report unsupported array instance methods', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [],
      invalid: [
        {
          code: 'const arr = [1, 2, 3]; arr.copyWithin(0, 1);',
          errors: [{ messageId: 'unsupportedArrayInstanceMethod', data: { method: 'copyWithin' } }],
        },
        {
          code: 'const arr = [1, 2, 3]; arr.fill(0);',
          errors: [{ messageId: 'unsupportedArrayInstanceMethod', data: { method: 'fill' } }],
        },
        {
          code: '[1, 2, 3].copyWithin(0, 1);',
          errors: [{ messageId: 'unsupportedArrayInstanceMethod', data: { method: 'copyWithin' } }],
        },
        {
          code: 'const arr: number[] = [1, 2, 3]; arr.fill(0);',
          errors: [{ messageId: 'unsupportedArrayInstanceMethod', data: { method: 'fill' } }],
        },
      ],
    });
  });

  it('should not flag methods on non-array objects', () => {
    ruleTester.run('no-unsupported-array-methods', rule, {
      valid: [
        'const obj = {}; obj.copyWithin();',
        'someObj.fill(0);',
      ],
      invalid: [],
    });
  });
});
