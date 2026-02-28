import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-buffer-api';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-buffer-api', () => {
  it('should pass valid code without Buffer (HS-1085)', () => {
    ruleTester.run('no-buffer-api', rule, {
      valid: [
        'const data = HsCrypto.base64Encode("hello");',
        'const hash = HsCrypto.sha256("data");',
      ],
      invalid: [],
    });
  });

  it('should report Buffer usage (HS-1085)', () => {
    ruleTester.run('no-buffer-api', rule, {
      valid: [],
      invalid: [
        {
          code: 'const b = Buffer;',
          errors: [{ messageId: 'bufferNotSupported' }],
        },
        {
          code: 'new Buffer(10);',
          errors: [{ messageId: 'bufferNotSupported' }],
        },
        {
          code: '(Buffer as any).from("abc");',
          errors: [{ messageId: 'bufferNotSupported' }],
        },
        {
          code: 'Buffer.from("hello");',
          errors: [{ messageId: 'bufferNotSupported' }],
        },
        {
          code: 'Buffer.alloc(10);',
          errors: [{ messageId: 'bufferNotSupported' }],
        },
      ],
    });
  });
});
