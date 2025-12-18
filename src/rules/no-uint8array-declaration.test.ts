import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-uint8array-declaration';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-uint8array-declaration', () => {
  it('should pass valid code without Uint8Array declarations', () => {
    ruleTester.run('no-uint8array-declaration', rule, {
      valid: [
        'const buffer: roByteArray = new Uint8Array();',
        'const data: number[] = [1, 2, 3];',
        'function process(data: roByteArray): void {}',
        'const arr = new Uint8Array();',
        'interface Test { buffer: roByteArray; }',
      ],
      invalid: [],
    });
  });

  it('should report warnings for variable declarations with Uint8Array type', () => {
    ruleTester.run('no-uint8array-declaration', rule, {
      valid: [],
      invalid: [
        {
          code: 'const buffer: Uint8Array = new Uint8Array();',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
        {
          code: 'let data: Uint8Array;',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
        {
          code: 'var bytes: Uint8Array = new Uint8Array(10);',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report warnings for function parameters with Uint8Array type', () => {
    ruleTester.run('no-uint8array-declaration', rule, {
      valid: [],
      invalid: [
        {
          code: 'function process(buffer: Uint8Array): void {}',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
        {
          code: 'function handle(data: Uint8Array, offset: number): void {}',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
        {
          code: 'const process = (buffer: Uint8Array): void => {};',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report warnings for return type annotations with Uint8Array', () => {
    ruleTester.run('no-uint8array-declaration', rule, {
      valid: [],
      invalid: [
        {
          code: 'function getBuffer(): Uint8Array { return new Uint8Array(); }',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
        {
          code: 'const createBuffer = (): Uint8Array => new Uint8Array();',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report warnings for interface properties with Uint8Array type', () => {
    ruleTester.run('no-uint8array-declaration', rule, {
      valid: [],
      invalid: [
        {
          code: 'interface Test { buffer: Uint8Array; }',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
        {
          code: 'interface Data { bytes: Uint8Array; offset: number; }',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report warnings for class properties with Uint8Array type', () => {
    ruleTester.run('no-uint8array-declaration', rule, {
      valid: [],
      invalid: [
        {
          code: 'class Test { buffer: Uint8Array; }',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report warnings for type aliases with Uint8Array', () => {
    ruleTester.run('no-uint8array-declaration', rule, {
      valid: [],
      invalid: [
        {
          code: 'type Buffer = Uint8Array;',
          errors: [
            {
              messageId: 'uint8ArrayTypeNotSupported',
            },
          ],
        },
      ],
    });
  });
});
