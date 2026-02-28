import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-json-stringify-replacer';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-json-stringify-replacer', () => {
  it('should pass JSON.stringify without replacer', () => {
    ruleTester.run('no-json-stringify-replacer', rule, {
      valid: [
        'JSON.stringify(obj);',
        'JSON.stringify(obj, null);',
        'JSON.stringify(obj, undefined);',
        'JSON.stringify(obj, null, 2);',
      ],
      invalid: [],
    });
  });

  it('should report JSON.stringify with replacer', () => {
    ruleTester.run('no-json-stringify-replacer', rule, {
      valid: [],
      invalid: [
        {
          code: 'JSON.stringify(obj, replacer);',
          errors: [{ messageId: 'jsonStringifyReplacerNotSupported' }],
        },
        {
          code: 'JSON.stringify(obj, (key, value) => value);',
          errors: [{ messageId: 'jsonStringifyReplacerNotSupported' }],
        },
        {
          code: 'JSON.stringify(obj, ["key1", "key2"]);',
          errors: [{ messageId: 'jsonStringifyReplacerNotSupported' }],
        },
        {
          code: 'JSON.stringify(obj, myReplacer, 2);',
          errors: [{ messageId: 'jsonStringifyReplacerNotSupported' }],
        },
      ],
    });
  });
});
