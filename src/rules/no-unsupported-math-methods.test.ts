import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-math-methods';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsupported-math-methods', () => {
  it('should pass supported Math methods (HS-1108)', () => {
    ruleTester.run('no-unsupported-math-methods', rule, {
      valid: [
        'Math.floor(x);',
        'Math.ceil(x);',
        'Math.round(x);',
        'Math.abs(-1);',
        'Math.min(1, 2);',
        'Math.max(1, 2);',
        'Math.pow(2, 3);',
        'Math.sqrt(4);',
        'Math.random();',
        'Math.sin(0);',
        'Math.cos(0);',
        'Math.tan(0);',
        'Math.log(1);',
        'Math.sign(-5);',
        'Math.trunc(1.5);',
        'Math.cbrt(27);',
        'Math.hypot(3, 4);',
        'Math.log10(100);',
        'Math.log2(8);',
        'const x = Math.PI;',
        'const x = Math.E;',
      ],
      invalid: [],
    });
  });

  it('should report unsupported Math methods (HS-1108)', () => {
    ruleTester.run('no-unsupported-math-methods', rule, {
      valid: [],
      invalid: [
        {
          code: '(Math as any).scale();',
          errors: [{ messageId: 'unsupportedMathMethod', data: { name: 'scale' } }],
        },
        {
          code: 'Math.foobar(1);',
          errors: [{ messageId: 'unsupportedMathMethod', data: { name: 'foobar' } }],
        },
      ],
    });
  });
});
