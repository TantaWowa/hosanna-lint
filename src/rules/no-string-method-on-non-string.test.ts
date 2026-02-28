import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-string-method-on-non-string';
import { join } from 'path';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

const typeAwareRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: join(__dirname, '../..'),
    },
  },
});

describe('no-string-method-on-non-string', () => {
  it('should pass without type info (HS-1106: rule is a no-op)', () => {
    ruleTester.run('no-string-method-on-non-string', rule, {
      valid: [
        '"hello".toUpperCase();',
        'str.toLowerCase();',
        // slice, indexOf shared with Array - do NOT flag
        'arr.slice(0, 5);',
        'arr.indexOf(1);',
        // hasOwnProperty is not a string method
        "obj.hasOwnProperty('a');",
        // toString on concrete types is fine
        'n.toString();',
        'x.toString();',
        'arr.includes("a");',
        'arr.concat([1, 2]);',
        'arr.at(0);',
      ],
      invalid: [],
    });
  });

  describe('type-aware (HS-1106)', () => {
    it('should NOT flag class with own repeat() method', () => {
      typeAwareRuleTester.run('no-string-method-on-non-string', rule, {
        valid: [
          `
            class MyString {
              repeat(n: number): string { return ''; }
            }
            const m = new MyString();
            m.repeat(3);
          `,
        ],
        invalid: [],
      });
    });
  });
});
