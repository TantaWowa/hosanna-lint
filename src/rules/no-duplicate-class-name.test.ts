import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-duplicate-class-name';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-duplicate-class-name', () => {
  it('should pass unique class names within a file', () => {
    ruleTester.run('no-duplicate-class-name', rule, {
      valid: [
        'class MyUniqueClass1 {}',
        'class MyUniqueClass2 {}',
      ],
      invalid: [],
    });
  });
});
