import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-too-many-if-else';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

function generateIfElseChain(count: number): string {
  let code = 'if (x === 0) { y = 0; }';
  for (let i = 1; i < count; i++) {
    code += ` else if (x === ${i}) { y = ${i}; }`;
  }
  return code;
}

describe('no-too-many-if-else', () => {
  it('should pass if-else chains with fewer than 250 clauses (HS-1002)', () => {
    ruleTester.run('no-too-many-if-else', rule, {
      valid: [
        'if (x) { a(); } else { b(); }',
        'if (x) { a(); } else if (y) { b(); } else { c(); }',
        generateIfElseChain(250),
      ],
      invalid: [],
    });
  });

  it('should report if-else chains with more than 250 clauses (HS-1002)', () => {
    ruleTester.run('no-too-many-if-else', rule, {
      valid: [],
      invalid: [
        {
          code: generateIfElseChain(251),
          errors: [{ messageId: 'tooManyIfElseClauses', data: { count: '251' } }],
        },
      ],
    });
  });
});
