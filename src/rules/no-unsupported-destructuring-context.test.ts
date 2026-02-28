import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-destructuring-context';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsupported-destructuring-context', () => {
  it('should pass destructuring in variable declarations', () => {
    ruleTester.run('no-unsupported-destructuring-context', rule, {
      valid: [
        'const { a, b } = obj;',
        'const [x, y] = arr;',
        'let { name } = person;',
        'const { a = 1, b = 2 } = obj;',
      ],
      invalid: [],
    });
  });

  it('should pass destructuring in function parameters', () => {
    ruleTester.run('no-unsupported-destructuring-context', rule, {
      valid: [
        'function foo({ a, b }) {}',
        'function foo([x, y]) {}',
        'const fn = ({ a }) => a;',
        'const fn = ([x]) => x;',
      ],
      invalid: [],
    });
  });

  it('should report destructuring in assignment expressions', () => {
    ruleTester.run('no-unsupported-destructuring-context', rule, {
      valid: [],
      invalid: [
        {
          code: '({ a, b } = obj);',
          errors: [{ messageId: 'objectDestructuringUnsupported' }],
        },
        {
          code: '([x, y] = arr);',
          errors: [{ messageId: 'arrayDestructuringUnsupported' }],
        },
      ],
    });
  });
});
