import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-unsupported-json-functions';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-unsupported-json-functions', () => {
  it('should pass supported JSON methods', () => {
    ruleTester.run('no-unsupported-json-functions', rule, {
      valid: [
        'JSON.parse(str);',
        'JSON.stringify(obj);',
      ],
      invalid: [],
    });
  });

  it('should report unsupported JSON methods', () => {
    ruleTester.run('no-unsupported-json-functions', rule, {
      valid: [],
      invalid: [
        {
          code: 'JSON.rawJSON(str);',
          errors: [{ messageId: 'unsupportedJsonFunction', data: { name: 'rawJSON' } }],
        },
        {
          code: 'JSON.isRawJSON(obj);',
          errors: [{ messageId: 'unsupportedJsonFunction', data: { name: 'isRawJSON' } }],
        },
      ],
    });
  });
});
