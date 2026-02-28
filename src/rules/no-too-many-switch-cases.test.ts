import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-too-many-switch-cases';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

function generateSwitchCases(count: number): string {
  let cases = '';
  for (let i = 0; i < count; i++) {
    cases += `case ${i}: break; `;
  }
  return `switch (x) { ${cases} }`;
}

describe('no-too-many-switch-cases', () => {
  it('should pass switch statements with fewer than 255 cases (HS-1003)', () => {
    ruleTester.run('no-too-many-switch-cases', rule, {
      valid: [
        'switch (x) { case 1: break; case 2: break; default: break; }',
        generateSwitchCases(255),
      ],
      invalid: [],
    });
  });

  it('should report switch statements with more than 255 cases (HS-1003)', () => {
    ruleTester.run('no-too-many-switch-cases', rule, {
      valid: [],
      invalid: [
        {
          code: generateSwitchCases(256),
          errors: [{ messageId: 'tooManySwitchCases', data: { count: '256' } }],
        },
      ],
    });
  });
});
