import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsafe-number-parsing';
import { join } from 'path';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
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

describe('no-unsafe-number-parsing', () => {
  it('should pass when using isNaN() to check (HS-1105: result validated)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [
        'const n = Number(x); if (isNaN(n)) return 0;',
        'if (isNaN(Number(input))) { return false; }',
        'if (isNaN(parseInt(str))) { return 0; }',
        'if (isNaN(parseFloat(str))) { return 0; }',
        'const valid = !isNaN(Number(value));',
        '!isNaN(Number(key));',
        '!isNaN(parseFloat("3.14"));',
      ],
      invalid: [],
    });
  });

  it('should pass when using Number.isNaN() to check (HS-1105: result validated)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [
        'const ok = Number.isNaN(Number("x"));',
        'if (Number.isNaN(parseFloat(str))) { return 0; }',
        'const valid = !Number.isNaN(Number(key));',
        'Number.isNaN(Number("x"));',
      ],
      invalid: [],
    });
  });

  it('should pass when using || fallback (HS-1105: fallback protects NaN)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [
        'const n = Number(x) || 0;',
        'const n = parseInt(str) || 0;',
        'const n = parseFloat(str) || 0;',
        'const n = Number(x) || defaultValue;',
        'Number(rect.height) || 50;',
        'parseInt("x") || 0;',
      ],
      invalid: [],
    });
  });

  it('should pass when using ?? fallback (HS-1105: fallback protects NaN)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [
        'const n = Number(x) ?? 0;',
        'const n = parseInt(str) ?? 0;',
        'const n = parseFloat(str) ?? 0;',
        'parseFloat("x") ?? 0;',
        'Number("x") ?? 0;',
      ],
      invalid: [],
    });
  });

  it('should pass when using ternary condition', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [
        'const n = Number(x) ? Number(x) : 0;',
        'const n = parseInt(str) ? parseInt(str) : 0;',
        'const n = parseFloat(str) ? parseFloat(str) : 0;',
      ],
      invalid: [],
    });
  });

  it('should pass when .toFixed is used with safe fallback (HS-1105)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [
        'const s = (Number(x) || 0).toFixed(2);',
        'const s = (parseFloat(str) ?? 0).toFixed(2);',
        'const s = (parseInt(str) ?? 0).toFixed(2);',
        '(3.14).toFixed(2) || "0.00";',
      ],
      invalid: [],
    });
  });

  it('should report Number() without NaN handling (HS-1105)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [],
      invalid: [
        {
          code: 'const n = Number(x);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number()' },
            },
          ],
        },
        {
          code: 'return Number(input);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number()' },
            },
          ],
        },
        {
          code: 'const result = Number(getValue());',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number()' },
            },
          ],
        },
        {
          code: 'Number("123");',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number()' },
            },
          ],
        },
        {
          code: '0 || Number("123");',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number()' },
            },
          ],
        },
      ],
    });
  });

  it('should report parseInt() without NaN handling (HS-1105)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [],
      invalid: [
        {
          code: 'parseInt("42");',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'parseInt()' },
            },
          ],
        },
        {
          code: 'const n = parseInt(str);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'parseInt()' },
            },
          ],
        },
        {
          code: 'Number.parseInt("42", 10);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number.parseInt()' },
            },
          ],
        },
        {
          code: 'const n = Number.parseInt(str);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number.parseInt()' },
            },
          ],
        },
      ],
    });
  });

  it('should report parseFloat() without NaN handling (HS-1105)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [],
      invalid: [
        {
          code: 'parseFloat("3.14");',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'parseFloat()' },
            },
          ],
        },
        {
          code: 'const n = parseFloat(str);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'parseFloat()' },
            },
          ],
        },
        {
          code: 'Number.parseFloat("3.14");',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number.parseFloat()' },
            },
          ],
        },
        {
          code: 'const n = Number.parseFloat(str);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number.parseFloat()' },
            },
          ],
        },
      ],
    });
  });

  it('should report .toFixed() on Number/parseInt/parseFloat without NaN handling', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [],
      invalid: [
        {
          code: 'const s = Number(x).toFixed(2);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number().toFixed()' },
            },
          ],
        },
        {
          code: 'const s = parseInt(str).toFixed(2);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'parseInt().toFixed()' },
            },
          ],
        },
        {
          code: 'const s = parseFloat(str).toFixed(2);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'parseFloat().toFixed()' },
            },
          ],
        },
      ],
    });
  });

  it('should report .toFixed() on variable receiver (could be NaN)', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [],
      invalid: [
        {
          code: 'const x = 3.14159; const s = x.toFixed(2);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'toFixed' },
            },
          ],
        },
        {
          code: 'const b = Number("foo"); const c = b + 1; const d = c.toFixed(2);',
          errors: [
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'Number()' },
            },
            {
              messageId: 'unsafeNumberParsing',
              data: { name: 'toFixed' },
            },
          ],
        },
      ],
    });
  });

  it('should not report unrelated code', () => {
    ruleTester.run('no-unsafe-number-parsing', rule, {
      valid: [
        'const x = 42;',
        'const s = (3.14).toFixed(2);', // number literal - safe, no parsing
        'Math.floor(3.14);',
        'JSON.parse(str);',
      ],
      invalid: [],
    });
  });

  describe('type-aware (with parserOptions.project)', () => {
    it('should report .toFixed() on number-typed variable', () => {
      typeAwareRuleTester.run('no-unsafe-number-parsing', rule, {
        valid: [],
        invalid: [
          {
            code: `
              const x: number = 3.14;
              const s = x.toFixed(2);
            `,
            errors: [
              {
                messageId: 'unsafeNumberParsing',
                data: { name: 'toFixed' },
              },
            ],
          },
        ],
      });
    });
  });
});
