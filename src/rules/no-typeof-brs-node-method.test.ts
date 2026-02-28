import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-typeof-brs-node-method';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-typeof-brs-node-method', () => {
  it('should pass typeof on regular values (without type info, rule is a no-op)', () => {
    ruleTester.run('no-typeof-brs-node-method', rule, {
      valid: [
        'typeof someString;',
        'typeof obj.method;',
        'typeof x;',
      ],
      invalid: [],
    });
  });
});
