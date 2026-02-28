import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-too-many-nots';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-too-many-nots', () => {
  it('flags 4+ sequential nots (HS-1060)', () => {
    ruleTester.run('no-too-many-nots', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = !!!!a;',
          errors: [{ messageId: 'tooManyNots' }],
        },
      ],
    });
  });

  it('does NOT flag 3 or fewer sequential nots', () => {
    ruleTester.run('no-too-many-nots', rule, {
      valid: [
        'const x = !a;',
        'const x = !!a;',
        'const x = !!!a;',
      ],
      invalid: [],
    });
  });

  it('does NOT flag when brackets reset the count', () => {
    ruleTester.run('no-too-many-nots', rule, {
      valid: [
        'const x = !(!!!a && !!!b);',
      ],
      invalid: [],
    });
  });
});
