import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-getter-setter-mismatch';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-getter-setter-mismatch', () => {
  it('should pass classes without getter/setter mismatches (without type info, rule is a no-op)', () => {
    ruleTester.run('no-getter-setter-mismatch', rule, {
      valid: [
        'class Foo { get name() { return ""; } set name(v) {} }',
        'class Foo { name = "hello"; }',
      ],
      invalid: [],
    });
  });
});
