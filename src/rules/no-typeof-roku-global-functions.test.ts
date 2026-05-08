import { describe } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-typeof-roku-global-functions';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module', parser },
});

describe('no-typeof-roku-global-functions', () => {
  ruleTester.run('no-typeof-roku-global-functions', rule, {
    valid: [
      'typeof callback === "function";',
      'typeof obj.someCallback === "function";',
      'typeof obj.GetGlobalAA === "function";',
      'GetGlobalAA();',
      'const value = (globalThis as any).notARokuGlobal;',
    ],
    invalid: [
      {
        code: 'if (typeof GetGlobalAA !== "function") { throw new Error("missing"); }',
        errors: [{ messageId: 'typeofRokuGlobal', data: { name: 'GetGlobalAA' } }],
      },
      {
        code: 'const hasCreateObject = typeof CreateObject === "function";',
        errors: [{ messageId: 'typeofRokuGlobal', data: { name: 'CreateObject' } }],
      },
      {
        code: 'const GetGlobalAA = (globalThis as any).GetGlobalAA; if (typeof GetGlobalAA === "function") GetGlobalAA();',
        errors: [{ messageId: 'typeofRokuGlobal', data: { name: 'GetGlobalAA' } }],
      },
      {
        code: 'if (typeof (globalThis as any).GetGlobalAA === "function") GetGlobalAA();',
        errors: [{ messageId: 'typeofRokuGlobal', data: { name: 'GetGlobalAA' } }],
      },
      {
        code: 'if (typeof globalThis["WriteAsciiFile"] === "function") WriteAsciiFile("tmp:/x", "x");',
        errors: [{ messageId: 'typeofRokuGlobal', data: { name: 'WriteAsciiFile' } }],
      },
    ],
  });
});
