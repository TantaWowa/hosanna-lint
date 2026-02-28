import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-logical-expression-limit';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

function generateLogicalChain(count: number): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(`v${i + 1}`);
  }
  return `const result = ${parts.join(' || ')};`;
}

describe('no-logical-expression-limit', () => {
  it('flags more than 32 operands in a logical chain (HS-1036)', () => {
    ruleTester.run('no-logical-expression-limit', rule, {
      valid: [],
      invalid: [
        {
          code: generateLogicalChain(33),
          errors: [{ messageId: 'logicalExpressionExceedsLimit' }],
        },
      ],
    });
  });

  it('does NOT flag fewer than 32 operands', () => {
    ruleTester.run('no-logical-expression-limit', rule, {
      valid: [
        'const x = v1 || v2;',
        'const x = v1?.a || v2 || v3;',
        generateLogicalChain(32),
      ],
      invalid: [],
    });
  });
});
