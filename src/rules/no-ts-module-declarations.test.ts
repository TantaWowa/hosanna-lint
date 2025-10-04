import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-ts-module-declarations';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-ts-module-declarations', () => {
  it('should pass valid TypeScript code without module declarations', () => {
    ruleTester.run('no-ts-module-declarations', rule, {
      valid: [
        "const x: number = 42;",
        "interface User { name: string; }",
        "class MyClass { constructor() {} }",
        "function myFunction(): void {}",
        "export const value = 42;",
        "import { Component } from 'react';",
      ],
      invalid: [],
    });
  });

  it('should report errors for TSModuleDeclaration', () => {
    ruleTester.run('no-ts-module-declarations', rule, {
      valid: [],
      invalid: [
        {
          code: "declare module 'myModule' { export const value: string; }",
          errors: [
            {
              messageId: 'tsModuleDeclarationNotSupported',
            },
          ],
        },
        {
          code: "module MyModule { export const value = 42; }",
          errors: [
            {
              messageId: 'tsModuleDeclarationNotSupported',
            },
          ],
        },
        {
          code: "declare global { const globalValue: string; }",
          errors: [
            {
              messageId: 'tsModuleDeclarationNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should report errors for TSModuleBlock', () => {
    ruleTester.run('no-ts-module-declarations', rule, {
      valid: [],
      invalid: [
        {
          code: `
            module MyModule {
              export const value = 42;
              function helper() { return value; }
            }
          `,
          errors: [
            {
              messageId: 'tsModuleBlockNotSupported',
            },
          ],
        },
        {
          code: `
            declare module 'external' {
              export function externalFunction(): void;
              export interface ExternalInterface {
                prop: string;
              }
            }
          `,
          errors: [
            {
              messageId: 'tsModuleBlockNotSupported',
            },
          ],
        },
      ],
    });
  });

  it('should handle namespace declarations', () => {
    ruleTester.run('no-ts-module-declarations', rule, {
      valid: [],
      invalid: [
        {
          code: `
            namespace MyNamespace {
              export const value = 42;
              export function func() { return value; }
            }
          `,
          errors: [
            {
              messageId: 'tsModuleDeclarationNotSupported',
            },
            {
              messageId: 'tsModuleBlockNotSupported',
            },
          ],
        },
      ],
    });
  });
});
