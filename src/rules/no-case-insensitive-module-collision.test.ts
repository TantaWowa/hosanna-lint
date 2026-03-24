import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-case-insensitive-module-collision';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-case-insensitive-module-collision', () => {
  it('allows distinct names', () => {
    ruleTester.run('no-case-insensitive-module-collision', rule, {
      valid: [
        `import { foo } from './a';
         function bar() {}`,
        `import { Alpha } from './a';
         class Beta {}`,
      ],
      invalid: [],
    });
  });

  it('reports HS-1021 when import alias collides case-insensitively with a declaration', () => {
    ruleTester.run('no-case-insensitive-module-collision', rule, {
      valid: [],
      invalid: [
        {
          code: `import { Something } from './mod';
           function something() { return 1; }`,
          errors: [{ messageId: 'caseInsensitiveModuleCollision' }],
        },
      ],
    });
  });
});
