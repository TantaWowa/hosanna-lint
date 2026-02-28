import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-compound-assignment';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2021, sourceType: 'module', parser },
});

describe('no-unsupported-compound-assignment', () => {
  it('should pass supported assignment operators', () => {
    ruleTester.run('no-unsupported-compound-assignment', rule, {
      valid: [
        'x = 1;',
        'x += 1;',
        'x -= 1;',
        'x *= 2;',
        'x /= 2;',
      ],
      invalid: [],
    });
  });

  it('should report unsupported compound assignment operators', () => {
    ruleTester.run('no-unsupported-compound-assignment', rule, {
      valid: [],
      invalid: [
        {
          code: 'x ||= 1;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '||=' } }],
        },
        {
          code: 'x &&= 1;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '&&=' } }],
        },
        {
          code: 'x ??= 1;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '??=' } }],
        },
        {
          code: 'x **= 2;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '**=' } }],
        },
        {
          code: 'x %= 2;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '%=' } }],
        },
        {
          code: 'x <<= 1;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '<<=' } }],
        },
        {
          code: 'x >>= 1;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '>>=' } }],
        },
        {
          code: 'x &= 0xff;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '&=' } }],
        },
        {
          code: 'x |= 0xff;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '|=' } }],
        },
        {
          code: 'x ^= 0xff;',
          errors: [{ messageId: 'unsupportedCompoundAssignment', data: { operator: '^=' } }],
        },
      ],
    });
  });
});
