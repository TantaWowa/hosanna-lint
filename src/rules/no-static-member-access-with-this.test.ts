import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-static-member-access-with-this';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-static-member-access-with-this', () => {
  it('should pass accessing static members via class name', () => {
    ruleTester.run('no-static-member-access-with-this', rule, {
      valid: [
        'class Foo { static bar = 1; method() { Foo.bar; } }',
        'class Foo { instance = 1; method() { this.instance; } }',
        'class Foo { method() { this.nonStatic(); } }',
        // When both static and instance method share a name, this.member resolves to instance - do not flag
        `class HsDate {
          static fromTimestamp(ms: number) { return new HsDate(ms); }
          private fromTimestamp(ms: number) { /* init */ }
          constructor(x: number) { this.fromTimestamp(x); }
        }`,
      ],
      invalid: [],
    });
  });

  it('should report accessing static members via this', () => {
    ruleTester.run('no-static-member-access-with-this', rule, {
      valid: [],
      invalid: [
        {
          code: 'class Foo { static bar = 1; method() { this.bar; } }',
          errors: [{ messageId: 'staticMemberWithThis', data: { member: 'bar' } }],
        },
        {
          code: 'class Foo { static doSomething() {} method() { this.doSomething(); } }',
          errors: [{ messageId: 'staticMemberWithThis', data: { member: 'doSomething' } }],
        },
      ],
    });
  });
});
