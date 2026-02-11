import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-json-stringify-space';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-json-stringify-space', () => {
  it('should pass valid JSON.stringify calls without space parameter', () => {
    ruleTester.run('no-json-stringify-space', rule, {
      valid: [
        'const str = JSON.stringify(obj);',
        'const str = JSON.stringify(this.rows);',
        'const str = JSON.stringify(data, null);',
        'const str = JSON.stringify(data, (k, v) => v);',
        'JSON.stringify({});',
        'return JSON.stringify(value);',
      ],
      invalid: [],
    });
  });

  it('should report warnings for JSON.stringify with space parameter', () => {
    ruleTester.run('no-json-stringify-space', rule, {
      valid: [],
      invalid: [
        {
          code: 'const str = JSON.stringify(obj, null, 2);',
          errors: [
            {
              messageId: 'jsonStringifySpaceNotSupported',
            },
          ],
        },
        {
          code: 'this.jsonEditorContent = JSON.stringify(this.rows, null, 2);',
          errors: [
            {
              messageId: 'jsonStringifySpaceNotSupported',
            },
          ],
        },
        {
          code: 'const str = JSON.stringify(obj, null, 4);',
          errors: [
            {
              messageId: 'jsonStringifySpaceNotSupported',
            },
          ],
        },
        {
          code: 'const str = JSON.stringify(obj, null, "  ");',
          errors: [
            {
              messageId: 'jsonStringifySpaceNotSupported',
            },
          ],
        },
        {
          code: 'const str = JSON.stringify(obj, replacer, 2);',
          errors: [
            {
              messageId: 'jsonStringifySpaceNotSupported',
            },
          ],
        },
        {
          code: 'const str = JSON.stringify(obj, null, "\t");',
          errors: [
            {
              messageId: 'jsonStringifySpaceNotSupported',
            },
          ],
        },
      ],
    });
  });
});
