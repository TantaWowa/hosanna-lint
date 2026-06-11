import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './logical-compound-assignment-lowered';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2021, sourceType: 'module', parser },
});

describe('logical-compound-assignment-lowered', () => {
  it('reports logical compound assignment lowering', () => {
    ruleTester.run('logical-compound-assignment-lowered', rule, {
      valid: [
        'x = y;',
        'x += y;',
        'x || y;',
        'x ?? y;',
      ],
      invalid: [
        {
          code: 'x ||= y;',
          errors: [{ messageId: 'logicalCompoundAssignmentLowered', data: { operator: '||=' } }],
        },
        {
          code: 'x &&= y;',
          errors: [{ messageId: 'logicalCompoundAssignmentLowered', data: { operator: '&&=' } }],
        },
        {
          code: 'x ??= y;',
          errors: [{ messageId: 'logicalCompoundAssignmentLowered', data: { operator: '??=' } }],
        },
      ],
    });
  });
});
