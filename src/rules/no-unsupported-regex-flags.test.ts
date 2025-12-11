import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-regex-flags';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-unsupported-regex-flags', () => {
  it('should pass supported regex flags', () => {
    ruleTester.run('no-unsupported-regex-flags', rule, {
      valid: [
        '/pattern/',
        '/pattern/g',
        '/pattern/i',
        '/pattern/m',
        '/pattern/gim',
        '/pattern/gmi',
        'new RegExp("pattern")',
        'new RegExp("pattern", "g")',
        'new RegExp("pattern", "i")',
        'new RegExp("pattern", "m")',
        'new RegExp("pattern", "gim")',
        'RegExp("pattern")',
        'RegExp("pattern", "g")',
        'RegExp("pattern", "i")',
        'RegExp("pattern", "m")',
        'RegExp("pattern", "gim")',
      ],
      invalid: [],
    });
  });

  it('should report warnings for unsupported flag u', () => {
    ruleTester.run('no-unsupported-regex-flags', rule, {
      valid: [],
      invalid: [
        {
          code: '/pattern/u',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
        {
          code: '/pattern/gu',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
        {
          code: '/pattern/ui',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
        {
          code: 'new RegExp("pattern", "u")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
        {
          code: 'new RegExp("pattern", "gu")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
        {
          code: 'RegExp("pattern", "u")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
        {
          code: 'RegExp("pattern", "gu")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
      ],
    });
  });

  it('should report warnings for unsupported flag y', () => {
    ruleTester.run('no-unsupported-regex-flags', rule, {
      valid: [],
      invalid: [
        {
          code: '/pattern/y',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: '/pattern/gy',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: '/pattern/yi',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: 'new RegExp("pattern", "y")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: 'new RegExp("pattern", "gy")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: 'RegExp("pattern", "y")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: 'RegExp("pattern", "gy")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
      ],
    });
  });

  it('should report warnings for both u and y flags', () => {
    ruleTester.run('no-unsupported-regex-flags', rule, {
      valid: [],
      invalid: [
        {
          code: '/pattern/uy',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: '/pattern/guy',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: 'new RegExp("pattern", "uy")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
        {
          code: 'RegExp("pattern", "uy")',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
      ],
    });
  });

  it('should handle template literals for flags', () => {
    ruleTester.run('no-unsupported-regex-flags', rule, {
      valid: [
        'new RegExp("pattern", `g`)',
        'RegExp("pattern", `g`)',
      ],
      invalid: [
        {
          code: 'new RegExp("pattern", `u`)',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'u' },
            },
          ],
        },
        {
          code: 'RegExp("pattern", `y`)',
          errors: [
            {
              messageId: 'unsupportedRegexFlag',
              data: { flag: 'y' },
            },
          ],
        },
      ],
    });
  });

  it('should not report errors for variables (dynamic flags)', () => {
    ruleTester.run('no-unsupported-regex-flags', rule, {
      valid: [
        'const flags = "u"; new RegExp("pattern", flags)',
        'const flags = "y"; RegExp("pattern", flags)',
        'const flags = getFlags(); new RegExp("pattern", flags)',
      ],
      invalid: [],
    });
  });
});

