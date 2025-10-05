import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './no-union-expression-in-non-statement';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('no-union-expression-in-non-statement', () => {
  it('should pass valid uses of ++ and --', () => {
    ruleTester.run('no-union-expression-in-non-statement', rule, {
      valid: [
        // As standalone statements
        "let x = 5; x++;",
        "let y = 10; y--;",
        "count++;",
        "index--;",

        // On property access
        "this.value++;",
        "obj.counter--;",
        "node.id++;",
        "data.length--;",
        "this.items[index]++;", // This should be allowed as it's on a property access

        // Other expressions that don't use ++ or --
        "let a = b + c;",
        "func();",
        "const arr = [1, 2, 3];",
      ],
      invalid: [],
    });
  });

  it('should report errors for invalid uses of ++ and --', () => {
    ruleTester.run('no-union-expression-in-non-statement', rule, {
      valid: [],
      invalid: [
        // In assignments
        {
          code: "let x = y++;",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },
        {
          code: "const result = count--;",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },

        // In function calls
        {
          code: "func(x++);",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },
        {
          code: "console.log(value--);",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },

        // In binary expressions
        {
          code: "let sum = a + b++;",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },
        {
          code: "if (count-- > 0) {}",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },

        // In return statements
        {
          code: "return index++;",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },

        // In array literals
        {
          code: "const arr = [x++, y];",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },

        // In object literals
        {
          code: "const obj = { value: count-- };",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },
      ],
    });
  });

  it('should handle various contexts correctly', () => {
    ruleTester.run('no-union-expression-in-non-statement', rule, {
      valid: [
        // Nested property access should be allowed
        "this.nested.object.property++;",
        "data.items[index].value--;",

        // Multiple statements
        `
          let x = 5;
          x++;
          x--;
          this.value++;
        `,
      ],
      invalid: [
        // Complex expression with ++
        {
          code: "let result = (x++) + y;",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },
        // ++ in ternary
        {
          code: "const value = condition ? x++ : y;",
          errors: [
            {
              messageId: 'incrementDecrementOnlyInStatements',
            },
          ],
        },
      ],
    });
  });
});
