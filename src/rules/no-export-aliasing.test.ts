import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-export-aliasing';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-export-aliasing', () => {
  it('should pass valid code without export aliasing', () => {
    ruleTester.run('no-export-aliasing', rule, {
      valid: [
        "export const myFunction = () => {};",
        "export function myFunction() {}",
        "export class MyClass {}",
        "export { myFunction };",
        "export { myFunction as default };",
        "const myVar = 42; export { myVar };",
      ],
      invalid: [],
    });
  });

  it('should report errors for export aliasing', () => {
    ruleTester.run('no-export-aliasing', rule, {
      valid: [],
      invalid: [
        {
          code: "export = myFunction;",
          errors: [
            {
              messageId: 'exportAliasingNotSupported',
            },
          ],
        },
        {
          code: "const myClass = class {}; export = myClass;",
          errors: [
            {
              messageId: 'exportAliasingNotSupported',
            },
          ],
        },
        {
          code: `
            namespace MyNamespace {
              export const value = 42;
            }
            export = MyNamespace;
          `,
          errors: [
            {
              messageId: 'exportAliasingNotSupported',
            },
          ],
        },
      ],
    });
  });
});
