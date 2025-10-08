import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-enum-dereferencing';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-enum-dereferencing', () => {
  it('should pass valid enum usage', () => {
    ruleTester.run('no-enum-dereferencing', rule, {
      valid: [
        // Direct enum access (allowed)
        "enum Colors { red = 'red', blue = 'blue' }; const color = Colors.red;",
        // Enum in object literals (allowed)
        "enum Colors { red = 'red', blue = 'blue' }; const obj = { [Colors.red]: 'value' };",
        // Regular object access (not enums)
        "const obj = { red: 'red' }; console.log(obj['red']);",
        // Non-enum identifiers
        "const colors = { red: 'red' }; console.log(colors['red']);",
      ],
      invalid: [],
    });
  });

  it('should report errors for enum dereferencing', () => {
    ruleTester.run('no-enum-dereferencing', rule, {
      valid: [],
      invalid: [
        {
          code: "enum Colors { red = 'red', blue = 'blue' }; console.log(Colors[somecolor]);",
          errors: [
            {
              messageId: 'enumDereferencingNotSupported',
              data: { enumName: 'Colors', property: 'somecolor' },
            },
          ],
        },
        {
          code: "enum Status { active = 1, inactive = 0 }; const value = Status[key];",
          errors: [
            {
              messageId: 'enumDereferencingNotSupported',
              data: { enumName: 'Status', property: 'key' },
            },
          ],
        },
        {
          code: `
            enum Colors { red = 'red', blue = 'blue' }
            const colorName = 'red';
            const color = Colors[colorName];
          `,
          errors: [
            {
              messageId: 'enumDereferencingNotSupported',
              data: { enumName: 'Colors', property: 'colorName' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for Object methods on enums', () => {
    ruleTester.run('no-enum-dereferencing', rule, {
      valid: [],
      invalid: [
        {
          code: "enum Colors { red = 'red', blue = 'blue' }; Object.keys(Colors);",
          errors: [
            {
              messageId: 'objectKeysOnEnum',
              data: { enumName: 'Colors' },
            },
          ],
        },
        {
          code: "enum Status { active = 1, inactive = 0 }; Object.values(Status);",
          errors: [
            {
              messageId: 'objectValuesOnEnum',
              data: { enumName: 'Status' },
            },
          ],
        },
        {
          code: "enum Priority { high = 1, low = 2 }; Object.entries(Priority);",
          errors: [
            {
              messageId: 'objectEntriesOnEnum',
              data: { enumName: 'Priority' },
            },
          ],
        },
      ],
    });
  });

  it('should report errors for for...in loops on enums', () => {
    ruleTester.run('no-enum-dereferencing', rule, {
      valid: [],
      invalid: [
        {
          code: "enum Colors { red = 'red', blue = 'blue' }; for (const key in Colors) { console.log(key); }",
          errors: [
            {
              messageId: 'forInOnEnum',
              data: { enumName: 'Colors' },
            },
          ],
        },
        {
          code: `
            enum Status { active = 1, inactive = 0 }
            for (const value in Status) {
              console.log(value);
            }
          `,
          errors: [
            {
              messageId: 'forInOnEnum',
              data: { enumName: 'Status' },
            },
          ],
        },
      ],
    });
  });

  it('should handle multiple enums and mixed usage', () => {
    ruleTester.run('no-enum-dereferencing', rule, {
      valid: [],
      invalid: [
        {
          code: `
            enum Colors { red = 'red', blue = 'blue' }
            enum Status { active = 1, inactive = 0 }

            // Valid usage
            const color = Colors.red;
            const status = Status.active;

            // Invalid usage
            const colorValue = Colors[somecolor];
            const keys = Object.keys(Status);
          `,
          errors: [
            {
              messageId: 'enumDereferencingNotSupported',
              data: { enumName: 'Colors', property: 'somecolor' },
            },
            {
              messageId: 'objectKeysOnEnum',
              data: { enumName: 'Status' },
            },
          ],
        },
      ],
    });
  });
});
