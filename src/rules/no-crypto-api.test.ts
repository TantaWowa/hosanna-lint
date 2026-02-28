import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-crypto-api';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-crypto-api', () => {
  it('should pass valid code (HS-1086)', () => {
    ruleTester.run('no-crypto-api', rule, {
      valid: [
        'HsCrypto.sha256("data");',
        'HsCrypto.getRandomValues(arr);',
        'const x = someObj.crypto;',
      ],
      invalid: [],
    });
  });

  it('should report crypto API usage (HS-1086)', () => {
    ruleTester.run('no-crypto-api', rule, {
      valid: [],
      invalid: [
        {
          code: '(crypto as any).randomUUID();',
          errors: [{ messageId: 'cryptoNotSupported' }],
        },
        {
          code: 'crypto.getRandomValues(new Uint8Array(16));',
          errors: [{ messageId: 'cryptoNotSupported' }],
        },
        {
          code: 'crypto.subtle.digest("SHA-256", data);',
          errors: [{ messageId: 'cryptoNotSupported' }],
        },
        {
          code: 'window.crypto.getRandomValues(arr);',
          errors: [{ messageId: 'cryptoNotSupported' }],
        },
      ],
    });
  });
});
