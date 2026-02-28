import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-suboptimal-array-access';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-suboptimal-array-access', () => {
  it('should pass without type info (rule is a no-op)', () => {
    ruleTester.run('no-suboptimal-array-access', rule, {
      valid: [
        'const x = arr[0];',
        'const x = obj["key"];',
        'const x = arr[i];',
      ],
      invalid: [],
    });
  });
});
