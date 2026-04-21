import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-for-in-unsupported-rhs';
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

describe('no-for-in-unsupported-rhs', () => {
  it('should no-op without type info', () => {
    ruleTester.run('no-for-in-unsupported-rhs', rule, {
      valid: [
        'for (const k in obj) {}',
        'for (const k in unknownVar) {}',
      ],
      invalid: [],
    });
  });

  describe('type-aware (HS-1123)', () => {
    it('should warn for-in over Map', () => {
      typeAwareRuleTester.run('no-for-in-unsupported-rhs', rule, {
        valid: [],
        invalid: [
          {
            code: `
              declare const m: Map<string, number>;
              for (const k in m) {}
            `,
            errors: [{ messageId: 'forInRhsUnsupportedType' }],
          },
        ],
      });
    });

    it('should not warn for-in over a plain record', () => {
      typeAwareRuleTester.run('no-for-in-unsupported-rhs', rule, {
        valid: [
          `
            declare const o: Record<string, unknown>;
            for (const k in o) {}
          `,
        ],
        invalid: [],
      });
    });
  });
});
