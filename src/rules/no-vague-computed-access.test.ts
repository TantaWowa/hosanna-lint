import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-vague-computed-access';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-vague-computed-access', () => {
  it('should pass regular member access (without type info, rule is a no-op)', () => {
    ruleTester.run('no-vague-computed-access', rule, {
      valid: [
        'obj.field;',
        'obj["literal"];',
        'arr[0];',
        'obj[key];',
      ],
      invalid: [],
    });
  });
});
