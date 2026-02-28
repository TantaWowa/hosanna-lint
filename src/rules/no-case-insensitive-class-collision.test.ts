import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-case-insensitive-class-collision';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-case-insensitive-class-collision', () => {
  it('flags field + method collision (HS-1020)', () => {
    ruleTester.run('no-case-insensitive-class-collision', rule, {
      valid: [],
      invalid: [
        {
          code: 'class A { name = "x"; Name() { return this.name; } }',
          errors: [{ messageId: 'caseInsensitiveCollision' }],
        },
      ],
    });
  });

  it('flags private field case collision', () => {
    ruleTester.run('no-case-insensitive-class-collision', rule, {
      valid: [],
      invalid: [
        {
          code: 'class A { private _defaultLocale = "en-US"; private _DefaultLocale = "fr-FR"; }',
          errors: [{ messageId: 'caseInsensitiveCollision' }],
        },
      ],
    });
  });

  it('does NOT flag getter/setter pair with same name', () => {
    ruleTester.run('no-case-insensitive-class-collision', rule, {
      valid: [
        'class A { get value() { return this._v; } set value(v) { this._v = v; } }',
      ],
      invalid: [],
    });
  });

  it('passes classes with unique member names', () => {
    ruleTester.run('no-case-insensitive-class-collision', rule, {
      valid: [
        'class Foo { getValue() {} setValue() {} }',
        'class Foo { name = ""; age = 0; }',
      ],
      invalid: [],
    });
  });
});
