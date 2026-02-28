import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-vague-state-field-usage';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-vague-state-field-usage', () => {
  it('should pass regular field access (without type info / decorator analysis, rule is a no-op)', () => {
    ruleTester.run('no-vague-state-field-usage', rule, {
      valid: [
        'obj.field;',
        'this.name;',
        'instance.getValue();',
      ],
      invalid: [],
    });
  });
});
